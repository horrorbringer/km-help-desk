import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Upload, X } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

export default function TicketForm(props: TicketFormProps) {
  const page = usePage();
  const pageProps = page.props as { 
    auth?: { user?: { id: number; department_id?: number | null } | null };
    errors?: Record<string, string>;
    ticket?: any;
    formOptions?: any;
  };
  
  // Get ticket and formOptions from props or page props, handling nested data structure
  let ticket = props.ticket || pageProps.ticket;
  const formOptions = props.formOptions || pageProps.formOptions;
  
  // Handle TicketResource wrapping - Inertia may wrap it in a data property
  if (ticket && typeof ticket === 'object' && 'data' in ticket) {
    ticket = (ticket as any).data;
  }
  
  const isEdit = Boolean(ticket?.id);
  const auth = pageProps.auth;
  const subjectInputRef = useRef<HTMLInputElement>(null);
  useToast(); // Handle flash messages
  
  // Auto-select current user as requester if creating new ticket
  const defaultRequesterId = useMemo(() => {
    if (isEdit) return ticket?.requester?.id ?? '';
    if (auth?.user?.id) {
      const currentUserInList = formOptions.requesters.find((r) => r.id === auth.user!.id);
      return currentUserInList ? currentUserInList.id : '';
    }
    return '';
  }, [isEdit, ticket?.requester?.id, auth?.user?.id, formOptions.requesters]);

  // Auto-fill team from user's department if creating new ticket
  const defaultTeamId = useMemo(() => {
    if (isEdit) return ticket?.assigned_team?.id ?? '';
    if (auth?.user?.department_id) {
      const userDepartment = formOptions.departments.find((d) => d.id === auth.user!.department_id);
      return userDepartment ? userDepartment.id : '';
    }
    return '';
  }, [isEdit, ticket?.assigned_team?.id, auth?.user?.department_id, formOptions.departments]);

  // Prepare custom fields data
  const initialCustomFields = useMemo(() => {
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
  }, [ticket?.custom_field_values]);

  const { data, setData, post, put, processing, errors: formErrors, transform } = useForm({
    ticket_number: ticket?.ticket_number ?? '',
    subject: ticket?.subject ?? '',
    description: ticket?.description ?? '',
    requester_id: isEdit && ticket?.requester?.id ? ticket.requester.id : (defaultRequesterId || ''),
    assigned_team_id: isEdit && ticket?.assigned_team?.id ? ticket.assigned_team.id : (defaultTeamId || ''),
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
    custom_fields: initialCustomFields,
  });

  // Transform data before submission: convert empty strings to null for optional fields
  transform((data) => {
    const transformed: any = { ...data };
    
    // Handle ticket_number - convert empty string to null (will be auto-generated)
    if (transformed.ticket_number === '' || transformed.ticket_number === null) {
      transformed.ticket_number = null;
    }
    
    // Handle optional fields - convert empty strings to null
    if (transformed.assigned_agent_id === '' || transformed.assigned_agent_id === null) {
      transformed.assigned_agent_id = null;
    } else {
      transformed.assigned_agent_id = Number(transformed.assigned_agent_id) || null;
    }
    
    if (transformed.project_id === '' || transformed.project_id === null) {
      transformed.project_id = null;
    } else {
      transformed.project_id = Number(transformed.project_id) || null;
    }
    
    if (transformed.sla_policy_id === '' || transformed.sla_policy_id === null) {
      transformed.sla_policy_id = null;
    } else {
      transformed.sla_policy_id = Number(transformed.sla_policy_id) || null;
    }
    
    // Handle date fields
    transformed.first_response_at = transformed.first_response_at || null;
    transformed.first_response_due_at = transformed.first_response_due_at || null;
    transformed.resolution_due_at = transformed.resolution_due_at || null;
    transformed.resolved_at = transformed.resolved_at || null;
    transformed.closed_at = transformed.closed_at || null;
    
    // Handle required fields - ensure they are numbers
    transformed.requester_id = transformed.requester_id === '' || transformed.requester_id === null 
      ? null 
      : Number(transformed.requester_id);
    transformed.assigned_team_id = transformed.assigned_team_id === '' || transformed.assigned_team_id === null 
      ? null 
      : Number(transformed.assigned_team_id);
    transformed.category_id = transformed.category_id === '' || transformed.category_id === null 
      ? null 
      : Number(transformed.category_id);
    
    return transformed;
  });

  // Combine form errors with page props errors
  const errors = { ...formErrors, ...(pageProps.errors || {}) };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isEdit && ticket) {
      put(route('admin.tickets.update', ticket.id), {
        onError: (errors) => {
          console.error('Update errors:', errors);
        },
        onSuccess: () => {
          // Upload files after ticket update if any are selected
          if (selectedFiles.length > 0) {
            handleFileUpload();
          }
        },
      });
    } else {
      post(route('admin.tickets.store'), {
        onError: (errors) => {
          console.error('Create errors:', errors);
          // Errors will be automatically displayed in the form
        },
        onSuccess: (page) => {
          // Success message will be shown via toast from flash message
          // Upload files after ticket creation if any are selected
          if (selectedFiles.length > 0) {
            // After redirect, Inertia will load the show page
            // We need to wait for the page to load and get ticket ID from URL or page props
            const getTicketId = () => {
              // Try to get from page props first (after redirect)
              const ticket = (page.props as any).ticket;
              if (ticket) {
                const ticketId = ticket.id || ticket.data?.id;
                if (ticketId) return Number(ticketId);
              }
              
              // Fallback: extract from URL
              const match = window.location.pathname.match(/\/tickets\/(\d+)/);
              if (match && match[1]) {
                return Number(match[1]);
              }
              
              return null;
            };
            
            // Try immediately
            let ticketId = getTicketId();
            
            // If not found, wait a bit for Inertia to finish the redirect
            if (!ticketId) {
              setTimeout(() => {
                ticketId = getTicketId();
                if (ticketId) {
                  uploadFilesAfterCreate(ticketId);
                } else {
                  console.error('Could not get ticket ID for file upload');
                }
              }, 1000);
            } else {
              uploadFilesAfterCreate(ticketId);
            }
          }
        },
      });
    }
  };

  const uploadFilesAfterCreate = async (ticketId: number) => {
    if (selectedFiles.length === 0) return;

    setUploadingFiles(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files[]', file);
    });

    try {
      // Get CSRF token from meta tag, or try to get it from the page
      let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // If token not found, wait a bit for the page to fully load after redirect
      if (!csrfToken) {
        await new Promise(resolve => setTimeout(resolve, 500));
        csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      }
      
      if (!csrfToken) {
        throw new Error('CSRF token not found');
      }

      const response = await fetch(route('admin.ticket-attachments.store', ticketId), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        credentials: 'same-origin', // Include cookies for CSRF
        body: formData,
      });

      if (response.ok) {
        setSelectedFiles([]);
        // Reload the page to show the new attachments
        router.reload({ only: ['ticket'], preserveScroll: true });
      } else {
        const data = await response.json();
        console.error('Upload error:', data);
        alert('Failed to upload files: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles(false);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    // For create mode, we'll upload files after ticket is created
    // For edit mode, upload immediately
    if (!isEdit || !ticket?.id) {
      // In create mode, files will be uploaded after ticket creation
      return;
    }

    setUploadingFiles(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files[]', file);
    });

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const response = await fetch(route('admin.ticket-attachments.store', ticket.id), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      if (response.ok) {
        setSelectedFiles([]);
        router.reload({ only: ['ticket'] });
      } else {
        const data = await response.json();
        console.error('Upload error:', data);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingFiles(false);
    }
  };

  const priority = useMemo(() => data.priority, [data.priority]);

  // Template selector
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  
  // Collapsible states for advanced sections
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSLA, setShowSLA] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showWatchers, setShowWatchers] = useState(false);
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Auto-focus subject field on mount for new tickets
  useEffect(() => {
    if (!isEdit && subjectInputRef.current) {
      subjectInputRef.current.focus();
    }
  }, [isEdit]);

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{isEdit ? 'Edit Ticket' : 'Create Ticket'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? `Update ticket ${ticket?.ticket_number} details and information.`
              : 'Capture the details of a new issue or request.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={route('admin.tickets.index')}>← Back to Tickets</Link>
          </Button>
          {isEdit && ticket && (
            <Button asChild variant="default">
              <Link href={route('admin.tickets.show', { ticket: ticket.id })}>View Ticket</Link>
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

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3" noValidate>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Ticket Information</CardTitle>
            <CardDescription>Subject, requester, routing, and SLA data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                ref={subjectInputRef}
                id="subject"
                value={data.subject}
                onChange={(e) => setData('subject', e.target.value)}
                placeholder="Short summary of the issue"
                className="text-base"
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Category *</Label>
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

              <div>
                <Label>Requester *</Label>
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
            </div>

            <div>
              <Label>Team *</Label>
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
              {defaultTeamId && !isEdit && (
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-filled from your department
                </p>
              )}
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
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={6}
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                placeholder="Describe what is happening... (be as detailed as possible)"
                className="text-base"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Advanced Options Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Advanced Options</CardTitle>
                      <CardDescription>SLA, Tags, Watchers, and more</CardDescription>
                    </div>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Assignment Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Additional Assignment</Label>
                    <div className="grid gap-4 md:grid-cols-2">
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
                  </div>

                  {/* SLA Section */}
                  <Collapsible open={showSLA} onOpenChange={setShowSLA}>
                    <div>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer mb-2">
                          <Label className="text-base font-semibold cursor-pointer">SLA & Timelines</Label>
                          {showSLA ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-2">
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
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  {/* Custom Fields */}
                  {formOptions.customFields && formOptions.customFields.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Custom Fields</Label>
                      <CardDescription className="mb-3">Additional information specific to your organization.</CardDescription>
                      <CustomFieldsForm
                        fields={formOptions.customFields}
                        values={data.custom_fields}
                        onChange={handleCustomFieldChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* Tags Section */}
                  <Collapsible open={showTags} onOpenChange={setShowTags}>
                    <div>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer mb-2">
                          <div>
                            <Label className="text-base font-semibold cursor-pointer">Tags</Label>
                            <CardDescription className="text-xs">Helps classify tickets and trigger automations.</CardDescription>
                          </div>
                          {showTags ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="flex flex-wrap gap-2">
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
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  {/* Watchers Section */}
                  <Collapsible open={showWatchers} onOpenChange={setShowWatchers}>
                    <div>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer mb-2">
                          <div>
                            <Label className="text-base font-semibold cursor-pointer">Watchers</Label>
                            <CardDescription className="text-xs">Users who should receive updates.</CardDescription>
                          </div>
                          {showWatchers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="space-y-2">
                          {formOptions.requesters.map((user) => (
                            <label key={user.id} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={data.watcher_ids.includes(user.id)} onCheckedChange={() => toggleArrayValue('watcher_ids', user.id)} />
                              {user.name}
                            </label>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  {/* Attachments Section */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Attachments</Label>
                    <CardDescription className="text-xs mb-3">
                      {isEdit 
                        ? 'Upload files related to this ticket (PDF, images, documents, etc.)'
                        : 'Select files to attach after ticket is created (PDF, images, documents, etc.)'}
                    </CardDescription>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z"
                            className="flex-1"
                            disabled={uploadingFiles}
                          />
                          {selectedFiles.length > 0 && isEdit && ticket?.id && (
                            <Button
                              type="button"
                              onClick={handleFileUpload}
                              disabled={uploadingFiles}
                              size="sm"
                            >
                              {uploadingFiles ? 'Uploading...' : <><Upload className="h-4 w-4 mr-2" />Upload</>}
                            </Button>
                          )}
                          {selectedFiles.length > 0 && !isEdit && (
                            <span className="text-xs text-muted-foreground">
                              Files will be uploaded after ticket creation
                            </span>
                          )}
                        </div>

                        {selectedFiles.length > 0 && (
                          <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFileRemove(index)}
                                  disabled={uploadingFiles}
                                  className="ml-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Maximum file size: 10MB per file. Supported formats: PDF, Office documents, images, archives.
                        </p>
                      </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Submit Button Card */}
          <Card>
            <CardFooter className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </Button>
              <Button 
                type="submit" 
                disabled={processing} 
                size="lg" 
                className="min-w-[140px]"
              >
                {processing ? (
                  <>
                    <span className="mr-2">⏳</span>
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    {isEdit ? 'Update Ticket' : 'Create Ticket'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </AppLayout>
  );
}
