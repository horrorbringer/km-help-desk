import React, { FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import AppLayout from '@/layouts/app-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PageProps } from '@/types';

interface Condition {
  field: string;
  operator: string;
  value: string | number | null;
}

interface Action {
  type: string;
  value: string | number | number[] | null;
}

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
    departments: { value: number; label: string }[];
    users: { value: number; label: string }[];
    sla_policies: { value: number; label: string }[];
    tags: { value: number; label: string }[];
    statuses: string[];
    priorities: string[];
  };
}

const CONDITION_FIELDS = [
  { value: 'category_id', label: 'Category' },
  { value: 'project_id', label: 'Project' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'source', label: 'Source' },
  { value: 'assigned_team_id', label: 'Assigned Team' },
  { value: 'assigned_agent_id', label: 'Assigned Agent' },
  { value: 'requester_id', label: 'Requester' },
];

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

  const addCondition = () => {
    setData('conditions', [
      ...data.conditions,
      { field: 'category_id', operator: 'equals', value: '' },
    ]);
  };

  const removeCondition = (index: number) => {
    setData(
      'conditions',
      data.conditions.filter((_, i) => i !== index)
    );
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const updated = [...data.conditions];
    updated[index] = { ...updated[index], [field]: value };
    setData('conditions', updated);
  };

  const addAction = () => {
    setData('actions', [...data.actions, { type: 'assign_to_team', value: '' }]);
  };

  const removeAction = (index: number) => {
    setData('actions', data.actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof Action, value: any) => {
    const updated = [...data.actions];
    updated[index] = { ...updated[index], [field]: value };
    setData('actions', updated);
  };

  const getFieldOptions = (field: string) => {
    switch (field) {
      case 'category_id':
        return options.categories;
      case 'project_id':
        return options.categories; // Projects would be loaded separately
      case 'priority':
        return options.priorities.map((p) => ({ value: p, label: p }));
      case 'status':
        return options.statuses.map((s) => ({ value: s, label: s }));
      case 'assigned_team_id':
        return options.departments;
      case 'assigned_agent_id':
        return options.users;
      case 'requester_id':
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
      <Head title={isEdit ? 'Edit Automation Rule' : 'New Automation Rule'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Automation Rule' : 'New Automation Rule'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the automation rule.'
                : 'Create a new automation rule to automate ticket workflows.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.automation-rules.index')}>← Back</Link>
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
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Auto-assign High Priority Tickets"
                    required
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Describe what this rule does..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* Trigger Event */}
                <div className="space-y-2">
                  <Label htmlFor="trigger_event">Trigger Event *</Label>
                  <Select
                    value={data.trigger_event}
                    onValueChange={(value) => setData('trigger_event', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map((event) => (
                        <SelectItem key={event} value={event}>
                          {event.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.trigger_event && (
                    <p className="text-xs text-red-500">{errors.trigger_event}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-100) *</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={data.priority}
                    onChange={(e) => setData('priority', parseInt(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher priority rules execute first
                  </p>
                  {errors.priority && <p className="text-xs text-red-500">{errors.priority}</p>}
                </div>

                {/* Conditions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Conditions *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                      <IconPlus className="h-4 w-4 mr-1" />
                      Add Condition
                    </Button>
                  </div>
                  {data.conditions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add at least one condition for the rule to match
                    </p>
                  )}
                  {data.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(index, 'field', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(conditionOperators).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {['is_empty', 'is_not_empty'].includes(condition.operator) ? (
                          <div className="flex items-center text-sm text-muted-foreground">
                            (no value needed)
                          </div>
                        ) : (
                          <Select
                            value={String(condition.value ?? '')}
                            onValueChange={(value) => updateCondition(index, 'value', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Value" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFieldOptions(condition.field).map((opt) => (
                                <SelectItem key={opt.value} value={String(opt.value)}>
                                  {opt.label}
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
                        onClick={() => removeCondition(index)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {errors.conditions && (
                    <p className="text-xs text-red-500">{errors.conditions}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Actions *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAction}>
                      <IconPlus className="h-4 w-4 mr-1" />
                      Add Action
                    </Button>
                  </div>
                  {data.actions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add at least one action to execute when conditions match
                    </p>
                  )}
                  {data.actions.map((action, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Select
                          value={action.type}
                          onValueChange={(value) => updateAction(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(actionTypes).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(action.value ?? '')}
                          onValueChange={(value) => updateAction(index, 'value', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Value" />
                          </SelectTrigger>
                          <SelectContent>
                            {getActionOptions(action.type).map((opt) => (
                              <SelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {errors.actions && <p className="text-xs text-red-500">{errors.actions}</p>}
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                    Rule is active
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Inactive rules won't be executed
                </p>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.automation-rules.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : isEdit ? 'Update Rule' : 'Create Rule'}
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
                  <p className="font-medium mb-1">Conditions</p>
                  <p className="text-muted-foreground">
                    All conditions must match for the rule to execute. Use AND logic between
                    conditions.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Actions</p>
                  <p className="text-muted-foreground">
                    All actions will be executed when conditions match. Actions run in the order
                    listed.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Priority</p>
                  <p className="text-muted-foreground">
                    Rules with higher priority execute first. Use this to control rule execution
                    order.
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

