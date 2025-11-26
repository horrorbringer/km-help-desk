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
  value: string | number | null;
}

interface EscalationRuleFormProps {
  rule?: {
    id: number;
    name: string;
    description?: string;
    conditions: Condition[];
    time_trigger_type?: string;
    time_trigger_minutes?: number;
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
    departments: { value: number; label: string }[];
    users: { value: number; label: string }[];
  };
}

const CONDITION_FIELDS = [
  { value: 'category_id', label: 'Category' },
  { value: 'project_id', label: 'Project' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'assigned_team_id', label: 'Assigned Team' },
  { value: 'assigned_agent_id', label: 'Assigned Agent' },
];

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
    time_trigger_type: rule?.time_trigger_type ?? '',
    time_trigger_minutes: rule?.time_trigger_minutes ?? 0,
    actions: (rule?.actions ?? []) as Action[],
    priority: rule?.priority ?? 0,
    is_active: rule?.is_active ?? true,
  });

  const addCondition = () => {
    setData('conditions', [
      ...data.conditions,
      { field: 'priority', operator: 'equals', value: '' },
    ]);
  };

  const removeCondition = (index: number) => {
    setData('conditions', data.conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const updated = [...data.conditions];
    updated[index] = { ...updated[index], [field]: value };
    setData('conditions', updated);
  };

  const addAction = () => {
    setData('actions', [...data.actions, { type: 'change_priority', value: '' }]);
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
      case 'priority':
        return options.priorities.map((p) => ({ value: p, label: p }));
      case 'status':
        return options.statuses.map((s) => ({ value: s, label: s }));
      case 'assigned_team_id':
        return options.departments;
      case 'assigned_agent_id':
        return options.users;
      default:
        return [];
    }
  };

  const getActionOptions = (actionType: string) => {
    switch (actionType) {
      case 'change_priority':
        return options.priorities.map((p) => ({ value: p, label: p }));
      case 'change_status':
        return options.statuses.map((s) => ({ value: s, label: s }));
      case 'reassign_to_team':
        return options.departments;
      case 'reassign_to_agent':
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
      <Head title={isEdit ? 'Edit Escalation Rule' : 'New Escalation Rule'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Escalation Rule' : 'New Escalation Rule'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the escalation rule.'
                : 'Create a rule to automatically escalate tickets based on time and conditions.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.escalation-rules.index')}>← Back</Link>
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
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Escalate High Priority After 2 Hours"
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
                    placeholder="Describe when this rule should trigger..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* Time Trigger */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold">Time Trigger</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="time_trigger_type">Trigger Type</Label>
                      <Select
                        value={data.time_trigger_type || '__none'}
                        onValueChange={(value) =>
                          setData('time_trigger_type', value === '__none' ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">No time trigger</SelectItem>
                          {Object.entries(timeTriggerTypes).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {data.time_trigger_type && (
                      <div className="space-y-2">
                        <Label htmlFor="time_trigger_minutes">Time (minutes) *</Label>
                        <Input
                          id="time_trigger_minutes"
                          type="number"
                          min="1"
                          value={data.time_trigger_minutes}
                          onChange={(e) =>
                            setData('time_trigger_minutes', parseInt(e.target.value) || 0)
                          }
                          placeholder="e.g. 120 for 2 hours"
                          required={!!data.time_trigger_type}
                        />
                        {data.time_trigger_minutes > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(data.time_trigger_minutes / 60)}h{' '}
                            {data.time_trigger_minutes % 60}m
                          </p>
                        )}
                        {errors.time_trigger_minutes && (
                          <p className="text-xs text-red-500">{errors.time_trigger_minutes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Conditions (Optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                      <IconPlus className="h-4 w-4 mr-1" />
                      Add Condition
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add conditions to limit which tickets this rule applies to
                  </p>
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
                </div>

                {/* Actions */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Actions *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAction}>
                      <IconPlus className="h-4 w-4 mr-1" />
                      Add Action
                    </Button>
                  </div>
                  {data.actions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add at least one action to execute when rule triggers
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
                        {!['notify_manager'].includes(action.type) && (
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
                        )}
                        {action.type === 'notify_manager' && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            (no value needed)
                          </div>
                        )}
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

                {/* Priority */}
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="priority">Rule Priority (0-100) *</Label>
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
                  <Link href={route('admin.escalation-rules.index')}>Cancel</Link>
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
                  <p className="font-medium mb-1">Time Triggers</p>
                  <p className="text-muted-foreground">
                    Escalate tickets after a certain time has passed. Choose from creation time,
                    last update, or SLA due dates.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Conditions</p>
                  <p className="text-muted-foreground">
                    Optional conditions to limit which tickets are escalated. All conditions must
                    match.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Actions</p>
                  <p className="text-muted-foreground">
                    Actions to execute when escalation triggers. Can change priority, reassign, or
                    send notifications.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Scheduled Execution</p>
                  <p className="text-muted-foreground">
                    Rules are checked periodically (e.g., every 15 minutes) via a scheduled task.
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

