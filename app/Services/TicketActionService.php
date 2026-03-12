<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\History;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

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
    public function executeActions(Ticket $ticket, array $actions, string $sourceType, int $sourceId): void
    {
        $updateData = [];
        $historyDescriptionParts = [];

        foreach ($actions as $action) {
            $type = $action['type'] ?? $action['name'] ?? null; // Handle different rule formats
            $value = $action['value'] ?? null;

            if (!$type) continue;

            $result = $this->processAction($ticket, $type, $value, $sourceType);
            
            if ($result) {
                if (isset($result['update'])) {
                    $updateData = array_merge($updateData, $result['update']);
                }
                if (isset($result['history'])) {
                    $historyDescriptionParts[] = $result['history'];
                }
            }
        }

        if (!empty($updateData)) {
            $oldValues = $ticket->only(array_keys($updateData));
            $ticket->update($updateData);
            
            // Log history
            if (!empty($historyDescriptionParts)) {
                $this->logHistory(
                    $ticket, 
                    implode(", ", $historyDescriptionParts), 
                    $sourceType, 
                    $sourceId
                );
            }

            Log::debug("Ticket updated by {$sourceType}", [
                'ticket_id' => $ticket->id,
                'source_id' => $sourceId,
                'updates' => $updateData
            ]);
        }
    }

    /**
     * Process a single action and return update/history data
     */
    protected function processAction(Ticket $ticket, string $type, mixed $value, string $sourceType): ?array
    {
        return match ($type) {
            'assign_to_team', 'reassign_to_team' => [
                'update' => ['assigned_team_id' => $value],
                'history' => "Reassigned to team: " . ($this->getTeamName($value) ?: $value)
            ],
            'assign_to_agent', 'reassign_to_agent' => [
                'update' => ['assigned_agent_id' => $value],
                'history' => "Assigned to agent: " . ($this->getUserName($value) ?: $value)
            ],
            'set_status', 'change_status' => [
                'update' => ['status' => $value],
                'history' => "Status changed to: " . ucfirst($value)
            ],
            'set_priority', 'change_priority' => [
                'update' => ['priority' => $value],
                'history' => "Priority changed to: " . ucfirst($value)
            ],
            'set_category' => [
                'update' => ['category_id' => $value],
                'history' => "Category changed"
            ],
            'add_tags' => $this->handleTags($ticket, $value),
            'notify_user' => $this->handleNotification('user', $value, $ticket, $sourceType),
            'notify_requester' => $this->handleNotification('requester', null, $ticket, $sourceType),
            'notify_agent' => $this->handleNotification('agent', null, $ticket, $sourceType),
            'notify_team' => $this->handleNotification('team', $value, $ticket, $sourceType),
            'notify_role' => $this->handleNotification('role', $value, $ticket, $sourceType),
            'notify_manager', 'notify_team_managers' => $this->handleNotification('manager', null, $ticket, $sourceType),
            'send_telegram_message' => $this->handleTelegramMessage($value, $ticket),
            default => null,
        };
    }

    protected function handleTags(Ticket $ticket, mixed $value): ?array
    {
        if (is_array($value)) {
            $ticket->tags()->syncWithoutDetaching($value);
            return ['history' => "Tags added"];
        }
        return null;
    }

    protected function handleNotification(string $type, mixed $value, Ticket $ticket, string $sourceType): ?array
    {
        // If ticket is pending approval, we skip notifications to technical staff/managers
        // only the requester or specific user notifications (approvers) should proceed.
        if ($ticket->status === 'pending' && !in_array($type, ['requester', 'user'])) {
            return null;
        }

        try {
            switch ($type) {
                case 'user':
                    $this->notificationService->createFromTemplate((int)$value, 'ticket_updated', $ticket->id, null, ['ticket_number' => $ticket->ticket_number]);
                    break;
                case 'requester':
                    // Prevent duplicate notifications: if the ticket is handling a workflow (Pending Status),
                    // the WorkflowEngine will send its own detailed notification.
                    // We skip the generic automation rule notification here.
                    if ($sourceType === 'automation_rule' && $ticket->isPending()) {
                        Log::debug('Skipping redundant automation notification for pending workflow ticket', ['ticket_id' => $ticket->id]);
                        return null;
                    }
                    $this->notificationService->notifyRequester($ticket, 'ticket_updated', 'Ticket Updated', "Your ticket #{$ticket->ticket_number} has been updated.");
                    break;
                case 'agent':
                    $this->notificationService->notifyAgent($ticket, 'ticket_updated', 'Ticket Updated', "Ticket #{$ticket->ticket_number} has been updated.");
                    break;
                case 'team':
                    $this->notificationService->notifyTeam((int)$value, $ticket);
                    break;
                case 'role':
                    $this->notificationService->notifyRole((string)$value, $ticket);
                    break;
                case 'manager':
                    $this->notificationService->notifyDepartmentManagers($ticket);
                    break;
                case 'comment_participants':
                    // Notify requester and assigned agent about a new comment
                    if ($ticket->requester_id) {
                        $this->notificationService->create(
                            $ticket->requester_id,
                            'comment_added',
                            'New Comment on Ticket',
                            "A new comment has been added to ticket #{$ticket->ticket_number}.",
                            $ticket->id
                        );
                    }
                    if ($ticket->assigned_agent_id && $ticket->assigned_agent_id !== $ticket->requester_id) {
                        $this->notificationService->create(
                            $ticket->assigned_agent_id,
                            'comment_added',
                            'New Comment on Ticket',
                            "A new comment has been added to ticket #{$ticket->ticket_number}.",
                            $ticket->id
                        );
                    }
                    break;
            }
        } catch (\Exception $e) {
            Log::error("Failed to send notification in TicketActionService: " . $e->getMessage());
        }
        return null; // Notifications don't update ticket record directly
    }
    protected function handleTelegramMessage(mixed $value, Ticket $ticket): ?array
    {
        // If ticket is pending approval, skip telegram messages to technical staff/teams
        if ($ticket->status === 'pending' && !in_array($value, ['requester', 'approver'])) {
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
                if ($user) $targetUsers->push($user);
            }

            $url = rtrim(config('app.url'), '/') . "/admin/tickets/{$ticket->id}";
            $message = "🔔 *Help Desk Alert*\n\n";
            $message .= "Ticket: [#{$ticket->ticket_number}]({$url})\n";
            $message .= "Subject: {$ticket->subject}\n";
            $message .= "Status: *" . ucfirst($ticket->status) . "*\n";
            $message .= "Priority: *" . ucfirst($ticket->priority) . "*\n";

            $token = Setting::get('telegram_bot_token', config('services.telegram-bot-api.token'));
            if (!$token) return null;

            // NEW: If target is assigned_team, also notify the group chat
            if ($userOrRole === 'assigned_team') {
                $this->notificationService->notifyTeamGroup($ticket);
            }

            // Generate buttons
            $buttons = [
                [['text' => '🎫 View Ticket', 'url' => $url]]
            ];

            // If ticket is not assigned, add a "Pick Ticket" button
            if (empty($ticket->assigned_agent_id)) {
                $buttons[] = [
                    ['text' => '🙋‍♂️ Pick Ticket', 'callback_data' => "pick_ticket:{$ticket->id}"]
                ];
            }

            foreach ($targetUsers as $targetUser) {
                if ($targetUser->telegram_chat_id) {
                    \Illuminate\Support\Facades\Http::timeout(15)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                        'chat_id' => $targetUser->telegram_chat_id,
                        'text' => $message,
                        'parse_mode' => 'Markdown',
                        'reply_markup' => json_encode([
                            'inline_keyboard' => $buttons
                        ])
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to execute send_telegram_message action: " . $e->getMessage(), [
                'ticket_id' => $ticket->id,
                'target' => $value
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
                'user_id' => Auth::id() ?? 0,
                'action' => "system_{$sourceType}",
                'description' => $description,
                'created_at' => now(), // explicitly provide created_at
                'metadata' => [
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                ]
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