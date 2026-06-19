<?php

namespace App\Support;

use App\Models\Ticket;

class TicketRuleCatalog
{
    public const CONDITION_FIELDS = [
        'category_id',
        'project_id',
        'priority',
        'status',
        'source',
        'assigned_team_id',
        'assigned_agent_id',
        'requester_id',
    ];

    public const AUTOMATION_CONTEXT_FIELDS = [
        'comment_is_internal',
        'comment_user_id',
    ];

    public const VALUELESS_OPERATORS = [
        'is_empty',
        'is_not_empty',
        'is_changed',
    ];

    public const VALUELESS_ACTIONS = [
        'notify_requester',
        'notify_agent',
        'notify_department_managers',
        'notify_comment_participants',
    ];

    public const CONDITION_OPERATORS = [
        'equals' => 'Equals',
        'not_equals' => 'Not Equals',
        'contains' => 'Contains',
        'not_contains' => 'Not Contains',
        'in' => 'In',
        'not_in' => 'Not In',
        'is_empty' => 'Is Empty',
        'is_not_empty' => 'Is Not Empty',
        'greater_than' => 'Greater Than',
        'greater_than_or_equals' => 'Greater Than or Equal',
        'less_than' => 'Less Than',
        'less_than_or_equals' => 'Less Than or Equal',
        'starts_with' => 'Starts With',
        'ends_with' => 'Ends With',
    ];

    public const CHANGE_OPERATORS = [
        'is_changed' => 'Is Changed',
        'changed_to' => 'Changed To',
        'changed_from' => 'Changed From',
    ];

    public const ACTION_TYPES = [
        'assign_to_team' => 'Assign to Team',
        'assign_to_agent' => 'Assign to Agent',
        'set_status' => 'Set Status',
        'set_priority' => 'Set Priority',
        'set_category' => 'Set Category',
        'set_sla_policy' => 'Set SLA Policy',
        'add_tags' => 'Add Tags',
        'notify_requester' => 'Notify Requester',
        'notify_agent' => 'Notify Agent',
        'notify_team' => 'Notify Team',
        'notify_role' => 'Notify Role',
        'notify_user' => 'Notify User',
        'notify_department_managers' => 'Notify Department Managers',
        'notify_comment_participants' => 'Notify Comment Participants',
        'send_telegram_message' => 'Send Telegram Message',
    ];

    public const ESCALATION_ACTION_TYPES = [
        'set_priority',
        'set_status',
        'assign_to_team',
        'assign_to_agent',
        'notify_agent',
        'notify_team',
        'notify_department_managers',
    ];

    public const LEGACY_ACTION_ALIASES = [
        'change_priority' => 'set_priority',
        'change_status' => 'set_status',
        'reassign_to_team' => 'assign_to_team',
        'reassign_to_agent' => 'assign_to_agent',
        'notify_manager' => 'notify_department_managers',
        'notify_team_managers' => 'notify_department_managers',
    ];

    public static function conditionOperators(bool $includeChangeOperators = false): array
    {
        return $includeChangeOperators
            ? array_merge(self::CONDITION_OPERATORS, self::CHANGE_OPERATORS)
            : self::CONDITION_OPERATORS;
    }

    public static function automationActionTypes(): array
    {
        return self::ACTION_TYPES;
    }

    public static function escalationActionTypes(): array
    {
        return array_intersect_key(
            self::ACTION_TYPES,
            array_flip(self::ESCALATION_ACTION_TYPES)
        );
    }

    public static function supportedActionNames(): array
    {
        return array_merge(array_keys(self::ACTION_TYPES), array_keys(self::LEGACY_ACTION_ALIASES));
    }

    public static function supportedEscalationActionNames(): array
    {
        return array_merge(
            self::ESCALATION_ACTION_TYPES,
            array_keys(self::LEGACY_ACTION_ALIASES)
        );
    }

    public static function normalizeActions(?array $actions): array
    {
        return array_map(function (array $action): array {
            $type = $action['type'] ?? $action['name'] ?? null;

            if ($type && isset(self::LEGACY_ACTION_ALIASES[$type])) {
                $action['type'] = self::LEGACY_ACTION_ALIASES[$type];
                unset($action['name']);
            }

            return $action;
        }, $actions ?? []);
    }

    public static function conditionValueError(string $field, string $operator, mixed $value): ?string
    {
        if (in_array($operator, self::VALUELESS_OPERATORS, true)) {
            return null;
        }

        if ($value === null || $value === '') {
            return 'A value is required for this condition.';
        }

        return match ($field) {
            'priority' => self::allValuesIn($value, Ticket::PRIORITIES)
                ? null
                : 'The selected priority is invalid.',
            'status' => self::allValuesIn($value, Ticket::STATUSES)
                ? null
                : 'The selected status is invalid.',
            'source' => self::allValuesIn($value, Ticket::SOURCES)
                ? null
                : 'The selected source is invalid.',
            'comment_is_internal' => self::allValuesIn(
                $value,
                [true, false, 1, 0, '1', '0']
            )
                ? null
                : 'The comment visibility value is invalid.',
            'comment_user_id' => self::missingModelValue('users', $value),
            'category_id' => self::missingModelValue('ticket_categories', $value),
            'project_id' => self::missingModelValue('projects', $value),
            'assigned_team_id' => self::missingModelValue('departments', $value),
            'assigned_agent_id', 'requester_id' => self::missingModelValue('users', $value),
            default => 'The selected condition field is invalid.',
        };
    }

    public static function automationConditionFields(): array
    {
        return array_merge(self::CONDITION_FIELDS, self::AUTOMATION_CONTEXT_FIELDS);
    }

    public static function actionValueError(string $type, mixed $value): ?string
    {
        $type = self::LEGACY_ACTION_ALIASES[$type] ?? $type;

        if (in_array($type, self::VALUELESS_ACTIONS, true)) {
            return null;
        }

        if ($value === null || $value === '' || $value === []) {
            return 'A value is required for this action.';
        }

        return match ($type) {
            'set_status' => in_array($value, Ticket::STATUSES, true)
                ? null
                : 'The selected status is invalid.',
            'set_priority' => in_array($value, Ticket::PRIORITIES, true)
                ? null
                : 'The selected priority is invalid.',
            'assign_to_team', 'notify_team' => self::missingModelValue('departments', $value),
            'assign_to_agent', 'notify_user' => self::missingModelValue('users', $value),
            'set_category' => self::missingModelValue('ticket_categories', $value),
            'set_sla_policy' => self::missingModelValue('sla_policies', $value),
            'add_tags' => self::missingModelValue('tags', $value),
            'notify_role' => self::missingModelValue('roles', $value, 'name'),
            'send_telegram_message' => self::telegramTargetError($value),
            default => null,
        };
    }

    protected static function missingModelValue(
        string $table,
        mixed $value,
        string $column = 'id'
    ): ?string {
        $values = is_array($value) ? $value : [$value];

        foreach ($values as $item) {
            if (! \Illuminate\Support\Facades\DB::table($table)->where($column, $item)->exists()) {
                return 'The selected value does not exist.';
            }
        }

        return null;
    }

    protected static function telegramTargetError(mixed $value): ?string
    {
        if (in_array($value, ['requester', 'assigned_agent', 'assigned_team'], true)) {
            return null;
        }

        return self::missingModelValue('users', $value);
    }

    protected static function allValuesIn(mixed $value, array $allowedValues): bool
    {
        foreach ((array) $value as $item) {
            if (! in_array($item, $allowedValues, true)) {
                return false;
            }
        }

        return true;
    }
}
