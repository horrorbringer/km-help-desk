import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CustomFieldsForm } from '@/components/custom-fields-form';
import { cn } from '@/lib/utils';

type BaseOption = { id: number; name: string };

type TicketFormProps = {
  ticket?: {
    id: number;
    ticket_number: string;
    subject: string;
    description: string;
    requester?: BaseOption;
    assigned_team?: BaseOption;
    assigned_agent?: BaseOption;
    category?: BaseOption;
    project?: BaseOption;
    sla_policy?: BaseOption;
    status: string;
    priority: string;
    source: string;
    first_response_at?: string | null;
    first_response_due_at?: string | null;
    resolution_due_at?: string | null;
    resolved_at?: string | null;
    closed_at?: string | null;
    response_sla_breached?: boolean;
    resolution_sla_breached?: boolean;
    tags?: { id: number; name: string; color: string }[];
    watchers?: BaseOption[];
    custom_field_values?: {
      id: number;
      custom_field_id: number;
      value: any;
      custom_field: {
        id: number;
        name: string;
        label: string;
        field_type: string;
        options?: { label: string; value: string }[];
        default_value?: string;
        is_required: boolean;
        placeholder?: string;
        help_text?: string;
      };
    }[];
  } | null;
  formOptions: {
    statuses: string[];
    priorities: string[];
    sources: string[];
    departments: BaseOption[];
    agents: BaseOption[];
    categories: BaseOption[];
    projects: BaseOption[];
    requesters: BaseOption[];
    customFields?: {
      id: number;
      name: string;
      label: string;
      field_type: string;
      options?: { label: string; value: string }[];
      default_value?: string;
      is_required: boolean;
      placeholder?: string;
      help_text?: string;
    }[];
    sla_policies: BaseOption[];
    tags: { id: number; name: string; color: string }[];
  };
};

