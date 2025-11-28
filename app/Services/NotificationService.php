<?php

namespace App\Services;

use App\Models\HelpDeskNotification;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public function create(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?int $ticketId = null,
        ?int $relatedUserId = null,
        ?array $data = null
    ): HelpDeskNotification {
        return HelpDeskNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'ticket_id' => $ticketId,
            'related_user_id' => $relatedUserId,
            'data' => $data,
        ]);
    }

    /**
     * Notify ticket requester
     */
    public function notifyRequester(Ticket $ticket, string $type, string $title, string $message, ?array $data = null): void
    {
        if ($ticket->requester_id) {
            $this->create(
                $ticket->requester_id,
                $type,
                $title,
                $message,
                $ticket->id,
                null,
                $data
            );
        }
    }

    /**
     * Notify assigned agent
     */
    public function notifyAgent(Ticket $ticket, string $type, string $title, string $message, ?array $data = null): void
    {
        if ($ticket->assigned_agent_id) {
            $this->create(
                $ticket->assigned_agent_id,
                $type,
                $title,
                $message,
                $ticket->id,
                null,
                $data
            );
        }
    }

    /**
     * Notify ticket watchers
     */
    public function notifyWatchers(Ticket $ticket, string $type, string $title, string $message, ?array $excludeUserIds = null, ?array $data = null): void
    {
        $watchers = $ticket->watchers()->where('is_active', true);
        
        if ($excludeUserIds) {
            $watchers->whereNotIn('users.id', $excludeUserIds);
        }

        foreach ($watchers->get() as $watcher) {
            $this->create(
                $watcher->id,
                $type,
                $title,
                $message,
                $ticket->id,
                null,
                $data
            );
        }
    }

    /**
     * Notify on ticket created
     */
    public function notifyTicketCreated(Ticket $ticket): void
    {
        // Send email notifications
        try {
            $emailService = app(\App\Services\EmailService::class);
            $emailService->sendTicketCreated($ticket);
            
            // Notify assigned agent via email
            if ($ticket->assigned_agent_id) {
                $emailService->sendTicketAssigned($ticket);
            }
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}");
        }

        // Notify assigned team/agent if assigned
        if ($ticket->assigned_agent_id) {
            $this->notifyAgent(
                $ticket,
                'ticket_assigned',
                'New Ticket Assigned',
                "Ticket #{$ticket->ticket_number} has been assigned to you: {$ticket->subject}"
            );
        } elseif ($ticket->assigned_team_id) {
            // Notify all active users in the team
            $team = $ticket->assignedTeam;
            if ($team) {
                foreach ($team->users()->where('is_active', true)->get() as $user) {
                    $this->create(
                        $user->id,
                        'ticket_assigned',
                        'New Ticket for Team',
                        "Ticket #{$ticket->ticket_number} has been assigned to your team: {$ticket->subject}",
                        $ticket->id
                    );
                }
            }
        }
    }

    /**
     * Notify on ticket updated
     */
    public function notifyTicketUpdated(Ticket $ticket, User $updatedBy, array $changes = []): void
    {
        $excludeIds = [$updatedBy->id];

        // Send email notifications
        try {
            $emailService = app(\App\Services\EmailService::class);
            $emailService->sendTicketUpdated($ticket, $updatedBy, $changes);
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}");
        }

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $updatedBy->id) {
            $this->notifyRequester(
                $ticket,
                'ticket_updated',
                'Ticket Updated',
                "Ticket #{$ticket->ticket_number} has been updated by {$updatedBy->name}",
                $changes
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify assigned agent
        if ($ticket->assigned_agent_id && $ticket->assigned_agent_id !== $updatedBy->id) {
            $this->notifyAgent(
                $ticket,
                'ticket_updated',
                'Ticket Updated',
                "Ticket #{$ticket->ticket_number} has been updated: {$ticket->subject}",
                $changes
            );
            $excludeIds[] = $ticket->assigned_agent_id;
        }

        // Notify watchers
        $this->notifyWatchers(
            $ticket,
            'ticket_updated',
            'Ticket Updated',
            "Ticket #{$ticket->ticket_number} has been updated by {$updatedBy->name}",
            $excludeIds,
            $changes
        );
    }

    /**
     * Notify on ticket commented
     */
    public function notifyTicketCommented(Ticket $ticket, User $commenter, bool $isInternal = false): void
    {
        $excludeIds = [$commenter->id];
        $type = $isInternal ? 'ticket_commented' : 'ticket_commented';
        $title = $isInternal ? 'Internal Comment Added' : 'New Comment on Ticket';

        // Notify requester (only if not internal)
        if (!$isInternal && $ticket->requester_id && $ticket->requester_id !== $commenter->id) {
            $this->notifyRequester(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}"
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify assigned agent
        if ($ticket->assigned_agent_id && $ticket->assigned_agent_id !== $commenter->id) {
            $this->notifyAgent(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}"
            );
            $excludeIds[] = $ticket->assigned_agent_id;
        }

        // Notify watchers
        $this->notifyWatchers(
            $ticket,
            $type,
            $title,
            "{$commenter->name} commented on ticket #{$ticket->ticket_number}",
            $excludeIds
        );
    }

    /**
     * Notify on comment added
     */
    public function notifyCommentAdded(Ticket $ticket, TicketComment $comment, User $commenter): void
    {
        $excludeIds = [$commenter->id];
        $type = $comment->is_internal ? 'comment_internal' : 'comment_added';
        $title = $comment->is_internal ? 'Internal Comment Added' : 'New Comment';

        // Send email notifications
        try {
            $emailService = app(\App\Services\EmailService::class);
            $emailService->sendCommentAdded($ticket, $comment, $commenter);
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}");
        }

        // Only notify requester if comment is not internal
        if (!$comment->is_internal && $ticket->requester_id && $ticket->requester_id !== $commenter->id) {
            $this->notifyRequester(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: " . substr($comment->body, 0, 100) . '...'
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify assigned agent (always, even for internal comments)
        if ($ticket->assigned_agent_id && $ticket->assigned_agent_id !== $commenter->id) {
            $this->notifyAgent(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: " . substr($comment->body, 0, 100) . '...'
            );
            $excludeIds[] = $ticket->assigned_agent_id;
        }

        // Notify watchers (only non-internal comments)
        if (!$comment->is_internal) {
            $this->notifyWatchers(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: " . substr($comment->body, 0, 100) . '...',
                $excludeIds
            );
        }
    }

    /**
     * Notify on ticket resolved
     */
    public function notifyTicketResolved(Ticket $ticket, User $resolvedBy): void
    {
        $excludeIds = [$resolvedBy->id];

        // Send email notifications
        try {
            $emailService = app(\App\Services\EmailService::class);
            $emailService->sendTicketResolved($ticket, $resolvedBy);
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}");
        }

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $resolvedBy->id) {
            $this->notifyRequester(
                $ticket,
                'ticket_resolved',
                'Ticket Resolved',
                "Ticket #{$ticket->ticket_number} has been resolved: {$ticket->subject}"
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify watchers
        $this->notifyWatchers(
            $ticket,
            'ticket_resolved',
            'Ticket Resolved',
            "Ticket #{$ticket->ticket_number} has been resolved by {$resolvedBy->name}",
            $excludeIds
        );
    }

    /**
     * Notify on SLA breach
     */
    public function notifySlaBreached(Ticket $ticket, string $breachType): void
    {
        $title = $breachType === 'response' ? 'SLA Response Time Breached' : 'SLA Resolution Time Breached';
        $message = "Ticket #{$ticket->ticket_number} has breached its {$breachType} SLA time limit.";

        // Notify assigned agent
        if ($ticket->assigned_agent_id) {
            $this->notifyAgent(
                $ticket,
                'sla_breached',
                $title,
                $message
            );
        }

        // Notify assigned team
        if ($ticket->assigned_team_id) {
            $team = $ticket->assignedTeam;
            if ($team) {
                foreach ($team->users()->where('is_active', true)->get() as $user) {
                    if ($user->id !== $ticket->assigned_agent_id) {
                        $this->create(
                            $user->id,
                            'sla_breached',
                            $title,
                            $message,
                            $ticket->id
                        );
                    }
                }
            }
        }
    }
}

