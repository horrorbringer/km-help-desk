import { IconPlus, IconTrash } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface RuleCondition {
    field: string;
    operator: string;
    value: string | number | null;
}

export interface RuleOption {
    value: string | number;
    label: string;
}

export const TICKET_CONDITION_FIELDS: RuleOption[] = [
    { value: 'category_id', label: 'Category' },
    { value: 'project_id', label: 'Project' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'source', label: 'Source' },
    { value: 'assigned_team_id', label: 'Assigned Team' },
    { value: 'assigned_agent_id', label: 'Assigned Agent' },
    { value: 'requester_id', label: 'Requester' },
];

export const AUTOMATION_CONDITION_FIELDS: RuleOption[] = [
    ...TICKET_CONDITION_FIELDS,
    { value: 'comment_is_internal', label: 'Comment Is Internal' },
    { value: 'comment_user_id', label: 'Comment Author' },
];

interface RuleConditionsEditorProps {
    conditions: RuleCondition[];
    fields: RuleOption[];
    operators: Record<string, string>;
    getOptions: (field: string) => RuleOption[];
    onChange: (conditions: RuleCondition[]) => void;
    defaultCondition: RuleCondition;
    optional?: boolean;
    error?: string;
}

export function RuleConditionsEditor({
    conditions,
    fields,
    operators,
    getOptions,
    onChange,
    defaultCondition,
    optional = false,
    error,
}: RuleConditionsEditorProps) {
    const updateCondition = (
        index: number,
        field: keyof RuleCondition,
        value: string | number | null,
    ) => {
        const updated = [...conditions];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Conditions{optional ? ' (Optional)' : ' *'}</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...conditions, defaultCondition])}
                >
                    <IconPlus className="mr-1 h-4 w-4" />
                    Add Condition
                </Button>
            </div>
            {conditions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                    {optional
                        ? 'With no conditions, the rule applies to every matching trigger'
                        : 'Add at least one condition for the rule to match'}
                </p>
            )}
            {conditions.map((condition, index) => (
                <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg border p-3"
                >
                    <div className="grid flex-1 grid-cols-3 gap-2">
                        <Select
                            value={condition.field}
                            onValueChange={(value) =>
                                updateCondition(index, 'field', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {fields.map((field) => (
                                    <SelectItem
                                        key={field.value}
                                        value={String(field.value)}
                                    >
                                        {field.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={condition.operator}
                            onValueChange={(value) =>
                                updateCondition(index, 'operator', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(operators).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                        {['is_empty', 'is_not_empty', 'is_changed'].includes(
                            condition.operator,
                        ) ? (
                            <div className="flex items-center text-sm text-muted-foreground">
                                (no value needed)
                            </div>
                        ) : (
                            <Select
                                value={String(condition.value ?? '')}
                                onValueChange={(value) =>
                                    updateCondition(index, 'value', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Value" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getOptions(condition.field).map(
                                        (option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={String(option.value)}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            onChange(
                                conditions.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                ),
                            )
                        }
                    >
                        <IconTrash className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
