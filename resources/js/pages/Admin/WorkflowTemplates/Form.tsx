import React, { FormEvent, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
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
    approval_levels: Array<{ value: string; label: string }>;
    approver_types: Array<{ value: string; label: string }>;
    step_types: Array<{ value: string; label: string }>;
    operators: Array<{ value: string; label: string }>;
  };
}

export default function WorkflowTemplateForm({ template, formOptions }: WorkflowTemplateFormProps) {
  const isEdit = !!template;
  const { errors } = usePage<PageProps>().props;
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));

  const { data, setData, post, put, processing, transform } = useForm({
    name: template?.name ?? '',
    description: template?.description ?? '',
    category_id: template?.category_id ? String(template.category_id) : '__none',
    department_id: template?.department_id ? String(template.department_id) : '__none',
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
      category_id: data.category_id === '__none' ? null : (data.category_id ? Number(data.category_id) : null),
      department_id: data.department_id === '__none' ? null : (data.department_id ? Number(data.department_id) : null),
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
    const maxStepId = Math.max(...data.workflow_steps.map((s: any) => s.step_id || 0), 0);
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
    const newSteps = data.workflow_steps.filter((_: any, i: number) => i !== index);
    setData('workflow_steps', newSteps);
  };

  const updateWorkflowStep = (index: number, field: string, value: any) => {
    const newSteps = [...data.workflow_steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setData('workflow_steps', newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...data.workflow_steps];
    if (direction === 'up' && index > 0) {
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    }
    setData('workflow_steps', newSteps);
  };

  const toggleStepExpanded = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Workflow Template' : 'New Workflow Template'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Workflow Template' : 'New Workflow Template'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update workflow template and approval order.'
                : 'Create a custom approval workflow with customizable order.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.workflow-templates.index')}>← Back</Link>
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
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. IT Hardware Purchase Workflow"
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
                    placeholder="Describe when this workflow should be used..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* Category & Department */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category (Optional)</Label>
                    <Select
                      value={data.category_id}
                      onValueChange={(value) => setData('category_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">All Categories</SelectItem>
                        {formOptions.categories.map((cat) => (
                          <SelectItem key={cat.value} value={String(cat.value)}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Leave blank to apply to all categories
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department_id">Department (Optional)</Label>
                    <Select
                      value={data.department_id}
                      onValueChange={(value) => setData('department_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">All Departments</SelectItem>
                        {formOptions.departments.map((dept) => (
                          <SelectItem key={dept.value} value={String(dept.value)}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Leave blank to apply to all departments
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
                    onChange={(e) => setData('priority', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher priority templates are evaluated first (0-100)
                  </p>
                </div>

                {/* Workflow Steps */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Workflow Steps *</Label>
                      <p className="text-xs text-muted-foreground">
                        Define the approval order. Steps execute sequentially.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addWorkflowStep}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Step
                    </Button>
                  </div>

                  {data.workflow_steps.map((step: any, index: number) => (
                    <Card key={index} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Step {index + 1}</Badge>
                            <span className="text-sm font-medium">
                              {step.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStep(index, 'down')}
                              disabled={index === data.workflow_steps.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWorkflowStep(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Step Type *</Label>
                            <Select
                              value={step.type || 'approval'}
                              onValueChange={(value) => updateWorkflowStep(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {formOptions.step_types.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {(step.type === 'approval' || step.type === 'conditional_approval') && (
                            <>
                              <div className="space-y-2">
                                <Label>Approval Level *</Label>
                                <Select
                                  value={step.approval_level || 'lm'}
                                  onValueChange={(value) =>
                                    updateWorkflowStep(index, 'approval_level', value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {formOptions.approval_levels.map((level) => (
                                      <SelectItem key={level.value} value={level.value}>
                                        {level.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Approver Type *</Label>
                                <Select
                                  value={step.approver_type || 'line_manager'}
                                  onValueChange={(value) =>
                                    updateWorkflowStep(index, 'approver_type', value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {formOptions.approver_types.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}

                          {step.type === 'notification' && (
                            <div className="space-y-2">
                              <Label>Notify Type</Label>
                              <Select
                                value={step.notify_type || 'head_of_department'}
                                onValueChange={(value) =>
                                  updateWorkflowStep(index, 'notify_type', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {formOptions.approver_types.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Send informational notification (no approval required)
                              </p>
                            </div>
                          )}

                          {step.type === 'routing' && (
                            <div className="space-y-2">
                              <Label>Route To</Label>
                              <Input
                                value={step.route_to || ''}
                                onChange={(e) =>
                                  updateWorkflowStep(index, 'route_to', e.target.value)
                                }
                                placeholder="category_default_team"
                              />
                            </div>
                          )}

                          {step.type === 'assignment' && (
                            <div className="space-y-2">
                              <Label>Assign To</Label>
                              <Select
                                value={step.assign_to || 'approver'}
                                onValueChange={(value) =>
                                  updateWorkflowStep(index, 'assign_to', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approver">Approver (LM/DLM who approved)</SelectItem>
                                  <SelectItem value="line_manager">Line Manager</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Assign ticket to user after routing
                              </p>
                            </div>
                          )}
                        </div>

                        {step.type === 'conditional_approval' && (
                          <div className="space-y-2">
                            <Label>If False Action</Label>
                            <Select
                              value={step.if_false || 'skip_step'}
                              onValueChange={(value) => updateWorkflowStep(index, 'if_false', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="skip_step">Skip Step</SelectItem>
                                <SelectItem value="route_directly">Route Directly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {errors.workflow_steps && (
                    <p className="text-xs text-red-500">{errors.workflow_steps}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button asChild variant="outline">
                  <Link href={route('admin.workflow-templates.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  <Save className="mr-2 h-4 w-4" />
                  {processing ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
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
                    onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only active templates will be used for ticket workflows.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
