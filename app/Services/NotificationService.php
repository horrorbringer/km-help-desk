<?php

namespace App\Services;

use App\Constants\RoleConstants;
use App\Jobs\SendTicketAssignedEmailJob;
use App\Jobs\SendTicketCreatedEmailJob;
use App\Models\HelpDeskNotification;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use App\Models\Setting;
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
     * Create a notification using a template
     */
    public function createFromTemplate(
        int $userId,
        string $type,
        ?int $ticketId = null,
        ?int $relatedUserId = null,
        ?array $variables = null,
        ?array $data = null
    ): ?HelpDeskNotification {
        $template = \App\Models\NotificationTemplate::active()->ofType($type)->first();

        if (! $template) {
            // Fallback to default behavior if no template found
            return null;
        }

        $title = $template->renderSubject($variables ?? []);
        $message = $template->renderMessage($variables ?? []);

        return $this->create($userId, $type, $title, $message, $ticketId, $relatedUserId, $data);
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
        // Dispatch email notification job to requester (non-blocking)
        try {
            Log::info('NotificationService: Dispatching SendTicketCreatedEmailJob', [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester?->email,
            ]);
            SendTicketCreatedEmailJob::dispatch($ticket);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch SendTicketCreatedEmailJob: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
            ]);
        }

        // Note: Assignment notifications are handled by notifyTicketAssigned()
        // which is typically called after the ticket is created and auto-assigned.
    }

    /**
     * Notify on ticket assigned
     */
    public function notifyTicketAssigned(Ticket $ticket): void
    {
        // Dispatch email notification jobs (non-blocking)
        try {
            Log::info('NotificationService: Dispatching SendTicketAssignedEmailJob', [
                'ticket_id' => $ticket->id,
                'assigned_agent_id' => $ticket->assigned_agent_id,
                'assigned_team_id' => $ticket->assigned_team_id,
            ]);

            // Notify assigned agent via email (queued)
            if ($ticket->assigned_agent_id) {
                SendTicketAssignedEmailJob::dispatch($ticket, $ticket->assignedAgent);
            } elseif ($ticket->assigned_team_id) {
                // Dispatch jobs for all active team members (non-blocking)
                $team = $ticket->assignedTeam;
                if ($team) {
                    $teamMembers = $team->users()->where('is_active', true)->get();
                    Log::info('NotificationService: Dispatching email notification jobs to team members', [
                        'ticket_id' => $ticket->id,
                        'team_id' => $ticket->assigned_team_id,
                        'team_name' => $team->name,
                        'team_member_count' => $teamMembers->count(),
                    ]);

                    // Get delay setting for staggered job dispatch
                    $delayBetweenEmails = (int) \App\Models\Setting::get('mail_send_delay_ms', 500);
                    $memberIndex = 0;

                    foreach ($teamMembers as $user) {
                        // Dispatch job with a small delay to prevent rate limiting
                        // Delay increases slightly for each subsequent email
                        $delay = $memberIndex > 0 ? ($delayBetweenEmails * $memberIndex) / 1000 : 0; // Convert to seconds

                        SendTicketAssignedEmailJob::dispatch($ticket, $user)
                            ->delay(now()->addSeconds($delay));

                        $memberIndex++;
                    }
                }
            }

            // --- Notify Team Telegram Group ---
            $this->notifyTeamGroup($ticket);

        } catch (\Exception $e) {
            Log::error("Failed to dispatch ticket assigned notification tasks: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'exception' => get_class($e),
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
            // 1. Notify department managers
            $this->notifyDepartmentManagers($ticket);

            // 2. Notify all active users in the team
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
        if (! $isInternal && $ticket->requester_id && $ticket->requester_id !== $commenter->id) {
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
        if (! $comment->is_internal && $ticket->requester_id && $ticket->requester_id !== $commenter->id) {
            $this->notifyRequester(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: ".substr($comment->body, 0, 100).'...'
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify assigned agent (always, even for internal comments)
        if ($ticket->assigned_agent_id && $ticket->assigned_agent_id !== $commenter->id) {
            $this->notifyAgent(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: ".substr($comment->body, 0, 100).'...'
            );
            $excludeIds[] = $ticket->assigned_agent_id;
        }

        // Notify watchers (only non-internal comments)
        if (! $comment->is_internal) {
            $this->notifyWatchers(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: ".substr($comment->body, 0, 100).'...',
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
        if (! $approver) {
            return;
        }

        $approvalLevelName = $approvalLevel === 'lm' ? RoleConstants::LINE_MANAGER : RoleConstants::HEAD_OF_DEPARTMENT;
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

        // Send Telegram notification if linked
        if ($approver->telegram_chat_id) {
            $token = Setting::get('telegram_bot_token', config('services.telegram-bot-api.token'));
            if ($token) {
                // Find the specific approval record for this level/ticket to get its ID
                $approval = \App\Models\TicketApproval::where('ticket_id', $ticket->id)
                    ->where('approval_level', $approvalLevel)
                    ->where('status', 'pending')
                    ->first();

                if ($approval) {
                    $url = config('app.url') . "/admin/tickets/{$ticket->id}";
                    $telegramMessage = "🚨 *Approval Required*\n\n";
                    $telegramMessage .= "Ticket: #{$ticket->ticket_number}\n";
                    $telegramMessage .= "Subject: {$ticket->subject}\n";
                    $telegramMessage .= "Requester: {$ticket->requester?->name}\n";
                    $telegramMessage .= "Level: *{$approvalLevelName}*\n\n";
                    $telegramMessage .= "Please review and take action below:";

                    \Illuminate\Support\Facades\Http::timeout(15)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                        'chat_id' => $approver->telegram_chat_id,
                        'text' => $telegramMessage,
                        'parse_mode' => 'Markdown',
                        'reply_markup' => json_encode([
                            'inline_keyboard' => [
                                [
                                    ['text' => '✅ Approve', 'callback_data' => "approve_ticket:{$approval->id}"],
                                    ['text' => '❌ Reject', 'callback_data' => "reject_ticket:{$approval->id}"]
                                ],
                                [
                                    ['text' => '🎫 View Ticket', 'url' => $url]
                                ]
                            ]
                        ])
                    ]);
                }
            }
        }
    }

    /**
     * Notify approval approved
     */
    public function notifyApprovalApproved(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): void
    {
        $approvalLevelName = $approvalLevel === 'lm' ? RoleConstants::LINE_MANAGER : RoleConstants::HEAD_OF_DEPARTMENT;

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
        $approvalLevelName = $approvalLevel === 'lm' ? RoleConstants::LINE_MANAGER : RoleConstants::HEAD_OF_DEPARTMENT;

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
                "Ticket #{$ticket->ticket_number} has been rejected by {$approver->name} ({$approvalLevelName})".($comments ? ": {$comments}" : '')
            );
        }
    }

    /**
     * Notify department managers (LM/DLM/HOD/DHOD) when ticket is routed to their department
     * This ensures IT Department managers are notified when tickets are assigned to IT.D
     */
    public function notifyDepartmentManagers(Ticket $ticket): void
    {
        if (! $ticket->assigned_team_id) {
            return;
        }

        try {
            $team = $ticket->assignedTeam;
            if (! $team) {
                return;
            }

            // Find all managers in the assigned department (LM, DLM, HOD, DHOD)
            $managers = \App\Models\User::where('department_id', $ticket->assigned_team_id)
                ->where('is_active', true)
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', [
                        \App\Constants\RoleConstants::LINE_MANAGER,
                        \App\Constants\RoleConstants::DEPUTY_LINE_MANAGER,
                        \App\Constants\RoleConstants::HEAD_OF_DEPARTMENT,
                        \App\Constants\RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT,
                    ]);
                })
                ->get();

            if ($managers->isEmpty()) {
                Log::info('No department managers found to notify', [
                    'ticket_id' => $ticket->id,
                    'assigned_team_id' => $ticket->assigned_team_id,
                    'team_name' => $team->name,
                ]);

                return;
            }

            $title = "New Ticket Routed to {$team->name}";
            $message = "Ticket #{$ticket->ticket_number} has been routed to your department: {$ticket->subject}";

            foreach ($managers as $manager) {
                // Create in-app notification
                $this->create(
                    $manager->id,
                    'ticket_routed_to_team',
                    $title,
                    $message,
                    $ticket->id,
                    null,
                    [
                        'team_id' => $ticket->assigned_team_id,
                        'team_name' => $team->name,
                    ]
                );

                // Dispatch email notification job (non-blocking)
                try {
                    SendTicketAssignedEmailJob::dispatch($ticket, $manager);
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch email notification job to department manager', [
                        'ticket_id' => $ticket->id,
                        'manager_id' => $manager->id,
                        'manager_email' => $manager->email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Department managers notified', [
                'ticket_id' => $ticket->id,
                'assigned_team_id' => $ticket->assigned_team_id,
                'team_name' => $team->name,
                'managers_notified' => $managers->pluck('id')->toArray(),
                'managers_count' => $managers->count(),
            ]);

            // Dispatch Telegram notifications specifically to managers' private chats
            $this->notifyDepartmentManagersTelegram($ticket);

        } catch (\Exception $e) {
            Log::error('Failed to notify department managers', [
                'ticket_id' => $ticket->id,
                'assigned_team_id' => $ticket->assigned_team_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
    /**
     * Notify all members of a specific team
     */
    public function notifyTeam(int $teamId, Ticket $ticket, string $template = 'ticket_assigned', array $additionalData = []): void
    {
        $team = \App\Models\Department::find($teamId);
        if (!$team) {
            return;
        }

        $users = $team->users()->where('is_active', true)->get();
        foreach ($users as $user) {
            $this->createFromTemplate(
                $user->id,
                $template,
                $ticket->id,
                null,
                array_merge([
                    'ticket_number' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'team_name' => $team->name,
                ], $additionalData)
            );

            try {
                SendTicketAssignedEmailJob::dispatch($ticket, $user);
            } catch (\Exception $e) {
                Log::error('Failed to dispatch email notification job in notifyTeam', [
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // --- NEW: Notify Team Telegram Group ---
        $this->notifyTeamGroup($ticket);
    }

    /**
     * Notify all users with a specific role
     */
    public function notifyRole(string $roleName, Ticket $ticket, string $template = 'ticket_assigned', array $additionalData = []): void
    {
        $users = \App\Models\User::role($roleName)->where('is_active', true)->get();
        foreach ($users as $user) {
            $this->createFromTemplate(
                $user->id,
                $template,
                $ticket->id,
                null,
                array_merge([
                    'ticket_number' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'role_name' => $roleName,
                ], $additionalData)
            );

            try {
                SendTicketAssignedEmailJob::dispatch($ticket, $user);
            } catch (\Exception $e) {
                Log::error('Failed to dispatch email notification job in notifyRole', [
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Notify a specific user
     */
    public function notifyUser(int $userId, Ticket $ticket, string $template = 'ticket_assigned', array $additionalData = []): void
    {
        $user = \App\Models\User::find($userId);
        if (!$user || !$user->is_active) {
            return;
        }

        $this->createFromTemplate(
            $user->id,
            $template,
            $ticket->id,
            null,
            array_merge([
                'ticket_number' => $ticket->ticket_number,
                'subject' => $ticket->subject,
            ], $additionalData)
        );

        try {
            SendTicketAssignedEmailJob::dispatch($ticket, $user);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch email notification job in notifyUser', [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify teammates of the requester
     */
    public function notifyTeammates(Ticket $ticket): void
    {
        if (!$ticket->requester || !$ticket->requester->department_id) {
            return;
        }

        $team = $ticket->requester->department;
        $teammates = $team->users()
            ->where('id', '!=', $ticket->requester_id)
            ->where('is_active', true)
            ->get();

        foreach ($teammates as $user) {
            $this->create(
                $user->id,
                'teammate_ticket_created',
                "Teammate Created Ticket: #{$ticket->ticket_number}",
                "Your teammate {$ticket->requester->name} has created a new ticket: {$ticket->subject}",
                $ticket->id
            );

            // We could also send an email here if a "teammate_ticket_created" template exists
        }
    }

    /**
     * Send notification to Team Telegram Group
     */
    public function notifyTeamGroup(Ticket $ticket): void
    {
        $team = $ticket->assignedTeam;
        if (!$team || !$team->telegram_chat_id) {
            return;
        }

        $url = config('app.url') . "/admin/tickets/{$ticket->id}";
        $message = "🎫 *New Ticket Assigned to {$team->name}*\n\n";
        $message .= "Ticket: #{$ticket->ticket_number}\n";
        $message .= "Subject: {$ticket->subject}\n";
        $message .= "Priority: *".ucfirst($ticket->priority)."*\n";
        $message .= "Requester: {$ticket->requester?->name}\n\n";
        $message .= "Please check and handle this ticket.";

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '✋ Claim Ticket', 'callback_data' => "pick_ticket:{$ticket->id}"],
                    ['text' => '🎫 View Ticket', 'url' => $url]
                ]
            ]
        ];

        $response = $this->sendTelegramResponse($team->telegram_chat_id, $message, $replyMarkup);

        if ($response && !$response->successful()) {
            // Handle Migration
            $migrateToId = $response->json('parameters.migrate_to_chat_id');
            if ($migrateToId) {
                $team->update(['telegram_chat_id' => $migrateToId]);
                $this->sendTelegramResponse($migrateToId, $message, $replyMarkup);
            }
        }
    }

    /**
     * Send notification to Team Managers (Telegram)
     */
    public function notifyDepartmentManagersTelegram(Ticket $ticket): void
    {
        $department = $ticket->assignedTeam;
        if (!$department) return;

        // Managers are typically Users, who have their own telegram_chat_id.
        // Migration of private chats is rare/impossible in this context, 
        // but we'll use the response helper anyway.
        $managers = \App\Models\User::role(['Manager', 'Department Head'])
            ->where('department_id', $department->id)
            ->whereNotNull('telegram_chat_id')
            ->get();

        $url = config('app.url') . "/admin/tickets/{$ticket->id}";
        $message = "🚨 *Manager Alert: New Ticket*\n\n";
        $message .= "Department: {$department->name}\n";
        $message .= "Ticket: #{$ticket->ticket_number}\n";
        $message .= "Subject: {$ticket->subject}\n\n";
        $message .= "Please ensure this is handled.";

        foreach ($managers as $manager) {
            $loginUrl = \App\Http\Controllers\Api\TelegramLoginController::generateLoginUrl($manager, "/admin/tickets/{$ticket->id}");
            
            $response = $this->sendTelegramResponse($manager->telegram_chat_id, $message, [
                'inline_keyboard' => [[['text' => '🎫 View Ticket', 'url' => $loginUrl]]]
            ]);

            if ($response && !$response->successful()) {
                $migrateToId = $response->json('parameters.migrate_to_chat_id');
                if ($migrateToId) {
                    $manager->update(['telegram_chat_id' => $migrateToId]);
                    $this->sendTelegramResponse($migrateToId, $message, [
                        'inline_keyboard' => [[['text' => '🎫 View Ticket', 'url' => $loginUrl]]]
                    ]);
                }
            }
        }
    }

    /**
     * Send Telegram Response helper (returns the response object)
     */
    protected function sendTelegramResponse(string $chatId, string $text, ?array $replyMarkup = null): ?\Illuminate\Http\Client\Response
    {
        $token = Setting::get('telegram_bot_token', config('services.telegram-bot-api.token'));
        if (!$token) return null;

        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
        ];

        if ($replyMarkup) {
            $payload['reply_markup'] = json_encode($replyMarkup);
        }

        return \Illuminate\Support\Facades\Http::timeout(15)->post("https://api.telegram.org/bot{$token}/sendMessage", $payload);
    }
}


 