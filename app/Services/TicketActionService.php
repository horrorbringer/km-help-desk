<?php

namespace App\Services;

use App\Models\History;
use App\Models\Setting;
use App\Models\Ticket;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * TicketActionService
 *
 * Centralizes all actions that can be performed on a ticket by rules, workflows, or controllers.
 * Ensures consistent history logging and notification triggering.
 */
class TicketActionService
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Execute a set of actions on a ticket
     */
    public function executeActions(
        Ticket $ticket,
        array $actions,
        string $sourceType,
        int $sourceId,
        array $context = []
    ): void {
        $updateData = [];
        $historyDescriptionParts = [];

        foreach ($actions as $action) {
            $type = $action['type'] ?? $action['name'] ?? null; // Handle different rule formats
            $value = $action['value'] ?? null;

            if (! $type) {
                continue;
            }

            $result = $this->processAction($ticket, $type, $value, $sourceType, $context);

            if ($result) {
                if (isset($result['update'])) {
                    $updateData = array_merge($updateData, $result['update']);
                }
                if (isset($result['history'])) {
                    $historyDescriptionParts[] = $result['history'];
                }
            }
        }

        if (! empty($updateData)) {
            $ticket->update($updateData);

            Log::debug("Ticket updated by {$sourceType}", [
                'ticket_id' => $ticket->id,
                'source_id' => $sourceId,
                'updates' => $updateData,
            ]);
        }

        if (in_array($sourceType, ['automation_rule', 'escalation_rule'], true)) {
            $description = $historyDescriptionParts
                ? implode(', ', $historyDescriptionParts)
                : ucfirst(str_replace('_', ' ', $sourceType)).' executed';

            $this->logHistory($ticket, $description, $sourceType, $sourceId);
        }
    }

    /**
     * Process a single action and return update/history data
     */
    protected function processAction(
        Ticket $ticket,
        string $type,
        mixed $value,
        string $sourceType,
        array $context
    ): ?array {
        return match ($type) {
            'assign_to_team', 'reassign_to_team' => [
                'update' => ['assigned_team_id' => $value],
                'history' => 'Reassigned to team: '.($this->getTeamName($value) ?: $value),
            ],
            'assign_to_agent', 'reassign_to_agent' => [
                'update' => ['assigned_agent_id' => $value],
                'history' => 'Assigned to agent: '.($this->getUserName($value) ?: $value),
            ],
            'set_status', 'change_status' => [
                'update' => ['status' => $value],
                'history' => 'Status changed to: '.ucfirst($value),
            ],
            'set_priority', 'change_priority' => [
                'update' => ['priority' => $value],
                'history' => 'Priority changed to: '.ucfirst($value),
            ],
            'set_category' => [
                'update' => ['category_id' => $value],
                'history' => 'Category changed',
            ],
            'set_sla_policy' => [
                'update' => ['sla_policy_id' => $value],
                'history' => 'SLA policy changed',
            ],
            'add_tags' => $this->handleTags($ticket, $value),
            'notify_user' => $this->handleNotification('user', $value, $ticket, $sourceType, $context),
            'notify_requester' => $this->handleNotification('requester', null, $ticket, $sourceType, $context),
            'notify_agent' => $this->handleNotification('agent', null, $ticket, $sourceType, $context),
            'notify_team' => $this->handleNotification('team', $value, $ticket, $sourceType, $context),
            'notify_role' => $this->handleNotification('role', $value, $ticket, $sourceType, $context),
            'notify_manager',
            'notify_team_managers',
            'notify_department_managers' => $this->handleNotification('manager', null, $ticket, $sourceType, $context),
            'notify_comment_participants' => $this->handleNotification(
                'comment_participants',
                null,
                $ticket,
                $sourceType,
                $context
            ),
            'send_telegram_message' => $this->handleTelegramMessage($value, $ticket),
            default => null,
        };
    }

    protected function handleTags(Ticket $ticket, mixed $value): ?array
    {
        if ($value !== null && $value !== '') {
            $ticket->tags()->syncWithoutDetaching((array) $value);

            return ['history' => 'Tags added'];
        }

        return null;
    }

    protected function handleNotification(
        string $type,
        mixed $value,
        Ticket $ticket,
        string $sourceType,
        array $context = []
    ): ?array {
        // If ticket is pending approval, we skip notifications to technical staff/managers
        // only the requester or specific user notifications (approvers) should proceed.
        if ($ticket->hasPendingApproval() && ! in_array($type, ['requester', 'user'])) {
            return null;
        }

        try {
            switch ($type) {
                case 'user':
                    $this->notificationService->createFromTemplate((int) $value, 'ticket_updated', $ticket->id, null, ['ticket_number' => $ticket->ticket_number]);
                    break;
                case 'requester':
                    // Prevent duplicate notifications: if the ticket is handling a workflow approval,
                    // the WorkflowEngine will send its own detailed notification.
                    // We skip the generic automation rule notification here.
                    if ($sourceType === 'automation_rule' && $ticket->hasPendingApproval()) {
                        Log::debug('Skipping redundant automation notification for pending workflow ticket', ['ticket_id' => $ticket->id]);

                        return null;
                    }
                    $triggerEvent = $context['trigger_event'] ?? null;
                    $notificationType = match (true) {
                        $triggerEvent === 'ticket_created' => 'ticket_created',
                        $triggerEvent === 'ticket_status_changed'
                            && $ticket->status === Ticket::STATUS_RESOLVED => 'ticket_resolved',
                        $triggerEvent === 'ticket_status_changed'
                            && $ticket->status === Ticket::STATUS_CLOSED => 'ticket_closed',
                        default => 'ticket_updated',
                    };
                    $title = match ($notificationType) {
                        'ticket_created' => 'Ticket Created',
                        'ticket_resolved' => 'Ticket Resolved',
                        'ticket_closed' => 'Ticket Closed',
                        default => 'Ticket Updated',
                    };
                    $message = match ($notificationType) {
                        'ticket_created' => "Ticket #{$ticket->ticket_number} has been created: {$ticket->subject}",
                        'ticket_resolved' => "Ticket #{$ticket->ticket_number} has been resolved: {$ticket->subject}",
                        'ticket_closed' => "Ticket #{$ticket->ticket_number} has been closed: {$ticket->subject}",
                        default => "Your ticket #{$ticket->ticket_number} has been updated.",
                    };
                    $eventKey = isset($context['occurrence_key'])
                        ? "ticket:{$ticket->id}:escalation:{$context['occurrence_key']}"
                        : match ($notificationType) {
                            'ticket_created' => "ticket:{$ticket->id}:created",
                            default => $this->notificationService->ticketEventKey(
                                $ticket,
                                $notificationType
                            ),
                        };

                    $this->notificationService->notifyRequester(
                        $ticket,
                        $notificationType,
                        $title,
                        $message,
                        dedupeKey: "{$eventKey}:user:{$ticket->requester_id}"
                    );
                    break;
                case 'agent':
                    $this->notificationService->notifyAgent($ticket, 'ticket_updated', 'Ticket Updated', "Ticket #{$ticket->ticket_number} has been updated.");
                    break;
                case 'team':
                    $this->notificationService->notifyTeam((int) $value, $ticket);
                    break;
                case 'role':
                    $this->notificationService->notifyRole((string) $value, $ticket);
                    break;
                case 'manager':
                    $this->notificationService->notifyDepartmentManagers($ticket);
                    break;
                case 'comment_participants':
                    $commentId = isset($context['comment_id'])
                        ? (int) $context['comment_id']
                        : null;
                    $commenterId = isset($context['comment_user_id'])
                        ? (int) $context['comment_user_id']
                        : null;
                    $recipientIds = collect([
                        $ticket->requester_id,
                        $ticket->assigned_agent_id,
                    ])->merge(
                        $ticket->watchers()
                            ->where('users.is_active', true)
                            ->pluck('users.id')
                    )
                        ->filter()
                        ->reject(fn (int $userId) => $userId === $commenterId)
                        ->unique()
                        ->values();

                    foreach ($recipientIds as $recipientId) {
                        $this->notificationService->create(
                            $recipientId,
                            'comment_added',
                            'New Comment on Ticket',
                            "A new comment has been added to ticket #{$ticket->ticket_number}.",
                            $ticket->id,
                            dedupeKey: $commentId
                                ? "comment:{$commentId}:user:{$recipientId}"
                                : null
                        );
                    }
                    break;
            }
        } catch (\Exception $e) {
            Log::error('Failed to send notification in TicketActionService: '.$e->getMessage());
        }

        return null; // Notifications don't update ticket record directly
    }

    protected function handleTelegramMessage(mixed $value, Ticket $ticket): ?array
    {
        // If ticket is pending approval, skip telegram messages to technical staff/teams
        if ($ticket->hasPendingApproval() && ! in_array($value, ['requester', 'approver'])) {
            // Note: 'approver' is an assumed future value, but 'assigned_agent' and 'assigned_team'
            // are definitely skipped here while pending.
            return null;
        }

        try {
            $userOrRole = $value; // 'requester', 'assigned_agent', 'assigned_team', or specific user ID

            $targetUsers = collect();
            if ($userOrRole === 'requester' && $ticket->requester) {
                $targetUsers->push($ticket->requester);
            } elseif ($userOrRole === 'assigned_agent' && $ticket->assignedAgent) {
                $targetUsers->push($ticket->assignedAgent);
            } elseif ($userOrRole === 'assigned_team' && $ticket->assigned_team_id) {
                $targetUsers = \App\Models\User::where('department_id', $ticket->assigned_team_id)
                    ->where('is_active', true)
                    ->get();
            } elseif (is_numeric($userOrRole)) {
                $user = \App\Models\User::find($userOrRole);
                if ($user) {
                    $targetUsers->push($user);
                }
            }

            $url = rtrim(config('app.url'), '/')."/admin/tickets/{$ticket->id}";
            $message = "🔔 *Help Desk Alert*\n\n";
            $message .= "Ticket: [#{$ticket->ticket_number}]({$url})\n";
            $message .= "Subject: {$ticket->subject}\n";
            $message .= 'Status: *'.ucfirst($ticket->status)."*\n";
            $message .= 'Priority: *'.ucfirst($ticket->priority)."*\n";

            $token = Setting::get('telegram_bot_token', config('services.telegram-bot-api.token'));
            if (! $token) {
                return null;
            }

            // NEW: If target is assigned_team, also notify the group chat
            if ($userOrRole === 'assigned_team') {
                $this->notificationService->notifyTeamGroup($ticket);
            }

            // Generate buttons
            $buttons = [
                [['text' => '🎫 View Ticket', 'url' => $url]],
            ];

            // If ticket is not assigned, add a "Pick Ticket" button
            if (empty($ticket->assigned_agent_id)) {
                $buttons[] = [
                    ['text' => '🙋‍♂️ Pick Ticket', 'callback_data' => "pick_ticket:{$ticket->id}"],
                ];
            }

            foreach ($targetUsers as $targetUser) {
                if ($targetUser->telegram_chat_id) {
                    app(TelegramNotificationService::class)->queue(
                        $targetUser->telegram_chat_id,
                        $message,
                        [
                            'inline_keyboard' => $buttons,
                        ],
                        \App\Models\User::class,
                        $targetUser->id
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to execute send_telegram_message action: '.$e->getMessage(), [
                'ticket_id' => $ticket->id,
                'target' => $value,
            ]);
        }

        return null;
    }

    protected function logHistory(Ticket $ticket, string $description, string $sourceType, int $sourceId): void
    {
        // Assuming there's a TicketHistory model or similar
        if (class_exists('App\Models\TicketHistory')) {
            \App\Models\TicketHistory::create([
                'ticket_id' => $ticket->id,
                'user_id' => Auth::id(),
                'action' => "system_{$sourceType}",
                'description' => $description,
                'created_at' => now(), // explicitly provide created_at
                'metadata' => [
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                ],
            ]);
        }
    }

    protected function getTeamName($id)
    {
        return \App\Models\Department::find($id)?->name;
    }

    protected function getUserName($id)
    {
        return \App\Models\User::find($id)?->name;
    }
}
