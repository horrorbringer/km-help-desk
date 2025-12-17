<?php

namespace App\Http\Controllers\Admin;

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
        abort_unless(Auth::user()->can('tickets.edit'), 403);

        // Prevent approving tickets that are already resolved, closed, or cancelled
        $ticket = $approval->ticket;
        if (in_array($ticket->status, ['resolved', 'closed', 'cancelled'])) {
            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('error', 'Cannot approve a ticket that is already ' . $ticket->status . '.');
        }

        // Check if user is the approver or has admin rights
        if ($approval->approver_id && $approval->approver_id !== Auth::id()) {
            if (!Auth::user()->can('tickets.assign')) {
                abort(403, 'You are not authorized to approve this ticket.');
            }
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
        abort_unless(Auth::user()->can('tickets.edit'), 403);

        // Prevent rejecting tickets that are already resolved, closed, or cancelled
        $ticket = $approval->ticket;
        if (in_array($ticket->status, ['resolved', 'closed', 'cancelled'])) {
            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('error', 'Cannot reject a ticket that is already ' . $ticket->status . '.');
        }

        // Check if user is the approver or has admin rights
        if ($approval->approver_id && $approval->approver_id !== Auth::id()) {
            if (!Auth::user()->can('tickets.assign')) {
                abort(403, 'You are not authorized to reject this ticket.');
            }
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
}
