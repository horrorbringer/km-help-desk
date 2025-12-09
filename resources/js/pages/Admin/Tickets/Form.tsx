import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Upload, X, Check, Search, Loader2, User, FolderKanban } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    estimated_cost?: number | null;
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
    can_create_on_behalf?: boolean;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast: toastFromHook } = useToast(); // Handle flash messages
  
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
      ticket.custom_field_values.forEach((cfv: any) => {
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

  const { data, setData, post, put, processing, errors: formErrors, transform } = useForm<{
    ticket_number: string;
    subject: string;
    description: string;
    requester_id: string | number;
    assigned_team_id: string | number;
    assigned_agent_id: string | number | null;
    category_id: string | number;
    project_id: string | number | null;
    sla_policy_id: string | number | null;
    status: string;
    priority: string;
    estimated_cost: number | null;
    source: string;
    first_response_at: string;
    first_response_due_at: string;
    resolution_due_at: string;
    resolved_at: string;
    closed_at: string;
    response_sla_breached: boolean;
    resolution_sla_breached: boolean;
    tag_ids: number[];
    watcher_ids: number[];
    custom_fields: Record<number, any>;
  }>({
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
    estimated_cost: ticket?.estimated_cost ?? null,
    source: ticket?.source ?? formOptions.sources[0] ?? 'web',
    first_response_at: defaultDate(ticket?.first_response_at),
    first_response_due_at: defaultDate(ticket?.first_response_due_at),
    resolution_due_at: defaultDate(ticket?.resolution_due_at),
    resolved_at: defaultDate(ticket?.resolved_at),
    closed_at: defaultDate(ticket?.closed_at),
    response_sla_breached: ticket?.response_sla_breached ?? false,
    resolution_sla_breached: ticket?.resolution_sla_breached ?? false,
    tag_ids: (ticket?.tags?.map((tag: any) => tag.id) ?? []) as number[],
    watcher_ids: (ticket?.watchers?.map((user: any) => user.id) ?? []) as number[],
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
    
    // Handle estimated_cost - convert empty string to null, convert to number
    if (transformed.estimated_cost === '' || transformed.estimated_cost === null) {
      transformed.estimated_cost = null;
    } else {
      transformed.estimated_cost = Number(transformed.estimated_cost) || null;
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
        const fileCount = selectedFiles.length;
        setSelectedFiles([]);
        toast.success('Files uploaded successfully', {
          description: `${fileCount} file${fileCount === 1 ? '' : 's'} uploaded successfully`,
          duration: 3000,
          icon: <Check className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          },
        });
        // Reload the page to show the new attachments
        router.reload({ only: ['ticket'] });
      } else {
        let errorMessage = 'Failed to upload files. ';
        
        if (response.status === 413) {
          errorMessage += 'File size is too large. Maximum allowed: 10MB per file. Please contact your administrator if you need to upload larger files.';
        } else {
          try {
            const data = await response.json();
            errorMessage += data.message || 'Unknown error';
          } catch {
            errorMessage += `Server error (${response.status}). Please try again or contact support.`;
          }
        }
        
        console.error('Upload error:', response.status, errorMessage);
        toast.error('Upload failed', {
          description: errorMessage,
          duration: 5000,
          icon: <X className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
          },
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: 'Failed to upload files. Please try again.',
        duration: 5000,
        icon: <X className="size-5 text-white" />,
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
        },
      });
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
    // Validate file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const invalidFiles: File[] = [];
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        invalidFiles.push(file);
        return false;
      }
      return true;
    });
    
    // Show error toast for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach((file) => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        toast.error('File too large', {
          description: `"${file.name}" (${fileSizeMB}MB) exceeds the maximum size of 10MB per file.`,
          duration: 5000,
          icon: <X className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
          },
        });
      });
    }
    
    // Show success toast if files were added
    if (validFiles.length > 0) {
      toast.success(
        validFiles.length === 1 ? 'File added' : `${validFiles.length} files added`,
        {
          description: validFiles.length === 1 
            ? `"${validFiles[0].name}" is ready to upload`
            : `${validFiles.length} files are ready to upload`,
          duration: 3000,
          icon: <Check className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          },
        }
      );
    }
    
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    const maxSize = 10 * 1024 * 1024;
    const invalidFiles: File[] = [];
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        invalidFiles.push(file);
        return false;
      }
      return true;
    });
    
    // Show error toast for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach((file) => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        toast.error('File too large', {
          description: `"${file.name}" (${fileSizeMB}MB) exceeds the maximum size of 10MB per file.`,
          duration: 5000,
          icon: <X className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
          },
        });
      });
    }
    
    // Show success toast if files were added
    if (validFiles.length > 0) {
      toast.success(
        validFiles.length === 1 ? 'File added' : `${validFiles.length} files added`,
        {
          description: validFiles.length === 1 
            ? `"${validFiles[0].name}" is ready to upload`
            : `${validFiles.length} files are ready to upload`,
          duration: 3000,
          icon: <Check className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          },
        }
      );
    }
    
    setSelectedFiles((prev) => [...prev, ...validFiles]);
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
        const fileCount = selectedFiles.length;
        setSelectedFiles([]);
        toast.success('Files uploaded successfully', {
          description: `${fileCount} file${fileCount === 1 ? '' : 's'} uploaded successfully`,
          duration: 3000,
          icon: <Check className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          },
        });
        router.reload({ only: ['ticket'] });
      } else {
        let errorMessage = 'Failed to upload files. ';
        
        if (response.status === 413) {
          errorMessage += 'File size is too large. Maximum allowed: 10MB per file. Please contact your administrator if you need to upload larger files.';
        } else {
          try {
            const data = await response.json();
            errorMessage += data.message || 'Unknown error';
          } catch {
            errorMessage += `Server error (${response.status}). Please try again or contact support.`;
          }
        }
        
        console.error('Upload error:', response.status, errorMessage);
        toast.error('Upload failed', {
          description: errorMessage,
          duration: 5000,
          icon: <X className="size-5 text-white" />,
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
          },
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: 'Failed to upload files. Please try again.',
        duration: 5000,
        icon: <X className="size-5 text-white" />,
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
        },
      });
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
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Category search state
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
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
      
      // Check for template data from flash (when creating from template)
      const flash = (pageProps as any).flash;
      if (flash?.template_data) {
        const templateData = flash.template_data;
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
      }
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
        {/* Main Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Basic Information</CardTitle>
              <CardDescription>Essential details about the ticket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={subjectInputRef}
                  id="subject"
                  value={data.subject}
                  onChange={(e) => setData('subject', e.target.value)}
                  placeholder="Brief summary of the issue or request"
                  className="text-base mt-1.5"
                />
                {errors.subject && <p className="text-xs text-destructive mt-1.5">{errors.subject}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={6}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Provide detailed information about the issue, steps to reproduce, or what you need..."
                  className="text-base mt-1.5 resize-none"
                />
                {errors.description && <p className="text-xs text-destructive mt-1.5">{errors.description}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Classification & Routing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Classification & Routing</CardTitle>
              <CardDescription>Category, team assignment, and classification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        className="w-full justify-between mt-1.5 h-10"
                      >
                        <span className="truncate">
                          {data.category_id
                            ? formOptions.categories.find((c) => c.id === data.category_id)?.name ||
                              (isEdit && ticket?.category ? `${ticket.category.name}${!formOptions.categories.find((c) => c.id === ticket.category?.id) ? ' (Inactive)' : ''}` : 'Select category...')
                            : 'Select category...'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="pl-8"
                            autoFocus
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-[280px]">
                        <div className="p-1.5">
                          {formOptions.categories
                            .filter((category) =>
                              category.name.toLowerCase().includes(categorySearch.toLowerCase())
                            )
                            .length === 0 &&
                            (!isEdit ||
                              !ticket?.category ||
                              formOptions.categories.find((c) => c.id === ticket.category?.id) ||
                              !ticket.category.name.toLowerCase().includes(categorySearch.toLowerCase())) ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                              <p>No category found.</p>
                              <p className="text-xs mt-1">Try a different search term</p>
                            </div>
                          ) : (
                            <>
                              {formOptions.categories
                                .filter((category) =>
                                  category.name.toLowerCase().includes(categorySearch.toLowerCase())
                                )
                                .map((category) => (
                                  <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                      setData('category_id', category.id);
                                      setCategoryOpen(false);
                                      setCategorySearch('');
                                    }}
                                    className={cn(
                                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer',
                                      data.category_id === category.id && 'bg-accent text-accent-foreground font-medium'
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        'h-4 w-4 shrink-0',
                                        data.category_id === category.id ? 'opacity-100 text-primary' : 'opacity-0'
                                      )}
                                    />
                                    <span className="truncate">{category.name}</span>
                                  </button>
                                ))}
                              {isEdit &&
                                ticket?.category &&
                                !formOptions.categories.find((c) => c.id === ticket.category?.id) &&
                                (categorySearch === '' ||
                                  ticket.category.name.toLowerCase().includes(categorySearch.toLowerCase())) && (
                                  <button
                                    type="button"
                                    disabled
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md opacity-50 cursor-not-allowed"
                                  >
                                    <Check className="h-4 w-4 shrink-0 opacity-0" />
                                    <span className="truncate">{ticket.category.name} (Inactive)</span>
                                  </button>
                                )}
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  {errors.category_id && <p className="text-xs text-destructive mt-1.5">{errors.category_id}</p>}
                  {isEdit && ticket?.category && !formOptions.categories.find((c) => c.id === ticket.category?.id) && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>This category is inactive. Please select an active category.</span>
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Team Department <span className="text-destructive">*</span>
                  </Label>
                  <Select value={data.assigned_team_id?.toString()} onValueChange={(value) => setData('assigned_team_id', Number(value))}>
                    <SelectTrigger className="mt-1.5 h-10">
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
                  {errors.assigned_team_id && <p className="text-xs text-destructive mt-1.5">{errors.assigned_team_id}</p>}
                  {defaultTeamId && !isEdit && (
                    <p className="text-xs text-muted-foreground mt-1.5">Auto-filled from your department</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Requester <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={data.requester_id?.toString()} 
                  onValueChange={(value) => setData('requester_id', Number(value))}
                  disabled={!isEdit && !formOptions.can_create_on_behalf && formOptions.requesters.length === 1}
                >
                  <SelectTrigger className="mt-1.5 h-10">
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
                {errors.requester_id && <p className="text-xs text-destructive mt-1.5">{errors.requester_id}</p>}
                {!isEdit && formOptions.can_create_on_behalf && data.requester_id && data.requester_id !== auth?.user?.id && (
                  <p className="text-xs text-blue-600 mt-1.5 font-medium flex items-center gap-1">
                    <span>ℹ️</span>
                    <span>Creating on behalf of: {formOptions.requesters.find((r) => r.id === data.requester_id)?.name || 'Selected user'}</span>
                  </p>
                )}
                {!isEdit && !formOptions.can_create_on_behalf && formOptions.requesters.length === 1 && (
                  <p className="text-xs text-muted-foreground mt-1.5">You can only create tickets for yourself</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Status & Priority</CardTitle>
              <CardDescription>Set ticket status, priority level, and source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                    <SelectTrigger className="mt-1.5 h-10">
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
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                    <SelectTrigger className="mt-1.5 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formOptions.priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center gap-2">
                            <span>{priority}</span>
                            <Badge className={cn('text-xs', priorityColorMap[priority] ?? '')}>{priority}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Source</Label>
                  <Select value={data.source} onValueChange={(value) => setData('source', value)}>
                    <SelectTrigger className="mt-1.5 h-10">
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
                <Label htmlFor="estimated_cost" className="text-sm font-medium">
                  Estimated Cost
                </Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={data.estimated_cost ?? ''}
                  onChange={(e) => setData('estimated_cost', e.target.value === '' ? null : Number(e.target.value) || null)}
                  className="mt-1.5"
                />
                {formErrors.estimated_cost && (
                  <p className="text-xs text-destructive mt-1.5">{formErrors.estimated_cost}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  For purchase/expense tickets. HOD approval required if cost exceeds category threshold.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Assignment Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Assignment</CardTitle>
                  <CardDescription className="text-xs">Assign agent or project (optional)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Agent</Label>
                <Select
                  value={data.assigned_agent_id ? data.assigned_agent_id.toString() : ''}
                  onValueChange={(value) =>
                    setData('assigned_agent_id', value === '__none' ? '' : Number(value))
                  }
                >
                  <SelectTrigger className={cn(
                    "h-10 mt-1.5",
                    data.assigned_agent_id && "border-primary/50 bg-primary/5"
                  )}>
                    <div className="flex items-center gap-2">
                      {data.assigned_agent_id ? (
                        <>
                          <User className="h-4 w-4 text-primary" />
                          <SelectValue>
                            {formOptions.agents.find(a => a.id === data.assigned_agent_id)?.name || 'Unassigned'}
                          </SelectValue>
                        </>
                      ) : (
                        <SelectValue placeholder="Select an agent..." />
                      )}
                    </div>
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
                {errors.assigned_agent_id && <p className="text-xs text-destructive mt-1.5">{errors.assigned_agent_id}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium">Project</Label>
                <Select
                  value={data.project_id ? data.project_id.toString() : ''}
                  onValueChange={(value) =>
                    setData('project_id', value === '__none' ? '' : Number(value))
                  }
                >
                  <SelectTrigger className={cn(
                    "h-10 mt-1.5",
                    data.project_id && "border-primary/50 bg-primary/5"
                  )}>
                    <div className="flex items-center gap-2">
                      {data.project_id ? (
                        <>
                          <FolderKanban className="h-4 w-4 text-primary" />
                          <SelectValue>
                            {formOptions.projects.find(p => p.id === data.project_id)?.name || 'No project'}
                          </SelectValue>
                        </>
                      ) : (
                        <SelectValue placeholder="Select a project..." />
                      )}
                    </div>
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
                {errors.project_id && <p className="text-xs text-destructive mt-1.5">{errors.project_id}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                  <CardDescription className="text-xs">
                    {isEdit 
                      ? 'Upload files related to this ticket'
                      : 'Files will be attached after ticket creation'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:underline">
                    Click to upload
                  </span>
                  <span className="text-sm text-muted-foreground"> or drag and drop</span>
                </div>
                <Input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z"
                  className="hidden"
                  disabled={uploadingFiles}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, Office docs, images, archives (Max 10MB per file)
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Selected Files ({selectedFiles.length})
                    </Label>
                    {isEdit && ticket?.id && (
                      <Button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={uploadingFiles}
                        size="sm"
                        className="h-8"
                      >
                        {uploadingFiles ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-2" />
                            Upload All
                          </>
                        )}
                      </Button>
                    )}
                    {!isEdit && (
                      <span className="text-xs text-muted-foreground">
                        Will upload after creation
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                    {selectedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-2.5 rounded-md bg-background border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(index)}
                          disabled={uploadingFiles}
                          className="h-8 w-8 p-0 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                  {/* SLA & Timelines Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">SLA & Timelines</Label>
                      <CardDescription className="text-xs mt-1">Service level agreements and timeline tracking</CardDescription>
                    </div>
                    
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

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm">First Response</Label>
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

                      <div className="space-y-2">
                        <Label className="text-sm">Resolution</Label>
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
                      <Label className="text-sm">Closure</Label>
                      <Input
                        type="datetime-local"
                        value={data.closed_at}
                        onChange={(e) => setData('closed_at', e.target.value)}
                        placeholder="Closed at"
                      />
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="response_sla_breached"
                          checked={data.response_sla_breached}
                          onCheckedChange={(checked) => setData('response_sla_breached', Boolean(checked))}
                        />
                        <Label htmlFor="response_sla_breached" className="text-sm font-normal cursor-pointer">
                          Response SLA breached
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="resolution_sla_breached"
                          checked={data.resolution_sla_breached}
                          onCheckedChange={(checked) => setData('resolution_sla_breached', Boolean(checked))}
                        />
                        <Label htmlFor="resolution_sla_breached" className="text-sm font-normal cursor-pointer">
                          Resolution SLA breached
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Custom Fields */}
                  {formOptions.customFields && formOptions.customFields.length > 0 && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-base font-semibold">Custom Fields</Label>
                        <CardDescription className="text-xs mt-1">Additional information specific to your organization</CardDescription>
                      </div>
                      <CustomFieldsForm
                        fields={formOptions.customFields}
                        values={data.custom_fields}
                        onChange={handleCustomFieldChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* Tags Section */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-base font-semibold">Tags</Label>
                      <CardDescription className="text-xs mt-1">Helps classify tickets and trigger automations</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formOptions.tags.length > 0 ? (
                        formOptions.tags.map((tag) => (
                          <button
                            type="button"
                            key={tag.id}
                            onClick={() => toggleArrayValue('tag_ids', tag.id)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                              data.tag_ids.includes(tag.id) 
                                ? 'ring-2 ring-offset-2 ring-primary shadow-sm scale-105' 
                                : 'opacity-70 hover:opacity-100'
                            )}
                            style={{ backgroundColor: tag.color, color: '#fff' }}
                          >
                            {tag.name}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags available</p>
                      )}
                    </div>
                  </div>

                  {/* Watchers Section */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-base font-semibold">Watchers</Label>
                      <CardDescription className="text-xs mt-1">Users who should receive updates about this ticket</CardDescription>
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {formOptions.requesters.length > 0 ? (
                        formOptions.requesters.map((user) => (
                          <label key={user.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded transition">
                            <Checkbox 
                              checked={data.watcher_ids.includes(user.id)} 
                              onCheckedChange={() => toggleArrayValue('watcher_ids', user.id)} 
                            />
                            <span>{user.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No users available</p>
                      )}
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
