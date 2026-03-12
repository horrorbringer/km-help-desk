<?php

namespace App\Traits;

use App\Models\Ticket;

/**
 * Trait HandlesRuleLogic
 * 
 * Centralizes rule evaluation and condition matching logic for different rule models.
 */
trait HandlesRuleLogic
{
    /**
     * Check if ticket matches rule conditions
     */
    public function matches(Ticket $ticket, array $originalData = []): bool
    {
        // For EscalationRule, is_active check is handled here
        // For AutomationRule, is_active is checked in the service but safe to check here too
        if (!$this->is_active) {
            return false;
        }

        if (empty($this->conditions)) {
            // Some rules might have no conditions and rely only on triggers (e.g., time trigger)
            // But if there ARE conditions, they MUST pass.
            return true;
        }

        foreach ($this->conditions as $condition) {
            $field = $condition['field'] ?? null;
            $operator = $condition['operator'] ?? 'equals';
            $value = $condition['value'] ?? null;

            if (!$field) {
                continue;
            }

            $ticketValue = $this->getTicketValue($ticket, $field);
            $oldValue = $originalData[$field] ?? null;

            if (!$this->evaluateCondition($ticketValue, $operator, $value, $oldValue)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get ticket value for a field
     */
    protected function getTicketValue(Ticket $ticket, string $field): mixed
    {
        // Support nested fields (e.g., 'category.name')
        if (str_contains($field, '.')) {
            $parts = explode('.', $field);
            $target = $ticket;
            foreach ($parts as $part) {
                if (is_object($target)) {
                    $target = $target->$part;
                }
                elseif (is_array($target)) {
                    $target = $target[$part] ?? null;
                }
                else {
                    return null;
                }
            }
            return $target;
        }

        $value = match ($field) {
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

        // If not found in standard attributes, check custom fields
        if ($value === null) {
            $slug = str_starts_with($field, 'cf_') ? substr($field, 3) : $field;

            // Check if ticket relationship is loaded or use lazy load
            $customFieldValue = $ticket->customFieldValues()
                ->whereHas('customField', fn($q) => $q->where('slug', $slug))
                ->first();

            if ($customFieldValue) {
                return $customFieldValue->formatted_value;
            }
        }

        return $value;
    }

    /**
     * Evaluate a condition
     */
    protected function evaluateCondition(mixed $ticketValue, string $operator, mixed $conditionValue, mixed $oldValue = null): bool
    {
        return match ($operator) {
                'equals', '==' => $ticketValue == $conditionValue,
                'not_equals', '!=' => $ticketValue != $conditionValue,
                'contains' => is_string($ticketValue) && is_string($conditionValue) && str_contains(strtolower($ticketValue), strtolower($conditionValue)),
                'not_contains' => is_string($ticketValue) && is_string($conditionValue) && !str_contains(strtolower($ticketValue), strtolower($conditionValue)),
                'in' => in_array($ticketValue, is_array($conditionValue) ? $conditionValue : [$conditionValue]),
                'not_in' => !in_array($ticketValue, is_array($conditionValue) ? $conditionValue : [$conditionValue]),
                'is_empty', 'empty' => empty($ticketValue),
                'is_not_empty', 'not_empty' => !empty($ticketValue),
                'greater_than', '>' => $ticketValue > $conditionValue,
                'greater_than_or_equals', '>=' => $ticketValue >= $conditionValue,
                'less_than', '<' => $ticketValue < $conditionValue,
                'less_than_or_equals', '<=' => $ticketValue <= $conditionValue,
                'starts_with' => is_string($ticketValue) && is_string($conditionValue) && str_starts_with(strtolower($ticketValue), strtolower($conditionValue)),
                'ends_with' => is_string($ticketValue) && is_string($conditionValue) && str_ends_with(strtolower($ticketValue), strtolower($conditionValue)),
                // Change tracking operators
                'is_changed', 'changed' => $ticketValue != $oldValue,
                'changed_to' => $ticketValue == $conditionValue && $oldValue != $conditionValue,
                'changed_from' => $oldValue == $conditionValue && $ticketValue != $conditionValue,
                default => false,
            };
    }
}