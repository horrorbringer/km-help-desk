<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AutomationRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'trigger_event',
        'conditions',
        'actions',
        'priority',
        'is_active',
        'execution_count',
        'last_executed_at',
    ];

    protected $casts = [
        'conditions' => 'array',
        'actions' => 'array',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'execution_count' => 'integer',
        'last_executed_at' => 'datetime',
    ];

    public const TRIGGER_EVENTS = [
        'ticket_created',
        'ticket_updated',
        'ticket_status_changed',
    ];

    /**
     * Check if ticket matches rule conditions
     */
    public function matches(Ticket $ticket): bool
    {
        if (!$this->is_active || empty($this->conditions)) {
            return false;
        }

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

        return true;
    }

    /**
     * Execute rule actions on ticket
     */
    public function execute(Ticket $ticket): void
    {
        if (empty($this->actions)) {
            return;
        }

        $updateData = [];

        foreach ($this->actions as $action) {
            $type = $action['type'] ?? null;
            $value = $action['value'] ?? null;

            if (!$type) {
                continue;
            }

            switch ($type) {
                case 'assign_to_team':
                    $updateData['assigned_team_id'] = $value;
                    break;
                case 'assign_to_agent':
                    $updateData['assigned_agent_id'] = $value;
                    break;
                case 'set_status':
                    $updateData['status'] = $value;
                    break;
                case 'set_priority':
                    $updateData['priority'] = $value;
                    break;
                case 'set_category':
                    $updateData['category_id'] = $value;
                    break;
                case 'set_sla_policy':
                    $updateData['sla_policy_id'] = $value;
                    break;
                case 'add_tags':
                    if (is_array($value)) {
                        $ticket->tags()->syncWithoutDetaching($value);
                    }
                    break;
            }
        }

        if (!empty($updateData)) {
            $ticket->update($updateData);
        }

        // Update execution stats
        $this->increment('execution_count');
        $this->update(['last_executed_at' => now()]);
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
            'requester_id' => $ticket->requester_id,
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
            'contains' => is_string($ticketValue) && str_contains($ticketValue, $conditionValue),
            'not_contains' => is_string($ticketValue) && !str_contains($ticketValue, $conditionValue),
            'in' => in_array($ticketValue, is_array($conditionValue) ? $conditionValue : [$conditionValue]),
            'not_in' => !in_array($ticketValue, is_array($conditionValue) ? $conditionValue : [$conditionValue]),
            'is_empty' => empty($ticketValue),
            'is_not_empty' => !empty($ticketValue),
            'greater_than' => $ticketValue > $conditionValue,
            'less_than' => $ticketValue < $conditionValue,
            default => false,
        };
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTrigger($query, string $triggerEvent)
    {
        return $query->where('trigger_event', $triggerEvent);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority', 'desc')->orderBy('id');
    }
}

