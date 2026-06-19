<?php

namespace App\Services;

use App\Constants\RoleConstants;
use App\Jobs\SendPushNotificationJob;
use App\Jobs\SendTicketAssignedEmailJob;
use App\Jobs\SendTicketCreatedEmailJob;
use App\Jobs\SendTicketEventEmailJob;
use App\Models\HelpDeskNotification;
use App\Models\Setting;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use App\Support\NotificationType;
use Illuminate\Database\Eloquent\Collection;
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
        ?array $data = null,
        ?string $dedupeKey = null
    ): HelpDeskNotification {
        $attributes = [
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'ticket_id' => $ticketId,
            'related_user_id' => $relatedUserId,
            'data' => $data,
            'dedupe_key' => $dedupeKey,
        ];

        $notification = $dedupeKey === null
            ? HelpDeskNotification::create($attributes)
            : HelpDeskNotification::firstOrCreate(
                ['dedupe_key' => $dedupeKey],
                $attributes
            );

        if (
            $notification->wasRecentlyCreated
            && app(PushNotificationService::class)->isConfigured()
        ) {
            SendPushNotificationJob::dispatch($notification->id);
        }

        return $notification;
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
        ?array $data = null,
        ?string $dedupeKey = null
    ): ?HelpDeskNotification {
        $template = \App\Models\NotificationTemplate::active()->ofType($type)->first();

        if (! $template) {
            Log::warning('Notification template missing; using fallback notification content', [
                'type' => $type,
                'user_id' => $userId,
                'ticket_id' => $ticketId,
            ]);

            [$title, $message] = $this->fallbackTemplateContent($type, $variables ?? []);

            return $this->create(
                $userId,
                $type,
                $title,
                $message,
                $ticketId,
                $relatedUserId,
                $data,
                $dedupeKey
            );
        }

        $title = $template->renderSubject($variables ?? []);
        $message = $template->renderMessage($variables ?? []);

        return $this->create(
            $userId,
            $type,
            $title,
            $message,
            $ticketId,
            $relatedUserId,
            $data,
            $dedupeKey
        );
    }

    /**
     * Notify ticket requester
     */
    public function notifyRequester(
        Ticket $ticket,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $dedupeKey = null
    ): void {
        if ($ticket->requester_id) {
            $this->create(
                $ticket->requester_id,
                $type,
                $title,
                $message,
                $ticket->id,
                null,
                $data,
                $dedupeKey
            );
        }
    }

    /**
     * Notify assigned agent
     */
    public function notifyAgent(
        Ticket $ticket,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $dedupeKey = null
    ): void {
        if ($ticket->assigned_agent_id) {
            $this->create(
                $ticket->assigned_agent_id,
                $type,
                $title,
                $message,
                $ticket->id,
                null,
                $data,
                $dedupeKey
            );
        }
    }

    /**
     * Notify ticket watchers
     */
    public function notifyWatchers(
        Ticket $ticket,
        string $type,
        string $title,
        string $message,
        ?array $excludeUserIds = null,
        ?array $data = null,
        ?string $dedupeKeyPrefix = null
    ): void {
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
                $data,
                $dedupeKeyPrefix
                    ? "{$dedupeKeyPrefix}:user:{$watcher->id}"
                    : null
            );
        }
    }

    /**
     * Notify on ticket created
     */
    public function notifyTicketCreated(Ticket $ticket): void
    {
        if ($ticket->requester_id) {
            $this->create(
                $ticket->requester_id,
                NotificationType::TICKET_CREATED,
                'Ticket Created',
                "Ticket #{$ticket->ticket_number} has been created: {$ticket->subject}",
                $ticket->id,
                dedupeKey: "ticket:{$ticket->id}:created:user:{$ticket->requester_id}"
            );
        }

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
                NotificationType::TICKET_ASSIGNED,
                'New Ticket Assigned',
                "Ticket #{$ticket->ticket_number} has been assigned to you: {$ticket->subject}",
                dedupeKey: $this->assignmentDedupeKey($ticket, $ticket->assigned_agent_id)
            );
        } elseif ($ticket->assigned_team_id) {
            $team = $ticket->assignedTeam;
            if ($team) {
                foreach ($team->users()->where('is_active', true)->get() as $user) {
                    $this->create(
                        $user->id,
                        NotificationType::TICKET_ASSIGNED,
                        'New Ticket for Team',
                        "Ticket #{$ticket->ticket_number} has been assigned to your team: {$ticket->subject}",
                        $ticket->id,
                        dedupeKey: $this->assignmentDedupeKey($ticket, $user->id)
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
        $eventKey = $this->ticketEventKey($ticket, NotificationType::TICKET_UPDATED);

        SendTicketEventEmailJob::dispatch(
            NotificationType::TICKET_UPDATED,
            $ticket->id,
            $updatedBy->id,
            ['changes' => $changes],
            $eventKey
        );

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $updatedBy->id) {
            $this->notifyRequester(
                $ticket,
                NotificationType::TICKET_UPDATED,
                'Ticket Updated',
                "Ticket #{$ticket->ticket_number} has been updated by {$updatedBy->name}",
                $changes,
                "{$eventKey}:user:{$ticket->requester_id}"
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify assigned agent
        if ($ticket->assigned_agent_id && $ticket->assigned_agent_id !== $updatedBy->id) {
            $this->notifyAgent(
                $ticket,
                NotificationType::TICKET_UPDATED,
                'Ticket Updated',
                "Ticket #{$ticket->ticket_number} has been updated: {$ticket->subject}",
                $changes,
                "{$eventKey}:user:{$ticket->assigned_agent_id}"
            );
            $excludeIds[] = $ticket->assigned_agent_id;
        }

        // Notify watchers
        $this->notifyWatchers(
            $ticket,
            NotificationType::TICKET_UPDATED,
            'Ticket Updated',
            "Ticket #{$ticket->ticket_number} has been updated by {$updatedBy->name}",
            $excludeIds,
            $changes,
            $eventKey
        );
    }

    /**
     * Notify on ticket commented
     */
    public function notifyTicketCommented(Ticket $ticket, User $commenter, bool $isInternal = false): void
    {
        $excludeIds = [$commenter->id];
        $type = NotificationType::TICKET_COMMENTED;
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
        $type = $comment->is_internal ? NotificationType::COMMENT_INTERNAL : NotificationType::COMMENT_ADDED;
        $title = $comment->is_internal ? 'Internal Comment Added' : 'New Comment';

        SendTicketEventEmailJob::dispatch(
            NotificationType::COMMENT_ADDED,
            $ticket->id,
            $commenter->id,
            ['comment_id' => $comment->id],
            "comment:{$comment->id}"
        );

        // Only notify requester if comment is not internal
        if (! $comment->is_internal && $ticket->requester_id && $ticket->requester_id !== $commenter->id) {
            $this->notifyRequester(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: ".substr($comment->body, 0, 100).'...',
                dedupeKey: "comment:{$comment->id}:user:{$ticket->requester_id}"
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify assigned agent (always, even for internal comments)
        if ($ticket->assigned_agent_id && $ticket->assigned_agent_id !== $commenter->id) {
            $this->notifyAgent(
                $ticket,
                $type,
                $title,
                "{$commenter->name} commented on ticket #{$ticket->ticket_number}: ".substr($comment->body, 0, 100).'...',
                dedupeKey: "comment:{$comment->id}:user:{$ticket->assigned_agent_id}"
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
                $excludeIds,
                dedupeKeyPrefix: "comment:{$comment->id}"
            );
        }
    }

    /**
     * Notify on ticket resolved
     */
    public function notifyTicketResolved(Ticket $ticket, User $resolvedBy): void
    {
        $excludeIds = [$resolvedBy->id];
        $eventKey = $this->ticketEventKey($ticket, NotificationType::TICKET_RESOLVED);

        SendTicketEventEmailJob::dispatch(
            NotificationType::TICKET_RESOLVED,
            $ticket->id,
            $resolvedBy->id,
            [],
            $eventKey
        );

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $resolvedBy->id) {
            $this->notifyRequester(
                $ticket,
                NotificationType::TICKET_RESOLVED,
                'Ticket Resolved',
                "Ticket #{$ticket->ticket_number} has been resolved: {$ticket->subject}",
                dedupeKey: "{$eventKey}:user:{$ticket->requester_id}"
            );
            $excludeIds[] = $ticket->requester_id;
        }

        // Notify watchers
        $this->notifyWatchers(
            $ticket,
            NotificationType::TICKET_RESOLVED,
            'Ticket Resolved',
            "Ticket #{$ticket->ticket_number} has been resolved by {$resolvedBy->name}",
            $excludeIds,
            dedupeKeyPrefix: $eventKey
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
                NotificationType::SLA_BREACHED,
                $title,
                $message,
                dedupeKey: "ticket:{$ticket->id}:sla:{$breachType}:user:{$ticket->assigned_agent_id}"
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
                            NotificationType::SLA_BREACHED,
                            $title,
                            $message,
                            $ticket->id,
                            dedupeKey: "ticket:{$ticket->id}:sla:{$breachType}:user:{$user->id}"
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
        $eventKey = $this->ticketEventKey($ticket, NotificationType::TICKET_CLOSED);

        SendTicketEventEmailJob::dispatch(
            NotificationType::TICKET_CLOSED,
            $ticket->id,
            $closedBy->id,
            [],
            $eventKey
        );

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $closedBy->id) {
            $this->notifyRequester(
                $ticket,
                NotificationType::TICKET_CLOSED,
                'Ticket Closed',
                "Ticket #{$ticket->ticket_number} has been closed: {$ticket->subject}",
                dedupeKey: "{$eventKey}:user:{$ticket->requester_id}"
            );
        }
    }

    public function notifyTicketLifecycleUpdate(Ticket $ticket, User $updatedBy, array $changes): void
    {
        $newStatus = $changes['status']['new'] ?? null;

        if ($newStatus === Ticket::STATUS_RESOLVED) {
            $this->notifyTicketResolved($ticket, $updatedBy);

            return;
        }

        if ($newStatus === Ticket::STATUS_CLOSED) {
            $this->notifyTicketClosed($ticket, $updatedBy);

            return;
        }

        $this->notifyTicketUpdated($ticket, $updatedBy, $changes);
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

        SendTicketEventEmailJob::dispatch(
            NotificationType::APPROVAL_REQUESTED,
            $ticket->id,
            $approver->id,
            ['approval_level' => $approvalLevel],
            "approval:{$ticket->id}:{$approvalLevel}:requested"
        );

        // Create in-app notification
        $this->create(
            $approver->id,
            NotificationType::APPROVAL_REQUESTED,
            $title,
            $message,
            $ticket->id,
            dedupeKey: "approval:{$ticket->id}:{$approvalLevel}:requested:user:{$approver->id}"
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
                    $url = config('app.url')."/admin/tickets/{$ticket->id}";
                    $telegramMessage = "🚨 *Approval Required*\n\n";
                    $telegramMessage .= "Ticket: #{$ticket->ticket_number}\n";
                    $telegramMessage .= "Subject: {$ticket->subject}\n";
                    $telegramMessage .= "Requester: {$ticket->requester?->name}\n";
                    $telegramMessage .= "Level: *{$approvalLevelName}*\n\n";
                    $telegramMessage .= 'Please review and take action below:';

                    app(TelegramNotificationService::class)->queue(
                        $approver->telegram_chat_id,
                        $telegramMessage,
                        [
                            'inline_keyboard' => [
                                [
                                    ['text' => '✅ Approve', 'callback_data' => "approve_ticket:{$approval->id}"],
                                    ['text' => '❌ Reject', 'callback_data' => "reject_ticket:{$approval->id}"],
                                ],
                                [
                                    ['text' => '🎫 View Ticket', 'url' => $url],
                                ],
                            ],
                        ],
                        User::class,
                        $approver->id
                    );
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

        SendTicketEventEmailJob::dispatch(
            NotificationType::APPROVAL_APPROVED,
            $ticket->id,
            $approver->id,
            [
                'approval_level' => $approvalLevel,
                'comments' => $comments,
            ],
            "approval:{$ticket->id}:{$approvalLevel}:approved"
        );

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $approver->id) {
            $this->notifyRequester(
                $ticket,
                NotificationType::APPROVAL_APPROVED,
                "Ticket Approved by {$approvalLevelName}",
                "Ticket #{$ticket->ticket_number} has been approved by {$approver->name} ({$approvalLevelName})",
                dedupeKey: "approval:{$ticket->id}:{$approvalLevel}:approved:user:{$ticket->requester_id}"
            );
        }
    }

    /**
     * Notify approval rejected
     */
    public function notifyApprovalRejected(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): void
    {
        $approvalLevelName = $approvalLevel === 'lm' ? RoleConstants::LINE_MANAGER : RoleConstants::HEAD_OF_DEPARTMENT;

        SendTicketEventEmailJob::dispatch(
            NotificationType::APPROVAL_REJECTED,
            $ticket->id,
            $approver->id,
            [
                'approval_level' => $approvalLevel,
                'comments' => $comments,
            ],
            "approval:{$ticket->id}:{$approvalLevel}:rejected"
        );

        // Notify requester
        if ($ticket->requester_id && $ticket->requester_id !== $approver->id) {
            $this->notifyRequester(
                $ticket,
                NotificationType::APPROVAL_REJECTED,
                "Ticket Rejected by {$approvalLevelName}",
                "Ticket #{$ticket->ticket_number} has been rejected by {$approver->name} ({$approvalLevelName})".($comments ? ": {$comments}" : ''),
                dedupeKey: "approval:{$ticket->id}:{$approvalLevel}:rejected:user:{$ticket->requester_id}"
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
            $managers = $this->departmentManagers($ticket);

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
                    NotificationType::TICKET_ASSIGNED,
                    'New Ticket for Team',
                    "Ticket #{$ticket->ticket_number} has been assigned to your team: {$ticket->subject}",
                    $ticket->id,
                    null,
                    [
                        'team_id' => $ticket->assigned_team_id,
                        'team_name' => $team->name,
                    ],
                    $this->assignmentDedupeKey($ticket, $manager->id)
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
        if (! $team) {
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
                ], $additionalData),
                dedupeKey: "ticket:{$ticket->id}:template:{$template}:team:{$teamId}:user:{$user->id}"
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
                ], $additionalData),
                dedupeKey: "ticket:{$ticket->id}:template:{$template}:role:{$roleName}:user:{$user->id}"
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
        if (! $user || ! $user->is_active) {
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
            ], $additionalData),
            dedupeKey: "ticket:{$ticket->id}:template:{$template}:user:{$user->id}"
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
        if (! $ticket->requester || ! $ticket->requester->department_id) {
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
                NotificationType::TEAMMATE_TICKET_CREATED,
                "Teammate Created Ticket: #{$ticket->ticket_number}",
                "Your teammate {$ticket->requester->name} has created a new ticket: {$ticket->subject}",
                $ticket->id,
                dedupeKey: "ticket:{$ticket->id}:teammate-created:user:{$user->id}"
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
        if (! $team || ! $team->telegram_chat_id) {
            return;
        }

        $url = config('app.url')."/admin/tickets/{$ticket->id}";
        $message = "🎫 *New Ticket Assigned to {$team->name}*\n\n";
        $message .= "Ticket: #{$ticket->ticket_number}\n";
        $message .= "Subject: {$ticket->subject}\n";
        $message .= 'Priority: *'.ucfirst($ticket->priority)."*\n";
        $message .= "Requester: {$ticket->requester?->name}\n\n";
        $message .= 'Please check and handle this ticket.';

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '✋ Claim Ticket', 'callback_data' => "pick_ticket:{$ticket->id}"],
                    ['text' => '🎫 View Ticket', 'url' => $url],
                ],
            ],
        ];

        app(TelegramNotificationService::class)->queue(
            $team->telegram_chat_id,
            $message,
            $replyMarkup,
            \App\Models\Department::class,
            $team->id
        );
    }

    /**
     * Send notification to Team Managers (Telegram)
     */
    public function notifyDepartmentManagersTelegram(Ticket $ticket): void
    {
        $department = $ticket->assignedTeam;
        if (! $department) {
            return;
        }

        // Managers are typically Users, who have their own telegram_chat_id.
        // Migration of private chats is rare/impossible in this context,
        // but we'll use the response helper anyway.
        $managers = $this->departmentManagers($ticket)
            ->whereNotNull('telegram_chat_id')
            ->values();

        $url = config('app.url')."/admin/tickets/{$ticket->id}";
        $message = "🚨 *Manager Alert: New Ticket*\n\n";
        $message .= "Department: {$department->name}\n";
        $message .= "Ticket: #{$ticket->ticket_number}\n";
        $message .= "Subject: {$ticket->subject}\n\n";
        $message .= 'Please ensure this is handled.';

        foreach ($managers as $manager) {
            $loginUrl = \App\Http\Controllers\Api\TelegramLoginController::generateLoginUrl($manager, "/admin/tickets/{$ticket->id}");

            app(TelegramNotificationService::class)->queue(
                $manager->telegram_chat_id,
                $message,
                [
                    'inline_keyboard' => [
                        [
                            ['text' => '🎫 View Ticket', 'url' => $loginUrl],
                        ],
                    ],
                ],
                User::class,
                $manager->id
            );
        }
    }

    protected function assignmentDedupeKey(Ticket $ticket, int $userId): string
    {
        return implode(':', [
            'ticket',
            $ticket->id,
            'assignment',
            $ticket->assigned_team_id ?? 'no-team',
            $ticket->assigned_agent_id ?? 'no-agent',
            'user',
            $userId,
        ]);
    }

    public function ticketEventKey(Ticket $ticket, string $event): string
    {
        $historyId = $ticket->histories()
            ->where('action', 'not like', 'system_%')
            ->max('id');
        $occurrence = $historyId ?: $ticket->updated_at?->getTimestamp() ?: 'current';

        return "ticket:{$ticket->id}:{$event}:{$occurrence}";
    }

    /**
     * @param  array<string, mixed>  $variables
     * @return array{0: string, 1: string}
     */
    protected function fallbackTemplateContent(string $type, array $variables): array
    {
        $ticketNumber = $variables['ticket_number'] ?? null;
        $subject = $variables['subject'] ?? null;
        $ticketLabel = $ticketNumber ? "Ticket #{$ticketNumber}" : 'A ticket';

        return match ($type) {
            NotificationType::TICKET_ASSIGNED => [
                'New Ticket Assigned',
                trim("{$ticketLabel} has been assigned".($subject ? ": {$subject}" : '').'.'),
            ],
            NotificationType::APPROVAL_REQUESTED => [
                'Approval Required',
                trim("{$ticketLabel} requires approval".($subject ? ": {$subject}" : '').'.'),
            ],
            default => [
                'Notification',
                trim("{$ticketLabel} has a new update".($subject ? ": {$subject}" : '').'.'),
            ],
        };
    }

    protected function departmentManagers(Ticket $ticket): Collection
    {
        if (! $ticket->assigned_team_id) {
            return new Collection;
        }

        return User::where('department_id', $ticket->assigned_team_id)
            ->where('is_active', true)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', [
                    RoleConstants::LINE_MANAGER,
                    RoleConstants::DEPUTY_LINE_MANAGER,
                    RoleConstants::HEAD_OF_DEPARTMENT,
                    RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT,
                ]);
            })
            ->get();
    }
}
