import React, { FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

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

type BaseOption = { id: number; name: string };

interface TicketTemplateFormProps {
  template?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    template_data: Record<string, any>;
    is_active: boolean;
    is_public: boolean;
  };
  formOptions: {
    statuses: string[];
    priorities: string[];
    sources: string[];
    departments: BaseOption[];
    agents: BaseOption[];
    categories: BaseOption[];
    projects: BaseOption[];
    sla_policies: BaseOption[];
    tags: BaseOption[];
  };
}

export default function TicketTemplateForm({ template, formOptions }: TicketTemplateFormProps) {
  const isEdit = !!template;
  const { errors } = usePage<PageProps>().props;

  const templateData = template?.template_data ?? {};

  const { data, setData, post, put, processing } = useForm({
    name: template?.name ?? '',
    slug: template?.slug ?? '',
    description: template?.description ?? '',
    template_data: {
      subject: templateData.subject ?? '',
      description: templateData.description ?? '',
      category_id: templateData.category_id ?? '',
      project_id: templateData.project_id ?? '',
      assigned_team_id: templateData.assigned_team_id ?? '',
      assigned_agent_id: templateData.assigned_agent_id ?? '',
      priority: templateData.priority ?? formOptions.priorities[1] ?? 'medium',
      status: templateData.status ?? formOptions.statuses[0] ?? 'open',
      source: templateData.source ?? formOptions.sources[0] ?? 'web',
      sla_policy_id: templateData.sla_policy_id ?? '',
      tag_ids: templateData.tag_ids ?? [],
    },
    is_active: template?.is_active ?? true,
    is_public: template?.is_public ?? true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && template) {
      put(route('admin.ticket-templates.update', template.id));
    } else {
      post(route('admin.ticket-templates.store'));
    }
  };

  const updateTemplateData = (field: string, value: any) => {
    setData('template_data', {
      ...data.template_data,
      [field]: value,
    });
  };

  const toggleTag = (tagId: number) => {
    const tagIds = data.template_data.tag_ids || [];
    const newTagIds = tagIds.includes(tagId)
      ? tagIds.filter((id: number) => id !== tagId)
      : [...tagIds, tagId];
    updateTemplateData('tag_ids', newTagIds);
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Ticket Template' : 'New Ticket Template'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Ticket Template' : 'New Ticket Template'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the ticket template.'
                : 'Create a reusable template to quickly create tickets with pre-filled data.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.ticket-templates.index')}>← Back</Link>
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
                    ? 'Update the template details below.'
                    : 'Fill in the information to create a new ticket template.'}
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
                    placeholder="e.g. Equipment Repair Request"
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
                    placeholder="Describe when to use this template..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Pre-filled Ticket Data</h3>

                  {/* Subject */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={data.template_data.subject}
                      onChange={(e) => updateTemplateData('subject', e.target.value)}
                      placeholder="Default ticket subject"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="ticket_description">Description</Label>
                    <Textarea
                      id="ticket_description"
                      value={data.template_data.description}
                      onChange={(e) => updateTemplateData('description', e.target.value)}
                      placeholder="Default ticket description"
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Category */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={String(data.template_data.category_id || '__none')}
                        onValueChange={(value) =>
                          updateTemplateData('category_id', value === '__none' ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {formOptions.categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={data.template_data.priority}
                        onValueChange={(value) => updateTemplateData('priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formOptions.priorities.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Team */}
                    <div className="space-y-2">
                      <Label>Assigned Team</Label>
                      <Select
                        value={String(data.template_data.assigned_team_id || '__none')}
                        onValueChange={(value) =>
                          updateTemplateData('assigned_team_id', value === '__none' ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {formOptions.departments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Agent */}
                    <div className="space-y-2">
                      <Label>Assigned Agent</Label>
                      <Select
                        value={String(data.template_data.assigned_agent_id || '__none')}
                        onValueChange={(value) =>
                          updateTemplateData('assigned_agent_id', value === '__none' ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {formOptions.agents.map((agent) => (
                            <SelectItem key={agent.id} value={String(agent.id)}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Project */}
                    <div className="space-y-2">
                      <Label>Project</Label>
                      <Select
                        value={String(data.template_data.project_id || '__none')}
                        onValueChange={(value) =>
                          updateTemplateData('project_id', value === '__none' ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {formOptions.projects.map((project) => (
                            <SelectItem key={project.id} value={String(project.id)}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SLA Policy */}
                    <div className="space-y-2">
                      <Label>SLA Policy</Label>
                      <Select
                        value={String(data.template_data.sla_policy_id || '__none')}
                        onValueChange={(value) =>
                          updateTemplateData('sla_policy_id', value === '__none' ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select SLA policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {formOptions.sla_policies.map((sla) => (
                            <SelectItem key={sla.id} value={String(sla.id)}>
                              {sla.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {formOptions.tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                            data.template_data.tag_ids?.includes(tag.id)
                              ? 'ring-2 ring-offset-2'
                              : 'opacity-70'
                          }`}
                          style={{ backgroundColor: tag.color || '#gray', color: '#fff' }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center space-x-2 border-t pt-4">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                    Template is active
                  </Label>
                </div>

                {/* Public */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_public"
                    checked={data.is_public}
                    onCheckedChange={(checked) => setData('is_public', Boolean(checked))}
                  />
                  <Label htmlFor="is_public" className="text-sm font-normal cursor-pointer">
                    Template is public (all users can use)
                  </Label>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.ticket-templates.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
                </Button>
              </CardFooter>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>Template Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Quick Creation</p>
                  <p className="text-muted-foreground">
                    Templates allow users to quickly create tickets with pre-filled data, saving
                    time on repetitive tasks.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Public vs Private</p>
                  <p className="text-muted-foreground">
                    Public templates can be used by all users. Private templates are only visible to
                    the creator.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Usage Tracking</p>
                  <p className="text-muted-foreground">
                    Templates track how many times they've been used, helping you identify the most
                    popular templates.
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

