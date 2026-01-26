<?php

namespace App\Http\Controllers\Admin;

use App\Constants\ApprovalLevelConstants;
use App\Constants\RoleConstants;
use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Services\ApprovalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TicketApprovalController extends Controller
{
    protected ApprovalWorkflowService $workflowService;

    public function __construct(ApprovalWorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    /**
     * Show approval interface for a ticket
     */
    public function show(Ticket $ticket): Response
    {
        abort_unless(Auth::user()->can('tickets.view'), 403);

        $ticket->load([
            'approvals.approver',
            'approvals.routedToTeam',
            'requester',
            'assignedTeam',
        ]);

        return Inertia::render('Admin/Tickets/Approval', [
            'ticket' => $ticket,
            'pendingApprovals' => $ticket->pendingApprovals,
            'currentApproval' => $ticket->currentApproval,
        ]);
    }

    /**
     * Approve a ticket
     */
    public function approve(Request $request, TicketApproval $approval): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user->can('tickets.edit'), 403);

        // Check if approval is still pending
        if ($approval->status !== 'pending') {
            return redirect()
                ->route('admin.tickets.show', $approval->ticket)
                ->with('error', 'This approval has already been ' . $approval->status . '.');
        }

        // Prevent approving tickets that are already resolved, closed, or cancelled
        $ticket = $approval->ticket;
        if (in_array($ticket->status, ['resolved', 'closed', 'cancelled'])) {
            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('error', 'Cannot approve a ticket that is already ' . $ticket->status . '.');
        }

        // Validate authorization: user must be authorized to approve at this level
        if (!$this->authorizeApproval($approval, $user)) {
            abort(403, 'You are not authorized to approve this ticket at the ' . ApprovalLevelConstants::getLabel($approval->approval_level) . ' level.');
        }

        // Check if previous approvals in sequence are approved (prevent out-of-order approval)
        if (!$this->validateApprovalSequence($ticket, $approval)) {
            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('error', 'Cannot approve: previous approvals in the workflow must be completed first.');
        }

        $validated = $request->validate([
            'comments' => ['nullable', 'string', 'max:1000'],
            'routed_to_team_id' => ['nullable', 'exists:departments,id'],
        ]);

        $this->workflowService->approve(
            $approval,
            $validated['comments'] ?? null,
            $validated['routed_to_team_id'] ?? null
        );

        return redirect()
            ->route('admin.tickets.show', $approval->ticket)
            ->with('success', 'Ticket approved successfully.');
    }

    /**
     * Reject a ticket
     */
    public function reject(Request $request, TicketApproval $approval): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user->can('tickets.edit'), 403);

        // Check if approval is still pending
        if ($approval->status !== 'pending') {
            return redirect()
                ->route('admin.tickets.show', $approval->ticket)
                ->with('error', 'This approval has already been ' . $approval->status . '.');
        }

        // Prevent rejecting tickets that are already resolved, closed, or cancelled
        $ticket = $approval->ticket;
        if (in_array($ticket->status, ['resolved', 'closed', 'cancelled'])) {
            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('error', 'Cannot reject a ticket that is already ' . $ticket->status . '.');
        }

        // Validate authorization: user must be authorized to reject at this level
        if (!$this->authorizeApproval($approval, $user)) {
            abort(403, 'You are not authorized to reject this ticket at the ' . ApprovalLevelConstants::getLabel($approval->approval_level) . ' level.');
        }

        $validated = $request->validate([
            'comments' => ['required', 'string', 'max:1000'],
        ]);

        $this->workflowService->reject($approval, $validated['comments']);

        return redirect()
            ->route('admin.tickets.show', $approval->ticket)
            ->with('success', 'Ticket rejected successfully.');
    }

    /**
     * Get pending approvals for current user
     * Excludes resolved, closed, and cancelled tickets (no action needed)
     */
    public function pending(): Response
    {
        $pendingApprovals = TicketApproval::with([
            'ticket.requester',
            'ticket.category',
            'ticket.assignedTeam',
        ])
        ->where('status', 'pending')
        ->whereHas('ticket', function ($query) {
            // Exclude tickets that are resolved, closed, or cancelled
            // These tickets don't need approval action anymore
            $query->whereNotIn('status', ['resolved', 'closed', 'cancelled']);
        })
        ->where(function ($query) {
            $query->where('approver_id', Auth::id())
                ->orWhereNull('approver_id');
        })
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        return Inertia::render('Admin/Tickets/PendingApprovals', [
            'approvals' => $pendingApprovals,
        ]);
    }

    /**
     * Authorize user to approve/reject at the approval level
     * 
     * @param TicketApproval $approval
     * @param \App\Models\User $user
     * @return bool
     */
    protected function authorizeApproval(TicketApproval $approval, $user): bool
    {
        // Super Admin can always approve/reject
        if ($user->hasRole(RoleConstants::SUPER_ADMIN)) {
            return true;
        }

        // Check if user is the assigned approver
        if ($approval->approver_id && $approval->approver_id === $user->id) {
            return true;
        }

        // Check if user has admin/assign permission (can override)
        if ($user->can('tickets.assign')) {
            return true;
        }

        // Check if user has the required role for this approval level
        $requiredRoles = ApprovalLevelConstants::getRolesForLevel($approval->approval_level);
        foreach ($requiredRoles as $role) {
            if ($user->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validate that previous approvals in sequence are approved
     * Prevents approving out of order (e.g., approving HOD before LM)
     * 
     * @param Ticket $ticket
     * @param TicketApproval $approval
     * @return bool
     */
    protected function validateApprovalSequence(Ticket $ticket, TicketApproval $approval): bool
    {
        // Get current approval's sequence number
        $currentSequence = $approval->sequence;

        // Check if there are any previous approvals in sequence that are not approved
        $previousApprovals = $ticket->approvals()
            ->where('sequence', '<', $currentSequence)
            ->where('status', '!=', 'approved')
            ->exists();

        // If there are unapproved previous approvals, sequence is invalid
        if ($previousApprovals) {
            return false;
        }

        return true;
    }
}
