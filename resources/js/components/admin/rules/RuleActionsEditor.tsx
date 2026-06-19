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

import type { RuleOption } from './RuleConditionsEditor';

export interface RuleAction {
    type: string;
    value: string | number | number[] | null;
}

interface RuleActionsEditorProps {
    actions: RuleAction[];
    actionTypes: Record<string, string>;
    getOptions: (actionType: string) => RuleOption[];
    onChange: (actions: RuleAction[]) => void;
    defaultAction: RuleAction;
    noValueActions?: string[];
    error?: string;
}

export function RuleActionsEditor({
    actions,
    actionTypes,
    getOptions,
    onChange,
    defaultAction,
    noValueActions = [],
    error,
}: RuleActionsEditorProps) {
    const updateAction = (
        index: number,
        field: keyof RuleAction,
        value: RuleAction[keyof RuleAction],
    ) => {
        const updated = [...actions];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Actions *</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...actions, defaultAction])}
                >
                    <IconPlus className="mr-1 h-4 w-4" />
                    Add Action
                </Button>
            </div>
            {actions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                    Add at least one action to execute when the rule matches
                </p>
            )}
            {actions.map((action, index) => (
                <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg border p-3"
                >
                    <div className="grid flex-1 grid-cols-2 gap-2">
                        <Select
                            value={action.type}
                            onValueChange={(value) =>
                                updateAction(index, 'type', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(actionTypes).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                        {noValueActions.includes(action.type) ? (
                            <div className="flex items-center text-sm text-muted-foreground">
                                (no value needed)
                            </div>
                        ) : (
                            <Select
                                value={String(action.value ?? '')}
                                onValueChange={(value) =>
                                    updateAction(index, 'value', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Value" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getOptions(action.type).map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={String(option.value)}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
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
                                actions.filter(
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
