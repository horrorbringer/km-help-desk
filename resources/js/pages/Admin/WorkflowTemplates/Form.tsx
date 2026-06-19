/* eslint-disable @typescript-eslint/no-explicit-any */
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    LayoutList,
    Network,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

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
import WorkflowGraphEditor from '@/components/workflow/WorkflowGraphEditor';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface WorkflowTemplate {
    id?: number;
    name: string;
    description?: string | null;
    category_id?: number | null;
    department_id?: number | null;
    workflow_steps: any[];
    routing_rules: any[];
    approval_rules: any[];
    is_active: boolean;
    priority: number;
}

interface WorkflowTemplateFormProps {
    template?: WorkflowTemplate;
    formOptions: {
        categories: Array<{ value: number; label: string }>;
        departments: Array<{ value: number; label: string }>;
        users: Array<{ value: number; label: string }>;
        approval_levels: Array<{ value: string; label: string }>;
        approver_types: Array<{ value: string; label: string }>;
        notification_types: Array<{ value: string; label: string }>;
        step_types: Array<{ value: string; label: string }>;
        operators: Array<{ value: string; label: string }>;
    };
}

export default function WorkflowTemplateForm({
    template,
    formOptions,
}: WorkflowTemplateFormProps) {
    const isEdit = !!template;
    const { errors } = usePage<PageProps>().props;
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
        new Set([0]),
    );
    const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');

    const { data, setData, post, put, processing, transform } = useForm({
        name: template?.name ?? '',
        description: template?.description ?? '',
        category_id: template?.category_id
            ? String(template.category_id)
            : '__none',
        department_id: template?.department_id
            ? String(template.department_id)
            : '__none',
        workflow_steps: template?.workflow_steps ?? [
            {
                step_id: 1,
                type: 'approval',
                approval_level: 'lm',
                approver_type: 'line_manager',
            },
        ],
        routing_rules: template?.routing_rules ?? [],
        approval_rules: template?.approval_rules ?? [],
        is_active: template?.is_active ?? true,
        priority: template?.priority ?? 0,
    });

    transform((data) => {
        return {
            ...data,
            category_id:
                data.category_id === '__none'
                    ? null
                    : data.category_id
                      ? Number(data.category_id)
                      : null,
            department_id:
                data.department_id === '__none'
                    ? null
                    : data.department_id
                      ? Number(data.department_id)
                      : null,
            priority: Number(data.priority) || 0,
        };
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEdit && template?.id) {
            put(route('admin.workflow-templates.update', template.id));
        } else {
            post(route('admin.workflow-templates.store'));
        }
    };

    const addWorkflowStep = () => {
        const maxStepId = Math.max(
            ...data.workflow_steps.map((s: any) => s.step_id || 0),
            0,
        );
        setData('workflow_steps', [
            ...data.workflow_steps,
            {
                step_id: maxStepId + 1,
                type: 'approval',
                approval_level: 'lm',
                approver_type: 'line_manager',
            },
        ]);
        setExpandedSteps(new Set([...expandedSteps, maxStepId + 1]));
    };

    const removeWorkflowStep = (index: number) => {
        const newSteps = data.workflow_steps.filter(
            (_: any, i: number) => i !== index,
        );
        setData('workflow_steps', newSteps);
    };

    const updateWorkflowStep = (index: number, field: string, value: any) => {
        const newSteps = [...data.workflow_steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setData('workflow_steps', newSteps);
    };

    const updateWorkflowStepFields = (
        index: number,
        fields: Record<string, any>,
    ) => {
        const newSteps = [...data.workflow_steps];
        newSteps[index] = { ...newSteps[index], ...fields };
        setData('workflow_steps', newSteps);
    };

    const updateConditionRule = (
        index: number,
        step: any,
        updates: Partial<{
            field: string;
            operator: string;
            value: string;
        }>,
    ) => {
        const field = updates.field ?? step.condition_field ?? 'estimated_cost';
        const operator = updates.operator ?? step.condition_operator ?? '>=';
        const value = updates.value ?? step.condition_value ?? '';

        updateWorkflowStepFields(index, {
            condition_field: field,
            condition_operator: operator,
            condition_value: value,
            condition: [field, operator === '=' ? '==' : operator, value],
        });
    };

    const getDefaultApproverType = (approvalLevel: string) => {
        if (['lm', 'dlm'].includes(approvalLevel)) {
            return 'line_manager';
        }

        if (['hod', 'dhod'].includes(approvalLevel)) {
            return 'head_of_department';
        }

        if (['ceo', 'dceo', 'director'].includes(approvalLevel)) {
            return 'ceo';
        }

        return 'line_manager';
    };

    const updateApprovalLevel = (index: number, approvalLevel: string) => {
        updateWorkflowStepFields(index, {
            approval_level: approvalLevel,
            approver_type: getDefaultApproverType(approvalLevel),
        });
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        const newSteps = [...data.workflow_steps];
        if (direction === 'up' && index > 0) {
            [newSteps[index - 1], newSteps[index]] = [
                newSteps[index],
                newSteps[index - 1],
            ];
        } else if (direction === 'down' && index < newSteps.length - 1) {
            [newSteps[index], newSteps[index + 1]] = [
                newSteps[index + 1],
                newSteps[index],
            ];
        }
        setData('workflow_steps', newSteps);
    };

    const getStepDescription = (type: string) => {
        switch (type) {
            case 'approval':
                return 'Requires explicit approval from a designated approver before proceeding.';
            case 'conditional_approval':
                return 'Requires approval only when specific conditions (e.g., cost > $1000) are met.';
            case 'notification':
                return 'Sends an informational alert without blocking the workflow progress.';
            case 'routing':
                return 'Redirects the ticket to a different team or queue.';
            case 'conditional_routing':
                return 'Routes the ticket based on specific conditions.';
            case 'assignment':
                return 'Assigns the ticket to a specific user or role.';
            default:
                return 'Select a step type to see its description.';
        }
    };

    const toggleStep = (index: number) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedSteps(newExpanded);
    };

    const getStepSummary = (step: any) => {
        if (!step.type) return 'New Step';

        const typeLabel =
            formOptions.step_types.find((t) => t.value === step.type)?.label ||
            step.type;

        if (step.type === 'approval') {
            const level = formOptions.approval_levels.find(
                (l) => l.value === step.approval_level,
            )?.label;
            const approver = formOptions.approver_types.find(
                (t) => t.value === step.approver_type,
            )?.label;
            return `${typeLabel}: ${approver} (${level})`;
        }

        if (step.type === 'notification') {
            const types = [
                ...formOptions.approver_types,
                ...formOptions.notification_types,
            ];
            const type = types.find((t) => t.value === step.notify_type)?.label;
            return `${typeLabel}: ${type || step.notify_type}`;
        }

        if (step.type === 'routing') {
            if (step.team_id) {
                const team = formOptions.departments.find(
                    (department) => department.value === Number(step.team_id),
                )?.label;

                return `${typeLabel}: ${team || 'Specific Team'}`;
            }

            return `${typeLabel}: Category Default Team`;
        }

        if (step.type === 'conditional_routing') {
            const field = step.condition_field || 'estimated_cost';
            const operator = step.condition_operator || '>=';
            const value = step.condition_value || '...';

            return `${typeLabel}: If ${field} ${operator} ${value}`;
        }

        if (step.type === 'assignment') {
            if (step.user_id) {
                const user = formOptions.users.find(
                    (option) => option.value === Number(step.user_id),
                )?.label;

                return `${typeLabel}: Assign to ${user || 'Specific User'}`;
            }

            return `${typeLabel}: Assign to Last Approver`;
        }

        return typeLabel;
    };

    return (
        <AppLayout>
            <Head
                title={
                    isEdit ? 'Edit Workflow Template' : 'New Workflow Template'
                }
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isEdit
                                ? 'Edit Workflow Template'
                                : 'New Workflow Template'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEdit
                                ? 'Update workflow template and approval order.'
                                : 'Create a custom approval workflow with customizable order.'}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={route('admin.workflow-templates.index')}>
                            ← Back
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Template Information</CardTitle>
                                <CardDescription>
                                    {isEdit
                                        ? 'Update the workflow template details below.'
                                        : 'Fill in the information to create a new workflow template.'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Template Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="e.g. IT Hardware Purchase Workflow"
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
                                        placeholder="Describe when this workflow should be used..."
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-red-500">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Category & Department */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="category_id">
                                            Category (Optional)
                                        </Label>
                                        <Select
                                            value={data.category_id}
                                            onValueChange={(value) =>
                                                setData('category_id', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none">
                                                    All Categories (Global)
                                                </SelectItem>
                                                {formOptions.categories.map(
                                                    (cat) => (
                                                        <SelectItem
                                                            key={cat.value}
                                                            value={String(
                                                                cat.value,
                                                            )}
                                                        >
                                                            {cat.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Specific category this workflow
                                            applies to.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department_id">
                                            Department (Optional)
                                        </Label>
                                        <Select
                                            value={data.department_id}
                                            onValueChange={(value) =>
                                                setData('department_id', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none">
                                                    All Departments (Global)
                                                </SelectItem>
                                                {formOptions.departments.map(
                                                    (dept) => (
                                                        <SelectItem
                                                            key={dept.value}
                                                            value={String(
                                                                dept.value,
                                                            )}
                                                        >
                                                            {dept.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Specific department this workflow
                                            applies to.
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground italic">
                                            Note: If both Category and
                                            Department are set to "All", this
                                            workflow will apply to all tickets
                                            globally.
                                        </p>
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.priority}
                                        onChange={(e) =>
                                            setData(
                                                'priority',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Determines evaluation order (0-100).
                                        Higher values are checked first. Use
                                        this to prioritize specific workflows
                                        over generic ones.
                                    </p>
                                </div>

                                {/* Workflow Steps */}
                                <div className="space-y-4 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Workflow Steps *</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Define the approval order. Steps
                                                execute sequentially.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex items-center overflow-hidden rounded-md border bg-muted/50">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        viewMode === 'list'
                                                            ? 'secondary'
                                                            : 'ghost'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setViewMode('list')
                                                    }
                                                    className="h-8 rounded-none px-3"
                                                >
                                                    <LayoutList className="mr-2 h-4 w-4" />
                                                    List
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        viewMode === 'graph'
                                                            ? 'secondary'
                                                            : 'ghost'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setViewMode('graph')
                                                    }
                                                    className="h-8 rounded-none px-3"
                                                >
                                                    <Network className="mr-2 h-4 w-4" />
                                                    Graph
                                                </Button>
                                            </div>
                                            {viewMode === 'list' && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addWorkflowStep}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Step
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {viewMode === 'graph' ? (
                                        <WorkflowGraphEditor
                                            steps={data.workflow_steps}
                                            onChange={(newSteps) =>
                                                setData(
                                                    'workflow_steps',
                                                    newSteps,
                                                )
                                            }
                                            formOptions={formOptions}
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {data.workflow_steps.map(
                                                (step: any, index: number) => (
                                                    <Card
                                                        key={index}
                                                        className={`border-2 transition-all ${expandedSteps.has(index) ? 'border-primary/20 shadow-md' : 'border-border/50 hover:border-primary/20'}`}
                                                    >
                                                        <CardHeader
                                                            className="cursor-pointer pb-3 transition-colors select-none hover:bg-muted/5"
                                                            onClick={() =>
                                                                toggleStep(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${expandedSteps.has(index) ? 'border-primary bg-primary/10 text-primary' : 'border-muted text-muted-foreground'}`}
                                                                    >
                                                                        {index +
                                                                            1}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-semibold">
                                                                            {getStepSummary(
                                                                                step,
                                                                            )}
                                                                        </span>
                                                                        {!expandedSteps.has(
                                                                            index,
                                                                        ) && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Click
                                                                                to
                                                                                expand
                                                                                details
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="flex items-center gap-1"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            moveStep(
                                                                                index,
                                                                                'up',
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            index ===
                                                                            0
                                                                        }
                                                                    >
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            moveStep(
                                                                                index,
                                                                                'down',
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            index ===
                                                                            data
                                                                                .workflow_steps
                                                                                .length -
                                                                                1
                                                                        }
                                                                    >
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            removeWorkflowStep(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            toggleStep(
                                                                                index,
                                                                            )
                                                                        }
                                                                    >
                                                                        {expandedSteps.has(
                                                                            index,
                                                                        ) ? (
                                                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                                        ) : (
                                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        {expandedSteps.has(
                                                            index,
                                                        ) && (
                                                            <CardContent className="space-y-4 pt-0">
                                                                <div className="grid gap-4 rounded-lg bg-muted/30 p-4 md:grid-cols-2">
                                                                    <div className="space-y-2">
                                                                        <Label>
                                                                            Step
                                                                            Type
                                                                            *
                                                                        </Label>
                                                                        <Select
                                                                            value={
                                                                                step.type ||
                                                                                'approval'
                                                                            }
                                                                            onValueChange={(
                                                                                value,
                                                                            ) =>
                                                                                updateWorkflowStep(
                                                                                    index,
                                                                                    'type',
                                                                                    value,
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {formOptions.step_types.map(
                                                                                    (
                                                                                        type,
                                                                                    ) => (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                type.value
                                                                                            }
                                                                                            value={
                                                                                                type.value
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                type.label
                                                                                            }
                                                                                        </SelectItem>
                                                                                    ),
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {getStepDescription(
                                                                                step.type,
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    {(step.type ===
                                                                        'approval' ||
                                                                        step.type ===
                                                                            'conditional_approval') && (
                                                                        <>
                                                                            <div className="space-y-2">
                                                                                <Label>
                                                                                    Approval
                                                                                    Level
                                                                                    *
                                                                                </Label>
                                                                                <Select
                                                                                    value={
                                                                                        step.approval_level ||
                                                                                        'lm'
                                                                                    }
                                                                                    onValueChange={(
                                                                                        value,
                                                                                    ) =>
                                                                                        updateApprovalLevel(
                                                                                            index,
                                                                                            value,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {formOptions.approval_levels.map(
                                                                                            (
                                                                                                level,
                                                                                            ) => (
                                                                                                <SelectItem
                                                                                                    key={
                                                                                                        level.value
                                                                                                    }
                                                                                                    value={
                                                                                                        level.value
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        level.label
                                                                                                    }
                                                                                                </SelectItem>
                                                                                            ),
                                                                                        )}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Select
                                                                                    the
                                                                                    approval
                                                                                    stage
                                                                                    name,
                                                                                    such
                                                                                    as
                                                                                    LM,
                                                                                    HOD,
                                                                                    or
                                                                                    CEO.
                                                                                </p>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                <Label>
                                                                                    Find
                                                                                    Approver
                                                                                    By
                                                                                    *
                                                                                </Label>
                                                                                <Select
                                                                                    value={
                                                                                        step.approver_type ||
                                                                                        'line_manager'
                                                                                    }
                                                                                    onValueChange={(
                                                                                        value,
                                                                                    ) =>
                                                                                        updateWorkflowStep(
                                                                                            index,
                                                                                            'approver_type',
                                                                                            value,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {formOptions.approver_types.map(
                                                                                            (
                                                                                                type,
                                                                                            ) => (
                                                                                                <SelectItem
                                                                                                    key={
                                                                                                        type.value
                                                                                                    }
                                                                                                    value={
                                                                                                        type.value
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        type.label
                                                                                                    }
                                                                                                </SelectItem>
                                                                                            ),
                                                                                        )}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Who
                                                                                    should
                                                                                    approve
                                                                                    this
                                                                                    step.
                                                                                    This
                                                                                    auto-matches
                                                                                    the
                                                                                    approval
                                                                                    level,
                                                                                    but
                                                                                    you
                                                                                    can
                                                                                    change
                                                                                    it.
                                                                                </p>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                <Label>
                                                                                    Status
                                                                                    Label
                                                                                </Label>
                                                                                <Input
                                                                                    value={
                                                                                        step.status_label ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateWorkflowStep(
                                                                                            index,
                                                                                            'status_label',
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    placeholder="e.g. Awaiting HOD Sign-off"
                                                                                />
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Custom
                                                                                    status
                                                                                    shown
                                                                                    to
                                                                                    users
                                                                                    while
                                                                                    this
                                                                                    step
                                                                                    is
                                                                                    active.
                                                                                </p>
                                                                            </div>

                                                                            <div className="flex items-center gap-2 pt-2">
                                                                                <Checkbox
                                                                                    id={`auto_notify_${index}`}
                                                                                    checked={
                                                                                        step.auto_notify ??
                                                                                        true
                                                                                    }
                                                                                    onCheckedChange={(
                                                                                        checked,
                                                                                    ) =>
                                                                                        updateWorkflowStep(
                                                                                            index,
                                                                                            'auto_notify',
                                                                                            checked,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <div className="grid gap-1.5 leading-none">
                                                                                    <Label
                                                                                        htmlFor={`auto_notify_${index}`}
                                                                                        className="cursor-pointer"
                                                                                    >
                                                                                        Auto-Notify
                                                                                        Requester
                                                                                    </Label>
                                                                                    <p className="text-[11px] text-muted-foreground italic">
                                                                                        Automatically
                                                                                        tell
                                                                                        the
                                                                                        user
                                                                                        when
                                                                                        their
                                                                                        ticket
                                                                                        hits
                                                                                        this
                                                                                        stage.
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}

                                                                    {step.type ===
                                                                        'notification' && (
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Notify
                                                                                Type
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    step.notify_type ||
                                                                                    'head_of_department'
                                                                                }
                                                                                onValueChange={(
                                                                                    value,
                                                                                ) =>
                                                                                    updateWorkflowStep(
                                                                                        index,
                                                                                        'notify_type',
                                                                                        value,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger>
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {(
                                                                                        formOptions.notification_types ||
                                                                                        formOptions.approver_types
                                                                                    ).map(
                                                                                        (
                                                                                            type,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    type.value
                                                                                                }
                                                                                                value={
                                                                                                    type.value
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    type.label
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Send
                                                                                informational
                                                                                notification
                                                                                (no
                                                                                approval
                                                                                required)
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {step.type ===
                                                                        'routing' && (
                                                                        <>
                                                                            <div className="space-y-2">
                                                                                <Label>
                                                                                    Route
                                                                                    To
                                                                                </Label>
                                                                                <Select
                                                                                    value={
                                                                                        step.team_id
                                                                                            ? 'specific_team'
                                                                                            : 'category_default_team'
                                                                                    }
                                                                                    onValueChange={(
                                                                                        value,
                                                                                    ) => {
                                                                                        if (
                                                                                            value ===
                                                                                            'category_default_team'
                                                                                        ) {
                                                                                            updateWorkflowStepFields(
                                                                                                index,
                                                                                                {
                                                                                                    route_to:
                                                                                                        'category_default_team',
                                                                                                    team_id:
                                                                                                        null,
                                                                                                },
                                                                                            );
                                                                                            return;
                                                                                        }

                                                                                        updateWorkflowStepFields(
                                                                                            index,
                                                                                            {
                                                                                                route_to:
                                                                                                    'specific_team',
                                                                                                team_id:
                                                                                                    step.team_id ??
                                                                                                    '',
                                                                                            },
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="category_default_team">
                                                                                            Category
                                                                                            Default
                                                                                            Team
                                                                                        </SelectItem>
                                                                                        <SelectItem value="specific_team">
                                                                                            Specific
                                                                                            Team
                                                                                        </SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Choose
                                                                                    where
                                                                                    the
                                                                                    ticket
                                                                                    should
                                                                                    go
                                                                                    after
                                                                                    this
                                                                                    step.
                                                                                </p>
                                                                            </div>

                                                                            {step.team_id !==
                                                                                null &&
                                                                                step.route_to ===
                                                                                    'specific_team' && (
                                                                                    <div className="space-y-2">
                                                                                        <Label>
                                                                                            Team
                                                                                        </Label>
                                                                                        <Select
                                                                                            value={
                                                                                                step.team_id
                                                                                                    ? String(
                                                                                                          step.team_id,
                                                                                                      )
                                                                                                    : ''
                                                                                            }
                                                                                            onValueChange={(
                                                                                                value,
                                                                                            ) =>
                                                                                                updateWorkflowStep(
                                                                                                    index,
                                                                                                    'team_id',
                                                                                                    Number(
                                                                                                        value,
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Select team" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {formOptions.departments.map(
                                                                                                    (
                                                                                                        department,
                                                                                                    ) => (
                                                                                                        <SelectItem
                                                                                                            key={
                                                                                                                department.value
                                                                                                            }
                                                                                                            value={String(
                                                                                                                department.value,
                                                                                                            )}
                                                                                                        >
                                                                                                            {
                                                                                                                department.label
                                                                                                            }
                                                                                                        </SelectItem>
                                                                                                    ),
                                                                                                )}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                )}
                                                                        </>
                                                                    )}

                                                                    {step.type ===
                                                                        'conditional_routing' && (
                                                                        <>
                                                                            <div className="space-y-2 md:col-span-2">
                                                                                <Label>
                                                                                    Routing
                                                                                    Condition
                                                                                    *
                                                                                </Label>
                                                                                <div className="flex flex-col gap-2 md:flex-row">
                                                                                    <Select
                                                                                        value={
                                                                                            step.condition_field ||
                                                                                            'estimated_cost'
                                                                                        }
                                                                                        onValueChange={(
                                                                                            value,
                                                                                        ) =>
                                                                                            updateConditionRule(
                                                                                                index,
                                                                                                step,
                                                                                                {
                                                                                                    field: value,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <SelectTrigger className="md:w-[190px]">
                                                                                            <SelectValue placeholder="Field" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="estimated_cost">
                                                                                                Estimated
                                                                                                Cost
                                                                                            </SelectItem>
                                                                                            <SelectItem value="priority">
                                                                                                Priority
                                                                                            </SelectItem>
                                                                                            <SelectItem value="status">
                                                                                                Status
                                                                                            </SelectItem>
                                                                                            <SelectItem value="category.name">
                                                                                                Category
                                                                                                Name
                                                                                            </SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <Select
                                                                                        value={
                                                                                            step.condition_operator ||
                                                                                            '>='
                                                                                        }
                                                                                        onValueChange={(
                                                                                            value,
                                                                                        ) =>
                                                                                            updateConditionRule(
                                                                                                index,
                                                                                                step,
                                                                                                {
                                                                                                    operator:
                                                                                                        value,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <SelectTrigger className="md:w-[150px]">
                                                                                            <SelectValue placeholder="Operator" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="==">
                                                                                                Equals
                                                                                            </SelectItem>
                                                                                            <SelectItem value="!=">
                                                                                                Not
                                                                                                Equals
                                                                                            </SelectItem>
                                                                                            <SelectItem value=">=">
                                                                                                Greater
                                                                                                or
                                                                                                Equal
                                                                                            </SelectItem>
                                                                                            <SelectItem value=">">
                                                                                                Greater
                                                                                                Than
                                                                                            </SelectItem>
                                                                                            <SelectItem value="<=">
                                                                                                Less
                                                                                                or
                                                                                                Equal
                                                                                            </SelectItem>
                                                                                            <SelectItem value="<">
                                                                                                Less
                                                                                                Than
                                                                                            </SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <Input
                                                                                        value={
                                                                                            step.condition_value ||
                                                                                            ''
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateConditionRule(
                                                                                                index,
                                                                                                step,
                                                                                                {
                                                                                                    value: e
                                                                                                        .target
                                                                                                        .value,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        placeholder="e.g. critical, 5000, Hardware"
                                                                                        className="flex-1"
                                                                                    />
                                                                                </div>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    The
                                                                                    ticket
                                                                                    routes
                                                                                    only
                                                                                    when
                                                                                    this
                                                                                    condition
                                                                                    is
                                                                                    true.
                                                                                    If
                                                                                    false,
                                                                                    workflow
                                                                                    continues
                                                                                    to
                                                                                    the
                                                                                    next
                                                                                    step.
                                                                                </p>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                <Label>
                                                                                    Route
                                                                                    To
                                                                                </Label>
                                                                                <Select
                                                                                    value={
                                                                                        step.team_id
                                                                                            ? 'specific_team'
                                                                                            : 'category_default_team'
                                                                                    }
                                                                                    onValueChange={(
                                                                                        value,
                                                                                    ) => {
                                                                                        if (
                                                                                            value ===
                                                                                            'category_default_team'
                                                                                        ) {
                                                                                            updateWorkflowStepFields(
                                                                                                index,
                                                                                                {
                                                                                                    route_to:
                                                                                                        'category_default_team',
                                                                                                    team_id:
                                                                                                        null,
                                                                                                },
                                                                                            );
                                                                                            return;
                                                                                        }

                                                                                        updateWorkflowStepFields(
                                                                                            index,
                                                                                            {
                                                                                                route_to:
                                                                                                    'specific_team',
                                                                                                team_id:
                                                                                                    step.team_id ??
                                                                                                    '',
                                                                                            },
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="category_default_team">
                                                                                            Category
                                                                                            Default
                                                                                            Team
                                                                                        </SelectItem>
                                                                                        <SelectItem value="specific_team">
                                                                                            Specific
                                                                                            Team
                                                                                        </SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>

                                                                            {step.team_id !==
                                                                                null &&
                                                                                step.route_to ===
                                                                                    'specific_team' && (
                                                                                    <div className="space-y-2">
                                                                                        <Label>
                                                                                            Team
                                                                                        </Label>
                                                                                        <Select
                                                                                            value={
                                                                                                step.team_id
                                                                                                    ? String(
                                                                                                          step.team_id,
                                                                                                      )
                                                                                                    : ''
                                                                                            }
                                                                                            onValueChange={(
                                                                                                value,
                                                                                            ) =>
                                                                                                updateWorkflowStep(
                                                                                                    index,
                                                                                                    'team_id',
                                                                                                    Number(
                                                                                                        value,
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Select team" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {formOptions.departments.map(
                                                                                                    (
                                                                                                        department,
                                                                                                    ) => (
                                                                                                        <SelectItem
                                                                                                            key={
                                                                                                                department.value
                                                                                                            }
                                                                                                            value={String(
                                                                                                                department.value,
                                                                                                            )}
                                                                                                        >
                                                                                                            {
                                                                                                                department.label
                                                                                                            }
                                                                                                        </SelectItem>
                                                                                                    ),
                                                                                                )}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                )}
                                                                        </>
                                                                    )}

                                                                    {step.type ===
                                                                        'assignment' && (
                                                                        <>
                                                                            <div className="space-y-2">
                                                                                <Label>
                                                                                    Assign
                                                                                    To
                                                                                </Label>
                                                                                <Select
                                                                                    value={
                                                                                        step.user_id
                                                                                            ? 'specific_user'
                                                                                            : 'approver'
                                                                                    }
                                                                                    onValueChange={(
                                                                                        value,
                                                                                    ) => {
                                                                                        if (
                                                                                            value ===
                                                                                            'specific_user'
                                                                                        ) {
                                                                                            updateWorkflowStepFields(
                                                                                                index,
                                                                                                {
                                                                                                    assign_to:
                                                                                                        'specific_user',
                                                                                                    user_id:
                                                                                                        step.user_id ??
                                                                                                        '',
                                                                                                },
                                                                                            );
                                                                                            return;
                                                                                        }

                                                                                        updateWorkflowStepFields(
                                                                                            index,
                                                                                            {
                                                                                                assign_to:
                                                                                                    'approver',
                                                                                                user_id:
                                                                                                    null,
                                                                                            },
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="approver">
                                                                                            Last
                                                                                            Approver
                                                                                        </SelectItem>
                                                                                        <SelectItem value="specific_user">
                                                                                            Specific
                                                                                            User
                                                                                        </SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Choose
                                                                                    who
                                                                                    receives
                                                                                    ownership
                                                                                    of
                                                                                    the
                                                                                    ticket
                                                                                    after
                                                                                    this
                                                                                    step.
                                                                                </p>
                                                                            </div>

                                                                            {step.user_id !==
                                                                                null &&
                                                                                step.assign_to ===
                                                                                    'specific_user' && (
                                                                                    <div className="space-y-2">
                                                                                        <Label>
                                                                                            User
                                                                                        </Label>
                                                                                        <Select
                                                                                            value={
                                                                                                step.user_id
                                                                                                    ? String(
                                                                                                          step.user_id,
                                                                                                      )
                                                                                                    : ''
                                                                                            }
                                                                                            onValueChange={(
                                                                                                value,
                                                                                            ) =>
                                                                                                updateWorkflowStep(
                                                                                                    index,
                                                                                                    'user_id',
                                                                                                    Number(
                                                                                                        value,
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Select user" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {formOptions.users.map(
                                                                                                    (
                                                                                                        user,
                                                                                                    ) => (
                                                                                                        <SelectItem
                                                                                                            key={
                                                                                                                user.value
                                                                                                            }
                                                                                                            value={String(
                                                                                                                user.value,
                                                                                                            )}
                                                                                                        >
                                                                                                            {
                                                                                                                user.label
                                                                                                            }
                                                                                                        </SelectItem>
                                                                                                    ),
                                                                                                )}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                )}
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {step.type ===
                                                                    'conditional_approval' && (
                                                                    <>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Condition
                                                                                Rule
                                                                                *
                                                                            </Label>
                                                                            <div className="flex flex-col gap-2 md:flex-row">
                                                                                <Select
                                                                                    value={
                                                                                        step.condition_field ||
                                                                                        'estimated_cost'
                                                                                    }
                                                                                    onValueChange={(
                                                                                        value,
                                                                                    ) =>
                                                                                        updateConditionRule(
                                                                                            index,
                                                                                            step,
                                                                                            {
                                                                                                field: value,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger className="md:w-[150px]">
                                                                                        <SelectValue placeholder="Field" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="estimated_cost">
                                                                                            Estimated
                                                                                            Cost
                                                                                        </SelectItem>
                                                                                        <SelectItem value="priority">
                                                                                            Priority
                                                                                        </SelectItem>
                                                                                        <SelectItem value="status">
                                                                                            Status
                                                                                        </SelectItem>
                                                                                        <SelectItem value="category.name">
                                                                                            Category
                                                                                            Name
                                                                                        </SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <Select
                                                                                    value={
                                                                                        step.condition_operator ||
                                                                                        '>='
                                                                                    }
                                                                                    onValueChange={(
                                                                                        value,
                                                                                    ) =>
                                                                                        updateConditionRule(
                                                                                            index,
                                                                                            step,
                                                                                            {
                                                                                                operator:
                                                                                                    value,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger className="md:w-[150px]">
                                                                                        <SelectValue placeholder="Operator" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="==">
                                                                                            Equals
                                                                                        </SelectItem>
                                                                                        <SelectItem value="!=">
                                                                                            Not
                                                                                            Equals
                                                                                        </SelectItem>
                                                                                        <SelectItem value=">=">
                                                                                            Greater
                                                                                            or
                                                                                            Equal
                                                                                        </SelectItem>
                                                                                        <SelectItem value=">">
                                                                                            Greater
                                                                                            Than
                                                                                        </SelectItem>
                                                                                        <SelectItem value="<=">
                                                                                            Less
                                                                                            or
                                                                                            Equal
                                                                                        </SelectItem>
                                                                                        <SelectItem value="<">
                                                                                            Less
                                                                                            Than
                                                                                        </SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <Input
                                                                                    value={
                                                                                        step.condition_value ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateConditionRule(
                                                                                            index,
                                                                                            step,
                                                                                            {
                                                                                                value: e
                                                                                                    .target
                                                                                                    .value,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    placeholder="e.g. critical, 5000, Hardware"
                                                                                    className="flex-1"
                                                                                />
                                                                            </div>
                                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                                Approval
                                                                                is
                                                                                requested
                                                                                only
                                                                                when
                                                                                this
                                                                                condition
                                                                                is
                                                                                true.
                                                                                If
                                                                                false,
                                                                                the
                                                                                selected
                                                                                action
                                                                                below
                                                                                runs.
                                                                            </p>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                If
                                                                                False
                                                                                Action
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    step.if_false ||
                                                                                    'skip_step'
                                                                                }
                                                                                onValueChange={(
                                                                                    value,
                                                                                ) =>
                                                                                    updateWorkflowStep(
                                                                                        index,
                                                                                        'if_false',
                                                                                        value,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger>
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="skip_step">
                                                                                        Skip
                                                                                        Step
                                                                                    </SelectItem>
                                                                                    <SelectItem value="route_directly">
                                                                                        Route
                                                                                        Directly
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </CardContent>
                                                        )}
                                                    </Card>
                                                ),
                                            )}
                                        </div>
                                    )}

                                    {errors.workflow_steps && (
                                        <p className="text-xs text-red-500">
                                            {errors.workflow_steps}
                                        </p>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-between">
                                <Button asChild variant="outline">
                                    <Link
                                        href={route(
                                            'admin.workflow-templates.index',
                                        )}
                                    >
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? 'Saving...'
                                        : isEdit
                                          ? 'Update Template'
                                          : 'Create Template'}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Sidebar */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'is_active',
                                                checked as boolean,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="cursor-pointer"
                                    >
                                        Active
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Only active templates will be used for
                                    ticket workflows.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
