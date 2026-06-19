import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

import {
    RuleActionsEditor,
    type RuleAction as Action,
} from '@/components/admin/rules/RuleActionsEditor';
import {
    RuleConditionsEditor,
    TICKET_CONDITION_FIELDS,
    type RuleCondition as Condition,
} from '@/components/admin/rules/RuleConditionsEditor';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface EscalationRuleFormProps {
    rule?: {
        id: number;
        name: string;
        description?: string;
        conditions: Condition[];
        time_trigger_type?: string;
        time_trigger_minutes?: number;
        repeat_interval_minutes?: number | null;
        actions: Action[];
        priority: number;
        is_active: boolean;
    };
    timeTriggerTypes: Record<string, string>;
    conditionOperators: Record<string, string>;
    actionTypes: Record<string, string>;
    options: {
        priorities: string[];
        statuses: string[];
        sources: string[];
        categories: { value: number; label: string }[];
        projects: { value: number; label: string }[];
        departments: { value: number; label: string }[];
        users: { value: number; label: string }[];
    };
}

export default function EscalationRuleForm({
    rule,
    timeTriggerTypes,
    conditionOperators,
    actionTypes,
    options,
}: EscalationRuleFormProps) {
    const isEdit = !!rule;
    const { errors } = usePage<PageProps>().props;

    const { data, setData, post, put, processing } = useForm({
        name: rule?.name ?? '',
        description: rule?.description ?? '',
        conditions: (rule?.conditions ?? []) as Condition[],
        time_trigger_type:
            rule?.time_trigger_type ?? Object.keys(timeTriggerTypes)[0] ?? '',
        time_trigger_minutes: rule?.time_trigger_minutes ?? 15,
        repeat_interval_minutes: rule?.repeat_interval_minutes ?? null,
        actions: (rule?.actions ?? []) as Action[],
        priority: rule?.priority ?? 0,
        is_active: rule?.is_active ?? true,
    });

    const getFieldOptions = (field: string) => {
        switch (field) {
            case 'category_id':
                return options.categories;
            case 'project_id':
                return options.projects;
            case 'priority':
                return options.priorities.map((p) => ({ value: p, label: p }));
            case 'status':
                return options.statuses.map((s) => ({ value: s, label: s }));
            case 'source':
                return options.sources.map((source) => ({
                    value: source,
                    label: source,
                }));
            case 'assigned_team_id':
                return options.departments;
            case 'assigned_agent_id':
            case 'requester_id':
                return options.users;
            default:
                return [];
        }
    };

    const getActionOptions = (actionType: string) => {
        switch (actionType) {
            case 'set_priority':
                return options.priorities.map((p) => ({ value: p, label: p }));
            case 'set_status':
                return options.statuses.map((s) => ({ value: s, label: s }));
            case 'assign_to_team':
                return options.departments;
            case 'assign_to_agent':
            case 'notify_agent':
                return options.users;
            case 'notify_team':
                return options.departments;
            default:
                return [];
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEdit && rule) {
            put(route('admin.escalation-rules.update', rule.id));
        } else {
            post(route('admin.escalation-rules.store'));
        }
    };

    return (
        <AppLayout>
            <Head
                title={isEdit ? 'Edit Escalation Rule' : 'New Escalation Rule'}
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isEdit
                                ? 'Edit Escalation Rule'
                                : 'New Escalation Rule'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEdit
                                ? 'Update the escalation rule.'
                                : 'Create a rule to automatically escalate tickets based on time and conditions.'}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={route('admin.escalation-rules.index')}>
                            ← Back
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Rule Information</CardTitle>
                                <CardDescription>
                                    {isEdit
                                        ? 'Update the escalation rule details below.'
                                        : 'Fill in the information to create a new escalation rule.'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Rule Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="e.g. Escalate High Priority After 2 Hours"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Describe when this rule should trigger..."
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-red-500">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Time Trigger */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-lg font-semibold">
                                        Time Trigger
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="time_trigger_type">
                                                Trigger Type
                                            </Label>
                                            <Select
                                                value={data.time_trigger_type}
                                                onValueChange={(value) =>
                                                    setData(
                                                        'time_trigger_type',
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select trigger type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(
                                                        timeTriggerTypes,
                                                    ).map(([value, label]) => (
                                                        <SelectItem
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="time_trigger_minutes">
                                                Time (minutes) *
                                            </Label>
                                            <Input
                                                id="time_trigger_minutes"
                                                type="number"
                                                min="1"
                                                value={
                                                    data.time_trigger_minutes
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'time_trigger_minutes',
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                                placeholder="e.g. 120 for 2 hours"
                                                required
                                            />
                                            {data.time_trigger_minutes > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {Math.floor(
                                                        data.time_trigger_minutes /
                                                            60,
                                                    )}
                                                    h{' '}
                                                    {data.time_trigger_minutes %
                                                        60}
                                                    m
                                                </p>
                                            )}
                                            {errors.time_trigger_minutes && (
                                                <p className="text-xs text-red-500">
                                                    {
                                                        errors.time_trigger_minutes
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="repeat_interval_minutes">
                                            Repeat interval (minutes)
                                        </Label>
                                        <Input
                                            id="repeat_interval_minutes"
                                            type="number"
                                            min="1"
                                            value={
                                                data.repeat_interval_minutes ??
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'repeat_interval_minutes',
                                                    e.target.value
                                                        ? parseInt(
                                                              e.target.value,
                                                          )
                                                        : null,
                                                )
                                            }
                                            placeholder="Leave empty to run once"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave empty for one execution per
                                            ticket. Set a value only when
                                            repeated escalation is intentional.
                                        </p>
                                        {errors.repeat_interval_minutes && (
                                            <p className="text-xs text-red-500">
                                                {errors.repeat_interval_minutes}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <RuleConditionsEditor
                                        conditions={data.conditions}
                                        fields={TICKET_CONDITION_FIELDS}
                                        operators={conditionOperators}
                                        getOptions={getFieldOptions}
                                        onChange={(conditions) =>
                                            setData('conditions', conditions)
                                        }
                                        defaultCondition={{
                                            field: 'priority',
                                            operator: 'equals',
                                            value: '',
                                        }}
                                        optional
                                        error={errors.conditions}
                                    />
                                </div>

                                <div className="border-t pt-4">
                                    <RuleActionsEditor
                                        actions={data.actions}
                                        actionTypes={actionTypes}
                                        getOptions={getActionOptions}
                                        onChange={(actions) =>
                                            setData('actions', actions)
                                        }
                                        defaultAction={{
                                            type: 'set_priority',
                                            value: '',
                                        }}
                                        noValueActions={[
                                            'notify_agent',
                                            'notify_department_managers',
                                        ]}
                                        error={errors.actions}
                                    />
                                </div>

                                {/* Priority */}
                                <div className="space-y-2 border-t pt-4">
                                    <Label htmlFor="priority">
                                        Rule Priority (0-100) *
                                    </Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.priority}
                                        onChange={(e) =>
                                            setData(
                                                'priority',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Higher priority rules execute first
                                    </p>
                                    {errors.priority && (
                                        <p className="text-xs text-red-500">
                                            {errors.priority}
                                        </p>
                                    )}
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'is_active',
                                                Boolean(checked),
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        Rule is active
                                    </Label>
                                </div>
                                <p className="ml-6 text-xs text-muted-foreground">
                                    Inactive rules won't be executed
                                </p>
                            </CardContent>

                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link
                                        href={route(
                                            'admin.escalation-rules.index',
                                        )}
                                    >
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Saving...'
                                        : isEdit
                                          ? 'Update Rule'
                                          : 'Create Rule'}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Help Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>How It Works</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="mb-1 font-medium">
                                        Time Triggers
                                    </p>
                                    <p className="text-muted-foreground">
                                        Escalate tickets after a certain time
                                        has passed. Choose from creation time,
                                        last update, or SLA due dates.
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 font-medium">
                                        Conditions
                                    </p>
                                    <p className="text-muted-foreground">
                                        Optional conditions to limit which
                                        tickets are escalated. All conditions
                                        must match.
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 font-medium">Actions</p>
                                    <p className="text-muted-foreground">
                                        Actions to execute when escalation
                                        triggers. Can change priority, reassign,
                                        or send notifications.
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 font-medium">
                                        Scheduled Execution
                                    </p>
                                    <p className="text-muted-foreground">
                                        Rules are checked periodically (e.g.,
                                        every 15 minutes) via a scheduled task.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
