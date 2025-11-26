<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EscalationRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'conditions',
        'time_trigger_type',
        'time_trigger_minutes',
        'actions',
        'priority',
        'is_active',
        'execution_count',
        'last_executed_at',
    ];

    protected $casts = [
        'conditions' => 'array',
        'actions' => 'array',
        'time_trigger_minutes' => 'integer',
        'priority' => 'integer',
        'is_active' => 'boolean',
        'execution_count' => 'integer',
        'last_executed_at' => 'datetime',
    ];

    public const TIME_TRIGGER_TYPES = [
        'created_at' => 'Time Since Creation',
        'updated_at' => 'Time Since Last Update',
        'first_response_due_at' => 'Time Until First Response Due',
        'resolution_due_at' => 'Time Until Resolution Due',
    ];

    /**
     * Check if ticket matches rule conditions
     */
    public function matches(Ticket $ticket): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Check conditions if provided
        if (!empty($this->conditions)) {
            foreach ($this->conditions as $condition) {
                $field = $condition['field'] ?? null;
                $operator = $condition['operator'] ?? 'equals';
                $value = $condition['value'] ?? null;

                if (!$field) {
                    continue;
                }

                $ticketValue = $this->getTicketValue($ticket, $field);

                if (!$this->evaluateCondition($ticketValue, $operator, $value)) {
                    return false;
                }
            }
        }

        // Check time trigger
        if ($this->time_trigger_type && $this->time_trigger_minutes) {
            if (!$this->checkTimeTrigger($ticket)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Execute escalation actions on ticket
     */
    public function execute(Ticket $ticket): void
    {
        if (empty($this->actions)) {
            return;
        }

        $updateData = [];
        $notifications = [];

        foreach ($this->actions as $action) {
            $type = $action['type'] ?? null;
            $value = $action['value'] ?? null;

            if (!$type) {
                continue;
            }

            switch ($type) {
                case 'change_priority':
                    $updateData['priority'] = $value;
                    break;
                case 'reassign_to_team':
                    $updateData['assigned_team_id'] = $value;
                    $updateData['assigned_agent_id'] = null; // Clear agent when reassigning team
                    break;
                case 'reassign_to_agent':
                    $updateData['assigned_agent_id'] = $value;
                    break;
                case 'change_status':
                    $updateData['status'] = $value;
                    break;
                case 'notify_team':
                    $notifications[] = ['type' => 'team', 'value' => $value];
                    break;
                case 'notify_agent':
                    $notifications[] = ['type' => 'agent', 'value' => $value];
                    break;
                case 'notify_manager':
                    $notifications[] = ['type' => 'manager'];
                    break;
            }
        }

        if (!empty($updateData)) {
            $ticket->update($updateData);
        }

        // Send notifications
        if (!empty($notifications)) {
            $this->sendNotifications($ticket, $notifications);
        }

        // Update execution stats
        $this->increment('execution_count');
        $this->update(['last_executed_at' => now()]);
    }

    /**
     * Check if time trigger condition is met
     */
    protected function checkTimeTrigger(Ticket $ticket): bool
    {
        $triggerTime = match ($this->time_trigger_type) {
            'created_at' => $ticket->created_at,
            'updated_at' => $ticket->updated_at,
            'first_response_due_at' => $ticket->first_response_due_at,
            'resolution_due_at' => $ticket->resolution_due_at,
            default => null,
        };

        if (!$triggerTime) {
            return false;
        }

        $now = now();
        $diffMinutes = $now->diffInMinutes($triggerTime);

        // For "due_at" fields, check if we're past the due time
        if (in_array($this->time_trigger_type, ['first_response_due_at', 'resolution_due_at'])) {
            return $now->isAfter($triggerTime) && $diffMinutes >= $this->time_trigger_minutes;
        }

        // For "created_at" and "updated_at", check if enough time has passed
        return $diffMinutes >= $this->time_trigger_minutes;
    }

    /**
     * Get ticket value for a field
     */
    protected function getTicketValue(Ticket $ticket, string $field): mixed
    {
        return match ($field) {
            'category_id' => $ticket->category_id,
            'project_id' => $ticket->project_id,
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'source' => $ticket->source,
            'assigned_team_id' => $ticket->assigned_team_id,
            'assigned_agent_id' => $ticket->assigned_agent_id,
            default => $ticket->getAttribute($field),
        };
    }

    /**
     * Evaluate a condition
     */
    protected function evaluateCondition(mixed $ticketValue, string $operator, mixed $conditionValue): bool
    {
        return match ($operator) {
            'equals' => $ticketValue == $conditionValue,
            'not_equals' => $ticketValue != $conditionValue,
            'in' => in_array($ticketValue, is_array($conditionValue) ? $conditionValue : [$conditionValue]),
            'not_in' => !in_array($ticketValue, is_array($conditionValue) ? $conditionValue : [$conditionValue]),
            'is_empty' => empty($ticketValue),
            'is_not_empty' => !empty($ticketValue),
            default => false,
        };
    }

    /**
     * Send notifications for escalation
     */
    protected function sendNotifications(Ticket $ticket, array $notifications): void
    {
        $notificationService = app(\App\Services\NotificationService::class);

        foreach ($notifications as $notification) {
            switch ($notification['type']) {
                case 'team':
                    $team = \App\Models\Department::find($notification['value']);
                    if ($team) {
                        foreach ($team->users()->where('is_active', true)->get() as $user) {
                            $notificationService->create(
                                $user->id,
                                'ticket_escalated',
                                'Ticket Escalated',
                                "Ticket #{$ticket->ticket_number} has been escalated: {$ticket->subject}",
                                $ticket->id
                            );
                        }
                    }
                    break;
                case 'agent':
                    $agent = \App\Models\User::find($notification['value']);
                    if ($agent) {
                        $notificationService->create(
                            $agent->id,
                            'ticket_escalated',
                            'Ticket Escalated',
                            "Ticket #{$ticket->ticket_number} has been escalated to you: {$ticket->subject}",
                            $ticket->id
                        );
                    }
                    break;
                case 'manager':
                    // Notify department manager or system admins
                    if ($ticket->assignedTeam && $ticket->assignedTeam->manager_id) {
                        $notificationService->create(
                            $ticket->assignedTeam->manager_id,
                            'ticket_escalated',
                            'Ticket Escalated',
                            "Ticket #{$ticket->ticket_number} has been escalated: {$ticket->subject}",
                            $ticket->id
                        );
                    }
                    break;
            }
        }
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority', 'desc')->orderBy('id');
    }
}

