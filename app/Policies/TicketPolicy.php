<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    private const STATUS_TRANSITIONS = [
        Ticket::STATUS_OPEN => [
            Ticket::STATUS_ASSIGNED,
            Ticket::STATUS_IN_PROGRESS,
            Ticket::STATUS_WAITING,
            Ticket::STATUS_CLOSED,
            Ticket::STATUS_CANCELLED,
        ],
        Ticket::STATUS_ASSIGNED => [
            Ticket::STATUS_OPEN,
            Ticket::STATUS_IN_PROGRESS,
            Ticket::STATUS_WAITING,
            Ticket::STATUS_CLOSED,
            Ticket::STATUS_CANCELLED,
        ],
        Ticket::STATUS_IN_PROGRESS => [
            Ticket::STATUS_WAITING,
            Ticket::STATUS_RESOLVED,
            Ticket::STATUS_CLOSED,
            Ticket::STATUS_CANCELLED,
        ],
        Ticket::STATUS_WAITING => [
            Ticket::STATUS_IN_PROGRESS,
            Ticket::STATUS_RESOLVED,
            Ticket::STATUS_CLOSED,
            Ticket::STATUS_CANCELLED,
        ],
        Ticket::STATUS_RESOLVED => [
            Ticket::STATUS_IN_PROGRESS,
            Ticket::STATUS_CLOSED,
        ],
        Ticket::STATUS_CLOSED => [Ticket::STATUS_OPEN],
        Ticket::STATUS_CANCELLED => [Ticket::STATUS_OPEN],
    ];

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('tickets.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        if (! $user->can('tickets.view')) {
            return false;
        }

        // Admins and Managers with assign permission can see all tickets
        if ($user->can('tickets.assign')) {
            return true;
        }

        // Check if user is the requester
        if ($ticket->requester_id === $user->id) {
            return true;
        }

        if ($this->hasPendingApproval($ticket) && ! $this->isApprovalParticipant($user, $ticket)) {
            return false;
        }

        // Check if user is the assigned agent
        if ($ticket->assigned_agent_id === $user->id) {
            return true;
        }

        // Check if ticket is assigned to user's team/department
        // Only Agents and Managers can see tickets assigned to their team
        // Requesters can only see tickets they created or are watching
        if ($ticket->assigned_team_id && $user->department_id === $ticket->assigned_team_id) {
            // Allow if user is an Agent, Senior Agent, or Manager
            if ($user->hasAnyRole(array_merge(\App\Constants\RoleConstants::getAgentRoles(), [\App\Constants\RoleConstants::MANAGER]))) {
                return true;
            }
        }

        // Check if user is watching the ticket
        if ($ticket->watchers->contains($user->id)) {
            return true;
        }

        // Check if user is an approver for this ticket
        if (\App\Models\TicketApproval::where('ticket_id', $ticket->id)->where('approver_id', $user->id)->exists()) {
            return true;
        }

        // For managers: can see tickets in their department (even if not assigned)
        // Check if user has Manager role using Spatie's HasRoles trait
        if ($user->hasRole(\App\Constants\RoleConstants::MANAGER) && $user->department_id) {
            if ($ticket->assignedTeam && $ticket->assignedTeam->id === $user->department_id) {
                return true;
            }
        }

        return false;
    }

    private function hasPendingApproval(Ticket $ticket): bool
    {
        return $ticket->approvals()->where('status', 'pending')->exists();
    }

    private function isApprovalParticipant(User $user, Ticket $ticket): bool
    {
        return \App\Models\TicketApproval::where('ticket_id', $ticket->id)
            ->where('approver_id', $user->id)
            ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('tickets.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Ticket $ticket): bool
    {
        if (! $user->can('tickets.update-details')) {
            return false;
        }

        // We defer to view logic first. If they can't see it, they can't edit it.
        return $this->view($user, $ticket);
    }

    /**
     * Determine if a user can change the status of the ticket.
     */
    public function changeStatus(User $user, Ticket $ticket, ?string $newStatus = null): bool
    {
        if (! $user->can('tickets.change-status')) {
            return false;
        }

        if (! $newStatus || ! in_array($newStatus, self::STATUS_TRANSITIONS[$ticket->status] ?? [], true)) {
            return false;
        }

        // Approval decisions own the lifecycle while a workflow is pending.
        // Cancellation remains available as an explicit escape hatch.
        if ($ticket->hasPendingApproval()) {
            return $newStatus === Ticket::STATUS_CANCELLED;
        }

        // Check if user is the requester
        $isRequester = $ticket->requester_id === $user->id;

        // If user is the requester, they can only change status to "closed" or "cancelled"
        if ($isRequester && $newStatus) {
            if (in_array($ticket->status, [Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED])) {
                return $newStatus === Ticket::STATUS_OPEN;
            }

            return in_array($newStatus, [Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED]);
        }

        // Managers/admins can use every valid lifecycle transition.
        if ($user->can('tickets.assign')) {
            return true;
        }

        // If ticket is assigned to an agent
        if ($ticket->assigned_agent_id) {
            // Only the assigned agent can change status (not requesters)
            return $ticket->assigned_agent_id === $user->id;
        }

        // If ticket is assigned to a team
        if ($ticket->assigned_team_id) {
            // Check if user is in the assigned team
            if ($user->department_id === $ticket->assigned_team_id) {
                // Check if user is an agent (has Agent or Senior Agent role)
                // Requesters cannot change status of tickets assigned to teams
                return $user->hasAnyRole(\App\Constants\RoleConstants::getAgentRoles());
            }

            return false;
        }

        // If ticket is unassigned:
        // - Agents can change to any status
        // - Requesters can only close/cancel or reopen
        if ($isRequester && $newStatus) {
            if (in_array($ticket->status, [Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED])) {
                return $newStatus === Ticket::STATUS_OPEN;
            }

            return in_array($newStatus, [Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED]);
        }

        // For agents on unassigned tickets, allow status change
        // (This check is already done at the controller level for tickets.edit permission)
        return true;
    }

    /**
     * Determine if user can assign an agent to the ticket.
     */
    public function assignAgent(User $user, Ticket $ticket, ?int $newAgentId): bool
    {
        // Users with tickets.assign can assign to anyone
        if ($user->can('tickets.assign')) {
            return true;
        }

        // If trying to assign to self (picking)
        if ($newAgentId === $user->id) {
            return $this->pick($user, $ticket);
        }

        // Without assign permission, cannot assign to others
        return false;
    }

    /**
     * Determine if a user can pick/claim the ticket.
     */
    public function pick(User $user, Ticket $ticket): bool
    {
        if ($ticket->hasPendingApproval()) {
            return false;
        }

        // Admins/Managers can reassign (bypasses picking restriction)
        if ($user->can('tickets.assign')) {
            return true;
        }

        // Agent is trying to pick/claim a ticket
        // Can pick if:
        // 1. Ticket is unassigned (no agent assigned)
        // 2. Ticket is assigned to their team (and they're in that team)
        return ! $ticket->assigned_agent_id && $ticket->assigned_team_id == $user->department_id;
    }

    /**
     * Determine if a user can resubmit a rejected ticket.
     */
    public function resubmit(User $user, Ticket $ticket): bool
    {
        if (! $user->can('tickets.edit') || ! $this->view($user, $ticket)) {
            return false;
        }

        if ($ticket->status !== Ticket::STATUS_CANCELLED || ! $ticket->hasRejectedApproval()) {
            return false;
        }

        return $ticket->requester_id === $user->id || $user->can('tickets.assign');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->can('tickets.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Ticket $ticket): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Ticket $ticket): bool
    {
        return false;
    }
}
