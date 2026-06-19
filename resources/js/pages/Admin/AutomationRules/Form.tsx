import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

import {
    RuleActionsEditor,
    type RuleAction as Action,
} from '@/components/admin/rules/RuleActionsEditor';
import {
    AUTOMATION_CONDITION_FIELDS,
    RuleConditionsEditor,
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

interface AutomationRuleFormProps {
    rule?: {
        id: number;
        name: string;
        description?: string;
        trigger_event: string;
        conditions: Condition[];
        actions: Action[];
        priority: number;
        is_active: boolean;
    };
    triggerEvents: string[];
    conditionOperators: Record<string, string>;
    actionTypes: Record<string, string>;
    options: {
        categories: { value: number; label: string }[];
        projects: { value: number; label: string }[];
        departments: { value: number; label: string }[];
        users: { value: number; label: string }[];
        sla_policies: { value: number; label: string }[];
        tags: { value: number; label: string }[];
        roles: { value: string; label: string }[];
        statuses: string[];
        priorities: string[];
        sources: string[];
    };
}

export default function AutomationRuleForm({
    rule,
    triggerEvents,
    conditionOperators,
    actionTypes,
    options,
}: AutomationRuleFormProps) {
    const isEdit = !!rule;
    const { errors } = usePage<PageProps>().props;

    const { data, setData, post, put, processing } = useForm({
        name: rule?.name ?? '',
        description: rule?.description ?? '',
        trigger_event: rule?.trigger_event ?? triggerEvents[0] ?? '',
        conditions: (rule?.conditions ?? []) as Condition[],
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
                return options.users;
            case 'requester_id':
                return options.users;
            case 'comment_is_internal':
                return [
                    { value: '0', label: 'Public comment' },
                    { value: '1', label: 'Internal comment' },
                ];
            case 'comment_user_id':
                return options.users;
            default:
                return [];
        }
    };

    const getActionOptions = (actionType: string) => {
        switch (actionType) {
            case 'assign_to_team':
                return options.departments;
            case 'assign_to_agent':
                return options.users;
            case 'set_status':
                return options.statuses.map((s) => ({ value: s, label: s }));
            case 'set_priority':
                return options.priorities.map((p) => ({ value: p, label: p }));
            case 'set_category':
                return options.categories;
            case 'set_sla_policy':
                return options.sla_policies;
            case 'add_tags':
                return options.tags;
            case 'notify_team':
                return options.departments;
            case 'notify_role':
                return options.roles;
            case 'notify_user':
                return options.users;
            case 'send_telegram_message':
                return [
                    { value: 'requester', label: 'Requester' },
                    { value: 'assigned_agent', label: 'Assigned Agent' },
                    { value: 'assigned_team', label: 'Assigned Team' },
                ];
            default:
                return [];
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEdit && rule) {
            put(route('admin.automation-rules.update', rule.id));
        } else {
            post(route('admin.automation-rules.store'));
        }
    };

    return (
        <AppLayout>
            <Head
                title={isEdit ? 'Edit Automation Rule' : 'New Automation Rule'}
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isEdit
                                ? 'Edit Automation Rule'
                                : 'New Automation Rule'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEdit
                                ? 'Update the automation rule.'
                                : 'Create a new automation rule to automate ticket workflows.'}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={route('admin.automation-rules.index')}>
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
                                        ? 'Update the automation rule details below.'
                                        : 'Fill in the information to create a new automation rule.'}
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
                                        placeholder="e.g. Auto-assign High Priority Tickets"
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
                                        placeholder="Describe what this rule does..."
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-red-500">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Trigger Event */}
                                <div className="space-y-2">
                                    <Label htmlFor="trigger_event">
                                        Trigger Event *
                                    </Label>
                                    <Select
                                        value={data.trigger_event}
                                        onValueChange={(value) =>
                                            setData('trigger_event', value)
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {triggerEvents.map((event) => (
                                                <SelectItem
                                                    key={event}
                                                    value={event}
                                                >
                                                    {event
                                                        .replace(/_/g, ' ')
                                                        .replace(/\b\w/g, (l) =>
                                                            l.toUpperCase(),
                                                        )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.trigger_event && (
                                        <p className="text-xs text-red-500">
                                            {errors.trigger_event}
                                        </p>
                                    )}
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">
                                        Priority (0-100) *
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

                                <RuleConditionsEditor
                                    conditions={data.conditions}
                                    fields={AUTOMATION_CONDITION_FIELDS}
                                    operators={conditionOperators}
                                    getOptions={getFieldOptions}
                                    onChange={(conditions) =>
                                        setData('conditions', conditions)
                                    }
                                    defaultCondition={{
                                        field: 'category_id',
                                        operator: 'equals',
                                        value: '',
                                    }}
                                    optional
                                    error={errors.conditions}
                                />

                                <RuleActionsEditor
                                    actions={data.actions}
                                    actionTypes={actionTypes}
                                    getOptions={getActionOptions}
                                    onChange={(actions) =>
                                        setData('actions', actions)
                                    }
                                    defaultAction={{
                                        type: 'assign_to_team',
                                        value: '',
                                    }}
                                    noValueActions={[
                                        'notify_requester',
                                        'notify_agent',
                                        'notify_department_managers',
                                        'notify_comment_participants',
                                    ]}
                                    error={errors.actions}
                                />

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
                                            'admin.automation-rules.index',
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
                                        Conditions
                                    </p>
                                    <p className="text-muted-foreground">
                                        All conditions must match for the rule
                                        to execute. Use AND logic between
                                        conditions.
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 font-medium">Actions</p>
                                    <p className="text-muted-foreground">
                                        All actions will be executed when
                                        conditions match. Actions run in the
                                        order listed.
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 font-medium">Priority</p>
                                    <p className="text-muted-foreground">
                                        Rules with higher priority execute
                                        first. Use this to control rule
                                        execution order.
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
