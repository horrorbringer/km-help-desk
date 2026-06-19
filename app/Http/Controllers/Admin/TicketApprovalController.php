<?php

namespace App\Http\Controllers\Admin;

use App\Constants\ApprovalLevelConstants;
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
    public function show(Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);

        return redirect()->route('admin.tickets.show', $ticket);
    }

    /**
     * Approve a ticket
     */
    public function approve(Request $request, TicketApproval $approval): RedirectResponse
    {
        $user = Auth::user();

        // Check if approval is still pending
        if ($approval->status !== 'pending') {
            return redirect()
                ->route('admin.tickets.show', $approval->ticket)
                ->with('error', 'This approval has already been '.$approval->status.'.');
        }

        // Prevent approving tickets that are already resolved, closed, or cancelled
        $ticket = $approval->ticket;
        if (in_array($ticket->status, ['resolved', 'closed', 'cancelled'])) {
            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('error', 'Cannot approve a ticket that is already '.$ticket->status.'.');
        }

        // Validate authorization: user must be authorized to approve at this level
        if (! $this->workflowService->canApprove($approval, $user)) {
            abort(403, 'You are not authorized to approve this ticket at the '.ApprovalLevelConstants::getLabel($approval->approval_level).' level.');
        }

        // Check if previous approvals in sequence are approved (prevent out-of-order approval)
        if (! $this->validateApprovalSequence($ticket, $approval)) {
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

        // Check if approval is still pending
        if ($approval->status !== 'pending') {
            return redirect()
                ->route('admin.tickets.show', $approval->ticket)
                ->with('error', 'This approval has already been '.$approval->status.'.');
        }

        // Prevent rejecting tickets that are already resolved, closed, or cancelled
        $ticket = $approval->ticket;
        if (in_array($ticket->status, ['resolved', 'closed', 'cancelled'])) {
            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('error', 'Cannot reject a ticket that is already '.$ticket->status.'.');
        }

        // Validate authorization: user must be authorized to reject at this level
        if (! $this->workflowService->canApprove($approval, $user)) {
            abort(403, 'You are not authorized to reject this ticket at the '.ApprovalLevelConstants::getLabel($approval->approval_level).' level.');
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
        $user = Auth::user();
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
            ->orderBy('created_at', 'desc')
            ->when(
                ! $user->can('tickets.assign'),
                fn ($query) => $query->where('approver_id', $user->id)
            )
            ->paginate(20);

        return Inertia::render('Admin/Tickets/PendingApprovals', [
            'approvals' => $pendingApprovals,
        ]);
    }

    /**
     * Validate that previous approvals in sequence are approved
     * Prevents approving out of order (e.g., approving HOD before LM)
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
