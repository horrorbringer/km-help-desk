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
            Log::info('NotificationService: Calling EmailService::sendTicketCreated', [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester?->email,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendTicketCreated($ticket);
            Log::info('NotificationService: EmailService::sendTicketCreated result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
            
            // Notify assigned agent via email
            if ($ticket->assigned_agent_id) {
                Log::info('NotificationService: Calling EmailService::sendTicketAssigned for agent', [
                    'ticket_id' => $ticket->id,
                    'assigned_agent_id' => $ticket->assigned_agent_id,
                ]);
                $result = $emailService->sendTicketAssigned($ticket);
                Log::info('NotificationService: EmailService::sendTicketAssigned result', [
                    'ticket_id' => $ticket->id,
                    'result' => $result ? 'success' : 'failed',
                ]);
            } elseif ($ticket->assigned_team_id) {
                // Notify all active team members via email
                $team = $ticket->assignedTeam;
                if ($team) {
                    $teamMembers = $team->users()->where('is_active', true)->get();
                    Log::info('NotificationService: Sending email notifications to team members', [
                        'ticket_id' => $ticket->id,
                        'team_id' => $ticket->assigned_team_id,
                        'team_name' => $team->name,
                        'team_member_count' => $teamMembers->count(),
                    ]);
                    
                    $delayBetweenEmails = (int) \App\Models\Setting::get('mail_send_delay_ms', 500); // Default 500ms delay
                    $memberIndex = 0;
                    
                    foreach ($teamMembers as $user) {
                        // Add delay between emails to prevent rate limiting (skip delay for first email)
                        if ($memberIndex > 0) {
                            usleep($delayBetweenEmails * 1000); // Convert ms to microseconds
                        }
                        
                        try {
                            $result = $emailService->sendTicketAssigned($ticket, $user);
                            if ($result) {
                                Log::info('NotificationService: Email sent to team member', [
                                    'ticket_id' => $ticket->id,
                                    'user_id' => $user->id,
                                    'user_email' => $user->email,
                                ]);
                            } else {
                                Log::warning('NotificationService: Failed to send email to team member', [
                                    'ticket_id' => $ticket->id,
                                    'user_id' => $user->id,
                                    'user_email' => $user->email,
                                ]);
                            }
                        } catch (\Exception $e) {
                            $errorMessage = $e->getMessage();
                            $isRateLimitError = str_contains($errorMessage, 'Too many emails') || 
                                               str_contains($errorMessage, 'rate limit') ||
                                               str_contains($errorMessage, '550 5.7.0');
                            
                            if ($isRateLimitError) {
                                // If rate limited, wait longer before continuing
                                Log::warning('NotificationService: Rate limit detected, waiting before continuing', [
                                    'ticket_id' => $ticket->id,
                                    'user_id' => $user->id,
                                    'user_email' => $user->email,
                                    'delay_ms' => $delayBetweenEmails * 2,
                                ]);
                                usleep($delayBetweenEmails * 2000); // Wait 2x longer on rate limit
                            }
                            
                            Log::error('NotificationService: Exception sending email to team member', [
                                'ticket_id' => $ticket->id,
                                'user_id' => $user->id,
                                'user_email' => $user->email,
                                'error' => $errorMessage,
                                'is_rate_limit' => $isRateLimitError,
                            ]);
                        }
                        
                        $memberIndex++;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
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
     * Notify on ticket assigned
     */
    public function notifyTicketAssigned(Ticket $ticket): void
    {
        // Send email notifications
        try {
            Log::info('NotificationService: Calling EmailService::sendTicketAssigned', [
                'ticket_id' => $ticket->id,
                'assigned_agent_id' => $ticket->assigned_agent_id,
                'assigned_team_id' => $ticket->assigned_team_id,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            
            // Notify assigned agent via email
            if ($ticket->assigned_agent_id) {
                $result = $emailService->sendTicketAssigned($ticket);
                Log::info('NotificationService: EmailService::sendTicketAssigned result', [
                    'ticket_id' => $ticket->id,
                    'result' => $result ? 'success' : 'failed',
                ]);
            } elseif ($ticket->assigned_team_id) {
                // Notify all active team members via email
                $team = $ticket->assignedTeam;
                if ($team) {
                    $teamMembers = $team->users()->where('is_active', true)->get();
                    Log::info('NotificationService: Sending email notifications to team members', [
                        'ticket_id' => $ticket->id,
                        'team_id' => $ticket->assigned_team_id,
                        'team_name' => $team->name,
                        'team_member_count' => $teamMembers->count(),
                    ]);
                    
                    $delayBetweenEmails = (int) \App\Models\Setting::get('mail_send_delay_ms', 500); // Default 500ms delay
                    $memberIndex = 0;
                    
                    foreach ($teamMembers as $user) {
                        // Add delay between emails to prevent rate limiting (skip delay for first email)
                        if ($memberIndex > 0) {
                            usleep($delayBetweenEmails * 1000); // Convert ms to microseconds
                        }
                        
                        try {
                            $result = $emailService->sendTicketAssigned($ticket, $user);
                            if ($result) {
                                Log::info('NotificationService: Email sent to team member', [
                                    'ticket_id' => $ticket->id,
                                    'user_id' => $user->id,
                                    'user_email' => $user->email,
                                ]);
                            } else {
                                Log::warning('NotificationService: Failed to send email to team member', [
                                    'ticket_id' => $ticket->id,
                                    'user_id' => $user->id,
                                    'user_email' => $user->email,
                                ]);
                            }
                        } catch (\Exception $e) {
                            $errorMessage = $e->getMessage();
                            $isRateLimitError = str_contains($errorMessage, 'Too many emails') || 
                                               str_contains($errorMessage, 'rate limit') ||
                                               str_contains($errorMessage, '550 5.7.0');
                            
                            if ($isRateLimitError) {
                                // If rate limited, wait longer before continuing
                                Log::warning('NotificationService: Rate limit detected, waiting before continuing', [
                                    'ticket_id' => $ticket->id,
                                    'user_id' => $user->id,
                                    'user_email' => $user->email,
                                    'delay_ms' => $delayBetweenEmails * 2,
                                ]);
                                usleep($delayBetweenEmails * 2000); // Wait 2x longer on rate limit
                            }
                            
                            Log::error('NotificationService: Exception sending email to team member', [
                                'ticket_id' => $ticket->id,
                                'user_id' => $user->id,
                                'user_email' => $user->email,
                                'error' => $errorMessage,
                                'is_rate_limit' => $isRateLimitError,
                            ]);
                        }
                        
                        $memberIndex++;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to send ticket assigned email: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Create in-app notification
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
            Log::info('NotificationService: Calling EmailService::sendTicketUpdated', [
                'ticket_id' => $ticket->id,
                'updated_by_id' => $updatedBy->id,
                'changes' => array_keys($changes),
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendTicketUpdated($ticket, $updatedBy, $changes);
            Log::info('NotificationService: EmailService::sendTicketUpdated result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
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
            Log::info('NotificationService: Calling EmailService::sendCommentAdded', [
                'ticket_id' => $ticket->id,
                'comment_id' => $comment->id,
                'commenter_id' => $commenter->id,
                'is_internal' => $comment->is_internal,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendCommentAdded($ticket, $comment, $commenter);
            Log::info('NotificationService: EmailService::sendCommentAdded result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
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
            Log::info('NotificationService: Calling EmailService::sendTicketResolved', [
                'ticket_id' => $ticket->id,
                'resolved_by_id' => $resolvedBy->id,
                'requester_email' => $ticket->requester?->email,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendTicketResolved($ticket, $resolvedBy);
            Log::info('NotificationService: EmailService::sendTicketResolved result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send email notification: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
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

    /**
     * Notify on ticket closed
     */
    public function notifyTicketClosed(Ticket $ticket, User $closedBy): void
    {
        // Send email notification to requester
        try {
            Log::info('NotificationService: Calling EmailService::sendTicketClosed', [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester?->email,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendTicketClosed($ticket, $closedBy);
            Log::info('NotificationService: EmailService::sendTicketClosed result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send ticket closed email: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $closedBy->id) {
            $this->notifyRequester(
                $ticket,
                'ticket_closed',
                'Ticket Closed',
                "Ticket #{$ticket->ticket_number} has been closed: {$ticket->subject}"
            );
        }
    }

    /**
     * Notify approval requested
     */
    public function notifyApprovalRequested(Ticket $ticket, User $approver, string $approvalLevel): void
    {
        if (!$approver) {
            return;
        }

        $approvalLevelName = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
        $title = "Approval Required: {$approvalLevelName}";
        $message = "Ticket #{$ticket->ticket_number} requires your {$approvalLevelName} approval: {$ticket->subject}";

        // Send email notification
        try {
            Log::info('NotificationService: Calling EmailService::sendApprovalRequested', [
                'ticket_id' => $ticket->id,
                'approval_level' => $approvalLevel,
                'approver_email' => $approver->email,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendApprovalRequested($ticket, $approver, $approvalLevel);
            Log::info('NotificationService: EmailService::sendApprovalRequested result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send approval request email: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'approval_level' => $approvalLevel,
                'approver_email' => $approver->email,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Create in-app notification
        $this->create(
            $approver->id,
            'approval_requested',
            $title,
            $message,
            $ticket->id
        );
    }

    /**
     * Notify approval approved
     */
    public function notifyApprovalApproved(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): void
    {
        $approvalLevelName = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
        
        // Send email notification to requester
        try {
            Log::info('NotificationService: Calling EmailService::sendApprovalApproved', [
                'ticket_id' => $ticket->id,
                'approval_level' => $approvalLevel,
                'requester_email' => $ticket->requester?->email,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendApprovalApproved($ticket, $approver, $approvalLevel, $comments);
            Log::info('NotificationService: EmailService::sendApprovalApproved result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send approval approved email: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'approval_level' => $approvalLevel,
                'requester_email' => $ticket->requester?->email,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $approver->id) {
            $this->notifyRequester(
                $ticket,
                'approval_approved',
                "Ticket Approved by {$approvalLevelName}",
                "Ticket #{$ticket->ticket_number} has been approved by {$approver->name} ({$approvalLevelName})"
            );
        }
    }

    /**
     * Notify approval rejected
     */
    public function notifyApprovalRejected(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): void
    {
        $approvalLevelName = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
        
        // Send email notification to requester
        try {
            Log::info('NotificationService: Calling EmailService::sendApprovalRejected', [
                'ticket_id' => $ticket->id,
                'approval_level' => $approvalLevel,
                'requester_email' => $ticket->requester?->email,
            ]);
            $emailService = app(\App\Services\EmailService::class);
            $result = $emailService->sendApprovalRejected($ticket, $approver, $approvalLevel, $comments);
            Log::info('NotificationService: EmailService::sendApprovalRejected result', [
                'ticket_id' => $ticket->id,
                'result' => $result ? 'success' : 'failed',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send approval rejected email: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'approval_level' => $approvalLevel,
                'requester_email' => $ticket->requester?->email,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $approver->id) {
            $this->notifyRequester(
                $ticket,
                'approval_rejected',
                "Ticket Rejected by {$approvalLevelName}",
                "Ticket #{$ticket->ticket_number} has been rejected by {$approver->name} ({$approvalLevelName})" . ($comments ? ": {$comments}" : '')
            );
        }
    }
}