const priorityColorMap: Record<string, string> = {
  low: 'bg-slate-200 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const defaultDate = (value?: string | null) => (value ? value.substring(0, 16) : '');

export default function TicketForm({ ticket, formOptions }: TicketFormProps) {
  const isEdit = Boolean(ticket?.id);

  const { data, setData, post, put, processing, errors } = useForm({
    ticket_number: ticket?.ticket_number ?? '',
    subject: ticket?.subject ?? '',
    description: ticket?.description ?? '',
    requester_id: ticket?.requester?.id ?? '',
    assigned_team_id: ticket?.assigned_team?.id ?? '',
    assigned_agent_id: ticket?.assigned_agent?.id ?? '',
    category_id: ticket?.category?.id ?? '',
    project_id: ticket?.project?.id ?? '',
    sla_policy_id: ticket?.sla_policy?.id ?? '',
    status: ticket?.status ?? formOptions.statuses[0] ?? 'open',
    priority: ticket?.priority ?? formOptions.priorities[1] ?? 'medium',
    source: ticket?.source ?? formOptions.sources[0] ?? 'web',
    first_response_at: defaultDate(ticket?.first_response_at),
    first_response_due_at: defaultDate(ticket?.first_response_due_at),
    resolution_due_at: defaultDate(ticket?.resolution_due_at),
    resolved_at: defaultDate(ticket?.resolved_at),
    closed_at: defaultDate(ticket?.closed_at),
    response_sla_breached: ticket?.response_sla_breached ?? false,
    resolution_sla_breached: ticket?.resolution_sla_breached ?? false,
    tag_ids: ticket?.tags?.map((tag) => tag.id) ?? [],
    watcher_ids: ticket?.watchers?.map((user) => user.id) ?? [],
    custom_fields: useMemo(() => {
      const customFields: Record<number, any> = {};
      if (ticket?.custom_field_values) {
        ticket.custom_field_values.forEach((cfv) => {
          let value = cfv.value;
          // Parse multiselect values
          if (cfv.custom_field.field_type === 'multiselect') {
            try {
              value = JSON.parse(value);
            } catch {
              value = [];
            }
          }
          // Parse boolean values
          if (cfv.custom_field.field_type === 'boolean') {
            value = value === '1' || value === true;
          }
          customFields[cfv.custom_field_id] = value;
        });
      }
      return customFields;
    }, [ticket?.custom_field_values]),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (isEdit && ticket) {
      put(route('admin.tickets.update', ticket.id));
    } else {
      post(route('admin.tickets.store'));
    }
  };

  const toggleArrayValue = (field: 'tag_ids' | 'watcher_ids', value: number) => {
    setData(
      field,
      data[field].includes(value) ? data[field].filter((id: number) => id !== value) : [...data[field], value]
    );
  };

  const handleCustomFieldChange = (fieldId: number, value: any) => {
    setData('custom_fields', {
      ...data.custom_fields,
      [fieldId]: value,
    });
  };

  const priority = useMemo(() => data.priority, [data.priority]);

  // Template selector
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      // Fetch active templates
      fetch(route('admin.ticket-templates.active'))
        .then((res) => res.json())
        .then((data) => setTemplates(data.templates || []))
        .catch(() => {});
    }
  }, [isEdit]);

  const applyTemplate = async (templateId: number) => {
    if (isEdit) return;
    
    setLoadingTemplate(true);
    try {
      const response = await fetch(route('admin.ticket-templates.data', templateId));
      const result = await response.json();
      const templateData = result.data || {};

      // Apply template data to form
      if (templateData.subject) setData('subject', templateData.subject);
      if (templateData.description) setData('description', templateData.description);
      if (templateData.category_id) setData('category_id', templateData.category_id);
      if (templateData.project_id) setData('project_id', templateData.project_id);
      if (templateData.assigned_team_id) setData('assigned_team_id', templateData.assigned_team_id);
      if (templateData.assigned_agent_id) setData('assigned_agent_id', templateData.assigned_agent_id);
      if (templateData.priority) setData('priority', templateData.priority);
      if (templateData.status) setData('status', templateData.status);
      if (templateData.source) setData('source', templateData.source);
      if (templateData.sla_policy_id) setData('sla_policy_id', templateData.sla_policy_id);
      if (templateData.tag_ids) setData('tag_ids', templateData.tag_ids);
      if (templateData.custom_fields) setData('custom_fields', templateData.custom_fields);
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? `Edit Ticket ${ticket?.ticket_number}` : 'New Ticket'} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Ticket' : 'Create Ticket'}</h1>
          <p className="text-sm text-muted-foreground">
            Capture the details of a new issue or update an existing ticket.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={route('admin.tickets.index')}>Back to Tickets</Link>
          </Button>
          {isEdit && ticket && (
            <Button asChild variant="default">
              <Link href={route('admin.tickets.show', ticket.id)}>View Ticket</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Template Selector */}
      {!isEdit && templates.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Quick Templates</Label>
                <p className="text-xs text-muted-foreground">
                  Select a template to pre-fill ticket data
                </p>
              </div>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) applyTemplate(parseInt(value));
                }}
                disabled={loadingTemplate}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
            <CardDescription>Subject, requester, routing, and SLA data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="ticket_number">Ticket Number</Label>
                <Input
                  id="ticket_number"
                  value={data.ticket_number}
                  onChange={(e) => setData('ticket_number', e.target.value)}
                  placeholder="Auto-generated if left blank"
                />
                {errors.ticket_number && <p className="text-xs text-red-500 mt-1">{errors.ticket_number}</p>}
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={data.subject}
                  onChange={(e) => setData('subject', e.target.value)}
                  placeholder="Short summary"
                />
                {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Requester</Label>
                <Select value={data.requester_id?.toString()} onValueChange={(value) => setData('requester_id', Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select requester" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.requesters.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.requester_id && <p className="text-xs text-red-500 mt-1">{errors.requester_id}</p>}
              </div>

              <div>
                <Label>Category</Label>
                <Select value={data.category_id?.toString()} onValueChange={(value) => setData('category_id', Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Team</Label>
                <Select value={data.assigned_team_id?.toString()} onValueChange={(value) => setData('assigned_team_id', Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.departments.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assigned_team_id && <p className="text-xs text-red-500 mt-1">{errors.assigned_team_id}</p>}
              </div>

              <div>
                <Label>Agent (optional)</Label>
                <Select
                  value={data.assigned_agent_id ? data.assigned_agent_id.toString() : ''}
                  onValueChange={(value) =>
                    setData('assigned_agent_id', value === '__none' ? '' : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Unassigned</SelectItem>
                    {formOptions.agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assigned_agent_id && <p className="text-xs text-red-500 mt-1">{errors.assigned_agent_id}</p>}
              </div>

              <div>
                <Label>Project (optional)</Label>
                <Select
                  value={data.project_id ? data.project_id.toString() : ''}
                  onValueChange={(value) =>
                    setData('project_id', value === '__none' ? '' : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No project</SelectItem>
                    {formOptions.projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.project_id && <p className="text-xs text-red-500 mt-1">{errors.project_id}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Status</Label>
                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
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
                <Badge className={cn('mt-2', priorityColorMap[priority] ?? '')}>{priority}</Badge>
              </div>

              <div>
                <Label>Source</Label>
                <Select value={data.source} onValueChange={(value) => setData('source', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={6}
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                placeholder="Describe what is happening..."
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SLA & Timelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SLA Policy</Label>
                <Select
                  value={data.sla_policy_id ? data.sla_policy_id.toString() : ''}
                  onValueChange={(value) =>
                    setData('sla_policy_id', value === '__none' ? '' : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No SLA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No SLA</SelectItem>
                    {formOptions.sla_policies.map((sla) => (
                      <SelectItem key={sla.id} value={sla.id.toString()}>
                        {sla.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sla_policy_id && <p className="text-xs text-red-500 mt-1">{errors.sla_policy_id}</p>}
              </div>

              <div className="space-y-2">
                <Label>First Response</Label>
                <div className="grid gap-2">
                  <Input
                    type="datetime-local"
                    value={data.first_response_at}
                    onChange={(e) => setData('first_response_at', e.target.value)}
                    placeholder="First response time"
                  />
                  <Input
                    type="datetime-local"
                    value={data.first_response_due_at}
                    onChange={(e) => setData('first_response_due_at', e.target.value)}
                    placeholder="Response due"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resolution</Label>
                <div className="grid gap-2">
                  <Input
                    type="datetime-local"
                    value={data.resolution_due_at}
                    onChange={(e) => setData('resolution_due_at', e.target.value)}
                    placeholder="Resolution due"
                  />
                  <Input
                    type="datetime-local"
                    value={data.resolved_at}
                    onChange={(e) => setData('resolved_at', e.target.value)}
                    placeholder="Resolved at"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Closure</Label>
                <Input
                  type="datetime-local"
                  value={data.closed_at}
                  onChange={(e) => setData('closed_at', e.target.value)}
                  placeholder="Closed at"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="response_sla_breached"
                    checked={data.response_sla_breached}
                    onCheckedChange={(checked) => setData('response_sla_breached', Boolean(checked))}
                  />
                  <Label htmlFor="response_sla_breached">Response SLA breached</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="resolution_sla_breached"
                    checked={data.resolution_sla_breached}
                    onCheckedChange={(checked) => setData('resolution_sla_breached', Boolean(checked))}
                  />
                  <Label htmlFor="resolution_sla_breached">Resolution SLA breached</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {formOptions.customFields && formOptions.customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>Additional information specific to your organization.</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomFieldsForm
                  fields={formOptions.customFields}
                  values={data.custom_fields}
                  onChange={handleCustomFieldChange}
                  errors={errors}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Helps classify tickets and trigger automations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {formOptions.tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleArrayValue('tag_ids', tag.id)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium transition',
                    data.tag_ids.includes(tag.id) ? 'ring-2 ring-offset-2' : 'opacity-70'
                  )}
                  style={{ backgroundColor: tag.color, color: '#fff' }}
                >
                  {tag.name}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Watchers</CardTitle>
              <CardDescription>Users who should receive updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {formOptions.requesters.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={data.watcher_ids.includes(user.id)} onCheckedChange={() => toggleArrayValue('watcher_ids', user.id)} />
                  {user.name}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Ticket' : 'Create Ticket'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </AppLayout>
  );
}


