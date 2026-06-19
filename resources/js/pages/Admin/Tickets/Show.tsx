import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Edit,
    Filter,
    Loader2,
    Maximize,
    Minimize,
    Paperclip,
    Reply,
    RotateCcw,
    Send,
    Shield,
    Timer,
    Trash2,
    TrendingDown,
    TrendingUp,
    Upload,
    User,
    UserPlus,
    Users,
    X,
    XCircle,
    Zap,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/user-avatar';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type BaseOption = {
    id: number;
    name: string;
    email?: string;
    avatar?: string | null;
};

type TicketShowProps = {
    ticket?: {
        id: number;
        ticket_number: string;
        subject: string;
        description: string;
        status: string;
        status_label?: string;
        approval_status?: 'none' | 'pending' | 'approved' | 'rejected';
        resolution_summary?: string | null;
        allowed_statuses: string[];
        capabilities: {
            update_details: boolean;
            change_priority: boolean;
            comment: boolean;
            manage_comments: boolean;
            assign: boolean;
            resubmit: boolean;
        };
        priority: string;
        source: string;
        requester?: BaseOption & { email?: string };
        assigned_team?: BaseOption;
        assigned_agent?: BaseOption;
        category?: BaseOption;
        project?: { id: number; name: string; code: string };
        sla_policy?: BaseOption;
        tags: { id: number; name: string; color: string }[];
        watchers: BaseOption[];
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
            };
        }[];
        comments: {
            id: number;
            body: string;
            is_internal: boolean;
            type: string;
            created_at: string;
            user?: BaseOption;
        }[];
        attachments: {
            id: number;
            filename: string;
            original_filename: string;
            file_path: string;
            mime_type: string;
            file_size: number;
            created_at: string;
            uploader?: BaseOption;
        }[];
        histories: {
            id: number;
            action: string;
            field_name?: string | null;
            old_value?: string | null;
            new_value?: string | null;
            description?: string | null;
            created_at: string;
            user?: BaseOption;
        }[];
        approvals?: {
            id: number;
            approval_level: 'lm' | 'hod';
            status: 'pending' | 'approved' | 'rejected';
            status_label?: string | null;
            comments?: string | null;
            approved_at?: string | null;
            rejected_at?: string | null;
            sequence: number;
            can_approve: boolean;
            approver?: BaseOption & { email?: string };
            routed_to_team?: BaseOption;
            created_at: string;
        }[];
        current_approval?: {
            id: number;
            approval_level: 'lm' | 'hod';
            status_label?: string | null;
            status: 'pending' | 'approved' | 'rejected';
            can_approve: boolean;
            approver?: BaseOption & { email?: string };
        } | null;
        rejected_approval?: {
            id: number;
            approval_level: 'lm' | 'hod';
            status: 'rejected';
            comments?: string | null;
            rejected_at?: string | null;
            approver?: BaseOption & { email?: string };
        } | null;
        rejected_approval_count?: number;
        created_at: string;
        updated_at: string;
    };
    agents?: BaseOption[];
    departments?: BaseOption[];
    options?: {
        statuses: string[];
        priorities: string[];
        teams: Array<{ id: number; name: string }>;
        agents: Array<{ id: number; name: string }>;
        categories: Array<{ id: number; name: string }>;
        projects: Array<{ id: number; name: string }>;
        requesters: Array<{ id: number; name: string }>;
        tags: Array<{ id: number; name: string; color: string }>;
    };
};

type Ticket = NonNullable<TicketShowProps['ticket']>;
type CustomFieldValue = NonNullable<Ticket['custom_field_values']>[number];
type TicketApproval = NonNullable<Ticket['approvals']>[number];
type TicketAttachment = Ticket['attachments'][number];
type TicketTag = Ticket['tags'][number];
type TicketWatcher = Ticket['watchers'][number];

const statusColorMap: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-amber-100 text-amber-800',
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-200 text-slate-800',
    cancelled: 'bg-gray-200 text-gray-700',
};

const priorityColorMap: Record<string, string> = {
    low: 'bg-slate-200 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const formatStatus = (status: string) =>
    status === 'pending'
        ? 'Waiting'
        : status
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

export default function TicketShow(props: TicketShowProps) {
    const { can } = usePermissions();
    useToast(); // Handle flash messages
    const page = usePage();
    const pageProps = page.props as any;
    const departments: BaseOption[] =
        props.departments || pageProps.departments || [];
    const agents = props.agents || [];
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteAttachmentDialogOpen, setDeleteAttachmentDialogOpen] =
        useState<number | null>(null);
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [previewImageName, setPreviewImageName] = useState<string>('');
    const [imageZoom, setImageZoom] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);

    // Comment edit/delete state
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null,
    );
    const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState<
        number | null
    >(null);

    // Comment form
    const commentForm = useForm({
        body: '',
        is_internal: false,
        parent_id: null as number | null,
    });

    const [replyingToCommentId, setReplyingToCommentId] = useState<
        number | null
    >(null);

    // Get current user ID and department
    const currentUserId = pageProps.auth?.user?.id;
    const currentUserDepartmentId = pageProps.auth?.user?.department_id;

    // Comment edit form
    const editCommentForm = useForm({
        body: '',
        is_internal: false,
    });

    // Approval form
    const approvalForm = useForm({
        comments: '',
        routed_to_team_id: null as number | null,
    });

    const rejectForm = useForm({
        comments: '',
    });

    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(
        null,
    );
    const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
    const resolutionForm = useForm({
        status: 'resolved',
        resolution_summary: '',
    });

    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Quick actions state
    const [quickStatusChange, setQuickStatusChange] = useState<string | null>(
        null,
    );
    const [quickPriorityChange, setQuickPriorityChange] = useState<
        string | null
    >(null);
    const [quickAssignmentChange, setQuickAssignmentChange] = useState<
        number | null
    >(null);
    const [commentFilter, setCommentFilter] = useState<
        'all' | 'internal' | 'public'
    >('all');
    const [activeTab, setActiveTab] = useState('details');

    const canEditComment = (comment: any) => {
        return (
            (comment.user?.id === currentUserId &&
                ticket.capabilities.comment) ||
            ticket.capabilities.manage_comments
        );
    };

    const handleEditComment = (comment: any) => {
        setEditingCommentId(comment.id);
        editCommentForm.setData({
            body: comment.body,
            is_internal: comment.is_internal,
        });
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        editCommentForm.reset();
    };

    const handleSaveComment = (commentId: number) => {
        editCommentForm.put(
            route('admin.ticket-comments.update', {
                ticket: ticket.id,
                comment: commentId,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingCommentId(null);
                    editCommentForm.reset();
                },
            },
        );
    };

    // File upload handlers
    const getCsrfToken = (): string => {
        const pageProps = page.props as any;
        if (pageProps?.csrf_token) {
            return pageProps.csrf_token;
        }

        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        if (token) return token;

        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }

        throw new Error(
            'CSRF token not found. Please refresh the page and try again.',
        );
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate file count (max 10)
        if (selectedFiles.length + files.length > 10) {
            toast.error('Too many files', {
                description: 'You can upload a maximum of 10 files at once.',
            });
            return;
        }

        // Validate file sizes (max 10MB each)
        const invalidFiles = files.filter(
            (file) => file.size > 10 * 1024 * 1024,
        );
        if (invalidFiles.length > 0) {
            toast.error('File too large', {
                description: `${invalidFiles.length} file(s) exceed the 10MB limit.`,
            });
            return;
        }

        setSelectedFiles((prev) => [...prev, ...files]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileRemove = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFileUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploadingFiles(true);
        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            const csrfToken = getCsrfToken();
            formData.append('_token', csrfToken);

            const response = await fetch(
                route('admin.ticket-attachments.store', ticket.id),
                {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    body: formData,
                },
            );

            if (response.ok) {
                const fileCount = selectedFiles.length;
                setSelectedFiles([]);
                toast.success('Files uploaded successfully', {
                    description: `${fileCount} file${fileCount === 1 ? '' : 's'} uploaded successfully`,
                });
                // Reload the page to show new attachments
                router.reload({ only: ['ticket'] });
            } else {
                let errorMessage = 'Failed to upload files.';
                if (response.status === 419) {
                    errorMessage =
                        'Session expired. Please refresh the page and try again.';
                } else if (response.status === 413) {
                    errorMessage =
                        'File size is too large. Maximum allowed: 10MB per file.';
                } else if (response.status === 422) {
                    try {
                        const data = await response.json();
                        if (data.errors) {
                            const errorDetails = Object.values(
                                data.errors,
                            ).flat();
                            errorMessage = errorDetails.join(' ');
                        }
                    } catch (e) {
                        // Ignore JSON parse errors
                    }
                }
                toast.error('Upload failed', {
                    description: errorMessage,
                });
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Upload failed', {
                description:
                    error.message ||
                    'Failed to upload files. Please try again.',
            });
        } finally {
            setUploadingFiles(false);
        }
    };

    // Reset zoom and position when dialog closes
    useEffect(() => {
        if (!imagePreviewOpen) {
            setImageZoom(1);
            setImagePosition({ x: 0, y: 0 });
            setIsFullscreen(false);
        }
    }, [imagePreviewOpen]);

    // Handle fullscreen toggle
    const toggleFullscreen = async () => {
        if (!dialogContentRef.current) return;

        try {
            if (!isFullscreen) {
                // Enter fullscreen
                if (dialogContentRef.current.requestFullscreen) {
                    await dialogContentRef.current.requestFullscreen();
                } else if (
                    (dialogContentRef.current as any).webkitRequestFullscreen
                ) {
                    await (
                        dialogContentRef.current as any
                    ).webkitRequestFullscreen();
                } else if (
                    (dialogContentRef.current as any).msRequestFullscreen
                ) {
                    await (
                        dialogContentRef.current as any
                    ).msRequestFullscreen();
                }
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener(
            'webkitfullscreenchange',
            handleFullscreenChange,
        );
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
            document.removeEventListener(
                'webkitfullscreenchange',
                handleFullscreenChange,
            );
            document.removeEventListener(
                'msfullscreenchange',
                handleFullscreenChange,
            );
        };
    }, []);

    // Handle mouse wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        if (!imagePreviewOpen) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    };

    // Handle mouse drag
    const handleMouseDown = (e: React.MouseEvent) => {
        if (imageZoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - imagePosition.x,
                y: e.clientY - imagePosition.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && imageZoom > 1) {
            setImagePosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomIn = () => {
        setImageZoom((prev) => Math.min(5, prev + 0.25));
    };

    const handleZoomOut = () => {
        setImageZoom((prev) => Math.max(0.5, prev - 0.25));
    };

    const handleResetZoom = () => {
        setImageZoom(1);
        setImagePosition({ x: 0, y: 0 });
    };

    // Get ticket from props or page props
    const ticketData = props.ticket || (page.props as any).ticket;

    // Handle TicketResource wrapping - Inertia may wrap it in a data property
    // Check if ticketData has a data property (from TicketResource)
    let ticket = ticketData;
    if (ticketData && typeof ticketData === 'object' && 'data' in ticketData) {
        ticket = (ticketData as any).data;
    }

    if (!ticket || !ticket.id) {
        return (
            <AppLayout>
                <Head title="Ticket Not Found" />
                <div className="py-12 text-center">
                    <p className="text-muted-foreground">Ticket not found.</p>
                </div>
            </AppLayout>
        );
    }

    // Check if current user can pick this ticket
    // Agents can pick tickets assigned to their team (tickets always have a team assigned)
    const canPickTicket =
        !can('tickets.assign') && // Agent without assign permission
        !ticket.assigned_agent && // No agent assigned
        ticket.assigned_team && // Ticket has a team assigned (always true)
        ticket.assigned_team.id === currentUserDepartmentId; // Assigned to their team

    return (
        <AppLayout>
            <Head title={`Ticket ${ticket.ticket_number}`} />

            <div className="mb-4 rounded-md border bg-background">
                <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="-ml-2 h-7 px-2 text-xs"
                            >
                                <Link href={route('admin.tickets.index')}>
                                    <ArrowRight className="mr-1 h-3.5 w-3.5 rotate-180" />
                                    Tickets
                                </Link>
                            </Button>
                            <span className="font-mono text-xs text-muted-foreground">
                                {ticket.ticket_number}
                            </span>
                            {ticket.status && (
                                <Badge
                                    className={cn(
                                        'h-5 px-1.5 text-[11px] capitalize',
                                        statusColorMap[ticket.status] ?? '',
                                    )}
                                >
                                    {ticket.status === 'pending' &&
                                    ticket.current_approval?.status_label
                                        ? ticket.current_approval.status_label
                                        : (ticket.status_label ??
                                          formatStatus(ticket.status))}
                                </Badge>
                            )}
                            {ticket.priority && (
                                <Badge
                                    className={cn(
                                        'h-5 px-1.5 text-[11px] capitalize',
                                        priorityColorMap[ticket.priority] ?? '',
                                    )}
                                >
                                    {ticket.priority}
                                </Badge>
                            )}
                            {ticket.current_approval && (
                                <Badge
                                    variant="outline"
                                    className="h-5 gap-1 border-amber-200 bg-amber-50 px-1.5 text-[11px] text-amber-800"
                                >
                                    <Clock className="h-3 w-3" />
                                    Approval
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-xl leading-tight font-semibold break-words sm:text-2xl">
                            {ticket.subject}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {ticket.requester && (
                                <span className="inline-flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    {ticket.requester.name}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(ticket.created_at).toLocaleDateString(
                                    'en-US',
                                    {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    },
                                )}
                            </span>
                            {ticket.category && (
                                <span>{ticket.category.name}</span>
                            )}
                            {ticket.project && (
                                <span>
                                    {ticket.project.code || ticket.project.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        {canPickTicket && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    router.put(
                                        route('admin.tickets.update', {
                                            ticket: ticket.id,
                                        }),
                                        {
                                            assigned_agent_id: currentUserId,
                                        },
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                toast.success(
                                                    'Ticket picked successfully!',
                                                );
                                            },
                                            onError: (errors) => {
                                                const errorMessage =
                                                    errors.assigned_agent_id ||
                                                    errors.message ||
                                                    Object.values(errors)
                                                        .flat()
                                                        .join(', ') ||
                                                    'Failed to pick ticket.';
                                                toast.error(errorMessage);
                                            },
                                        },
                                    );
                                }}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Pick
                            </Button>
                        )}
                        {ticket.capabilities.update_details && (
                            <Button asChild variant="outline" size="sm">
                                <Link
                                    href={route('admin.tickets.edit', {
                                        ticket: ticket.id,
                                    })}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        {can('tickets.delete') && (
                            <AlertDialog
                                open={deleteDialogOpen}
                                onOpenChange={setDeleteDialogOpen}
                            >
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setDeleteDialogOpen(true)
                                        }
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Delete Ticket
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete
                                            ticket "{ticket.ticket_number}"?
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const ticketId = ticket.id;
                                                setDeleteDialogOpen(false);
                                                router.delete(
                                                    route(
                                                        'admin.tickets.destroy',
                                                        {
                                                            ticket: ticketId,
                                                        },
                                                    ),
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () => {},
                                                        onError: (errors) => {
                                                            console.error(
                                                                'Delete errors:',
                                                                errors,
                                                            );
                                                        },
                                                    },
                                                );
                                            }}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
            >
                <TabsList className="h-9 w-full justify-start overflow-x-auto rounded-md border bg-muted/30 p-0.5">
                    <TabsTrigger
                        value="details"
                        className="h-8 px-3 text-xs data-[state=active]:bg-background"
                    >
                        Details
                    </TabsTrigger>
                    <TabsTrigger
                        value="comments"
                        className="h-8 px-3 text-xs data-[state=active]:bg-background"
                    >
                        Comments
                        {(ticket.comments?.length ?? 0) > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-2 h-5 min-w-5 px-1.5 text-xs"
                            >
                                {ticket.comments?.length ?? 0}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="attachments"
                        className="h-8 px-3 text-xs data-[state=active]:bg-background"
                    >
                        Attachments
                        {(ticket.attachments?.length ?? 0) > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-2 h-5 min-w-5 px-1.5 text-xs"
                            >
                                {ticket.attachments?.length ?? 0}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="activity"
                        className="h-8 px-3 text-xs data-[state=active]:bg-background"
                    >
                        Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Card className="rounded-md border bg-muted/20 p-3 shadow-none">
                            <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] text-muted-foreground">
                                        Requester
                                    </p>
                                    <p className="truncate text-sm font-medium">
                                        {ticket.requester?.name ?? '—'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="rounded-md border bg-muted/20 p-3 shadow-none">
                            <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] text-muted-foreground">
                                        Assigned To
                                    </p>
                                    <p className="truncate text-sm font-medium">
                                        {ticket.assigned_agent?.name ??
                                            ticket.assigned_team?.name ??
                                            'Unassigned'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="rounded-md border bg-muted/20 p-3 shadow-none">
                            <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] text-muted-foreground">
                                        Comments
                                    </p>
                                    <p className="text-sm font-medium">
                                        {ticket.comments?.length ?? 0}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="rounded-md border bg-muted/20 p-3 shadow-none">
                            <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] text-muted-foreground">
                                        Attachments
                                    </p>
                                    <p className="text-sm font-medium">
                                        {ticket.attachments?.length ?? 0}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Content Area */}
                        <div className="space-y-4 lg:col-span-2">
                            {/* Description Card - Cleaner */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold">
                                        Description
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg bg-muted/20 p-5">
                                        <p className="text-sm leading-relaxed break-words whitespace-pre-line text-foreground">
                                            {ticket.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ticket Information Card - Cleaner */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold">
                                        Ticket Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="flex items-center gap-3">
                                                {ticket.requester && (
                                                    <UserAvatar
                                                        user={ticket.requester}
                                                        size="md"
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                        Requester
                                                    </p>
                                                    <p className="text-sm font-semibold">
                                                        {ticket.requester
                                                            ?.name ?? '—'}
                                                    </p>
                                                    {ticket.requester
                                                        ?.email && (
                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                            {
                                                                ticket.requester
                                                                    .email
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Assignment
                                                </p>
                                                {canPickTicket && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            router.put(
                                                                route(
                                                                    'admin.tickets.update',
                                                                    {
                                                                        ticket: ticket.id,
                                                                    },
                                                                ),
                                                                {
                                                                    assigned_agent_id:
                                                                        currentUserId,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () => {
                                                                            toast.success(
                                                                                'Ticket picked successfully!',
                                                                            );
                                                                        },
                                                                    onError: (
                                                                        errors,
                                                                    ) => {
                                                                        toast.error(
                                                                            errors.assigned_agent_id ||
                                                                                'Failed to pick ticket.',
                                                                        );
                                                                    },
                                                                },
                                                            );
                                                        }}
                                                        className="h-7 text-xs"
                                                    >
                                                        <UserPlus className="mr-1 h-3 w-3" />
                                                        Pick
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {ticket.assigned_agent ? (
                                                    <UserAvatar
                                                        user={
                                                            ticket.assigned_agent
                                                        }
                                                        size="md"
                                                    />
                                                ) : ticket.assigned_team ? (
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                        <Users className="h-5 w-5 text-primary" />
                                                    </div>
                                                ) : null}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold">
                                                        {ticket.assigned_agent
                                                            ?.name ??
                                                            ticket.assigned_team
                                                                ?.name ?? (
                                                                <span className="text-muted-foreground italic">
                                                                    Unassigned
                                                                </span>
                                                            )}
                                                    </p>
                                                    {ticket.assigned_team &&
                                                        !ticket.assigned_agent && (
                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                Available for
                                                                team members to
                                                                pick
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                Category
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {ticket.category?.name ?? '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                Project
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {ticket.project?.name ??
                                                    'No project'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                Source
                                            </p>
                                            <p className="text-sm font-semibold capitalize">
                                                {ticket.source}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                SLA Policy
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {ticket.sla_policy?.name ??
                                                    'No SLA'}
                                            </p>
                                        </div>
                                    </div>

                                    {(ticket.custom_field_values?.length ?? 0) >
                                        0 && (
                                        <div className="border-t pt-4">
                                            <h3 className="mb-3 text-sm font-semibold">
                                                Custom Fields
                                            </h3>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {(
                                                    ticket.custom_field_values ??
                                                    []
                                                ).map(
                                                    (cfv: CustomFieldValue) => {
                                                        let displayValue =
                                                            cfv.value;

                                                        // Format value based on field type
                                                        if (
                                                            cfv.custom_field
                                                                .field_type ===
                                                            'multiselect'
                                                        ) {
                                                            try {
                                                                const values =
                                                                    JSON.parse(
                                                                        cfv.value,
                                                                    );
                                                                const options =
                                                                    cfv
                                                                        .custom_field
                                                                        .options ||
                                                                    [];
                                                                displayValue =
                                                                    values
                                                                        .map(
                                                                            (
                                                                                v: string,
                                                                            ) =>
                                                                                options.find(
                                                                                    (
                                                                                        opt,
                                                                                    ) =>
                                                                                        opt.value ===
                                                                                        v,
                                                                                )
                                                                                    ?.label ||
                                                                                v,
                                                                        )
                                                                        .join(
                                                                            ', ',
                                                                        );
                                                            } catch {
                                                                displayValue =
                                                                    cfv.value;
                                                            }
                                                        } else if (
                                                            cfv.custom_field
                                                                .field_type ===
                                                            'boolean'
                                                        ) {
                                                            displayValue =
                                                                cfv.value ===
                                                                    '1' ||
                                                                cfv.value ===
                                                                    true
                                                                    ? 'Yes'
                                                                    : 'No';
                                                        } else if (
                                                            cfv.custom_field
                                                                .field_type ===
                                                            'select'
                                                        ) {
                                                            const option =
                                                                cfv.custom_field.options?.find(
                                                                    (opt) =>
                                                                        opt.value ===
                                                                        cfv.value,
                                                                );
                                                            displayValue =
                                                                option?.label ||
                                                                cfv.value;
                                                        }

                                                        return (
                                                            <div key={cfv.id}>
                                                                <p className="mb-1 text-xs text-muted-foreground">
                                                                    {
                                                                        cfv
                                                                            .custom_field
                                                                            .label
                                                                    }
                                                                </p>
                                                                <p className="text-sm font-medium">
                                                                    {displayValue ||
                                                                        '—'}
                                                                </p>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(ticket.tags?.length ?? 0) > 0 && (
                                        <div className="border-t pt-4">
                                            <h3 className="mb-3 text-sm font-semibold">
                                                Tags
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(ticket.tags ?? []).map(
                                                    (tag: TicketTag) => (
                                                        <Badge
                                                            key={tag.id}
                                                            style={{
                                                                backgroundColor:
                                                                    tag.color,
                                                                color: '#fff',
                                                            }}
                                                            className="text-xs"
                                                        >
                                                            {tag.name}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(ticket.watchers?.length ?? 0) > 0 && (
                                        <div className="border-t pt-4">
                                            <h3 className="mb-3 text-sm font-semibold">
                                                Watchers
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {(ticket.watchers ?? []).map(
                                                    (
                                                        watcher: TicketWatcher,
                                                    ) => (
                                                        <div
                                                            key={watcher.id}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <UserAvatar
                                                                user={watcher}
                                                                size="xs"
                                                            />
                                                            <span className="text-sm">
                                                                {watcher.name}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Approval Section */}
                            {ticket.approvals &&
                                ticket.approvals.length > 0 &&
                                (() => {
                                    // Filter out the current pending approval to avoid duplication
                                    const completedApprovals =
                                        ticket.approvals.filter(
                                            (approval: TicketApproval) => {
                                                if (
                                                    ticket.current_approval &&
                                                    approval.id ===
                                                        ticket.current_approval
                                                            .id
                                                ) {
                                                    return false; // Skip current pending approval
                                                }
                                                return (
                                                    approval.status !==
                                                        'pending' ||
                                                    approval.id !==
                                                        ticket.current_approval
                                                            ?.id
                                                );
                                            },
                                        );

                                    return completedApprovals.length > 0 ? (
                                        <Card>
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-5 w-5 text-primary" />
                                                    <CardTitle className="text-lg font-semibold">
                                                        Approval History
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {completedApprovals.map(
                                                        (
                                                            approval: TicketApproval,
                                                        ) => {
                                                            const isPending =
                                                                approval.status ===
                                                                'pending';
                                                            const isApproved =
                                                                approval.status ===
                                                                'approved';
                                                            const isRejected =
                                                                approval.status ===
                                                                'rejected';
                                                            const canApprove =
                                                                isPending &&
                                                                approval.can_approve;

                                                            return (
                                                                <div
                                                                    key={
                                                                        approval.id
                                                                    }
                                                                    className={cn(
                                                                        'rounded-lg border p-4 transition-all hover:shadow-sm',
                                                                        isPending &&
                                                                            'border-amber-200 bg-amber-50',
                                                                        isApproved &&
                                                                            'border-emerald-200 bg-emerald-50',
                                                                        isRejected &&
                                                                            'border-red-200 bg-red-50',
                                                                    )}
                                                                >
                                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                        <div className="min-w-0 flex-1 space-y-3">
                                                                            {/* Header with badges */}
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <Badge
                                                                                    className={cn(
                                                                                        'px-2.5 py-1 text-xs font-semibold',
                                                                                        isPending &&
                                                                                            'border-amber-300 bg-amber-100 text-amber-900',
                                                                                        isApproved &&
                                                                                            'border-emerald-300 bg-emerald-100 text-emerald-900',
                                                                                        isRejected &&
                                                                                            'border-red-300 bg-red-100 text-red-900',
                                                                                    )}
                                                                                >
                                                                                    {approval.approval_level ===
                                                                                    'lm'
                                                                                        ? 'Line Manager'
                                                                                        : 'Head of Department'}
                                                                                </Badge>
                                                                                {isPending && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="flex items-center gap-1.5 border-amber-300 bg-amber-50 text-xs text-amber-900"
                                                                                    >
                                                                                        <Clock className="h-3 w-3" />
                                                                                        Pending
                                                                                    </Badge>
                                                                                )}
                                                                                {isApproved && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="flex items-center gap-1.5 border-emerald-300 bg-emerald-50 text-xs text-emerald-900"
                                                                                    >
                                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                                        Approved
                                                                                    </Badge>
                                                                                )}
                                                                                {isRejected && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="flex items-center gap-1.5 border-red-300 bg-red-50 text-xs text-red-900"
                                                                                    >
                                                                                        <XCircle className="h-3 w-3" />
                                                                                        Rejected
                                                                                    </Badge>
                                                                                )}
                                                                            </div>

                                                                            {/* Approval Details */}
                                                                            <div className="space-y-2.5">
                                                                                {approval.approver && (
                                                                                    <div className="flex items-start gap-2.5 text-sm">
                                                                                        <UserAvatar
                                                                                            user={
                                                                                                approval.approver
                                                                                            }
                                                                                            size="sm"
                                                                                            className="mt-0.5 shrink-0"
                                                                                        />
                                                                                        <div className="min-w-0">
                                                                                            <span className="font-medium text-foreground">
                                                                                                Approver:
                                                                                            </span>{' '}
                                                                                            <span className="text-foreground">
                                                                                                {
                                                                                                    approval
                                                                                                        .approver
                                                                                                        .name
                                                                                                }
                                                                                            </span>
                                                                                            {approval
                                                                                                .approver
                                                                                                .email && (
                                                                                                <span className="ml-1 text-muted-foreground">
                                                                                                    (
                                                                                                    {
                                                                                                        approval
                                                                                                            .approver
                                                                                                            .email
                                                                                                    }

                                                                                                    )
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {approval.approved_at && (
                                                                                    <div className="flex items-start gap-2 text-sm">
                                                                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                                                                        <div>
                                                                                            <span className="font-medium text-foreground">
                                                                                                Approved:
                                                                                            </span>{' '}
                                                                                            <span className="text-muted-foreground">
                                                                                                {new Date(
                                                                                                    approval.approved_at,
                                                                                                ).toLocaleString(
                                                                                                    'en-US',
                                                                                                    {
                                                                                                        month: 'short',
                                                                                                        day: 'numeric',
                                                                                                        year: 'numeric',
                                                                                                        hour: '2-digit',
                                                                                                        minute: '2-digit',
                                                                                                    },
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {approval.rejected_at && (
                                                                                    <div className="flex items-start gap-2 text-sm">
                                                                                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                                                                        <div>
                                                                                            <span className="font-medium text-foreground">
                                                                                                Rejected:
                                                                                            </span>{' '}
                                                                                            <span className="text-muted-foreground">
                                                                                                {new Date(
                                                                                                    approval.rejected_at,
                                                                                                ).toLocaleString(
                                                                                                    'en-US',
                                                                                                    {
                                                                                                        month: 'short',
                                                                                                        day: 'numeric',
                                                                                                        year: 'numeric',
                                                                                                        hour: '2-digit',
                                                                                                        minute: '2-digit',
                                                                                                    },
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {approval.comments && (
                                                                                    <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                                                                                        <p className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                                                            Comments
                                                                                        </p>
                                                                                        <p className="text-sm leading-relaxed text-foreground">
                                                                                            {
                                                                                                approval.comments
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                                {approval.routed_to_team && (
                                                                                    <div className="flex items-start gap-2 text-sm">
                                                                                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                                                                        <div>
                                                                                            <span className="font-medium text-foreground">
                                                                                                Routed
                                                                                                to:
                                                                                            </span>{' '}
                                                                                            <span className="text-muted-foreground">
                                                                                                {
                                                                                                    approval
                                                                                                        .routed_to_team
                                                                                                        .name
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Action Buttons */}
                                                                        {canApprove && (
                                                                            <div className="flex flex-col gap-2 lg:ml-4 lg:min-w-[140px]">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setSelectedApprovalId(
                                                                                            approval.id,
                                                                                        );
                                                                                        setApprovalDialogOpen(
                                                                                            true,
                                                                                        );
                                                                                    }}
                                                                                    className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                                                                                >
                                                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                                    Approve
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    onClick={() => {
                                                                                        setSelectedApprovalId(
                                                                                            approval.id,
                                                                                        );
                                                                                        setRejectDialogOpen(
                                                                                            true,
                                                                                        );
                                                                                    }}
                                                                                    className="shadow-sm"
                                                                                >
                                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                                    Reject
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : null;
                                })()}

                            {/* Current Pending Approval */}
                            {ticket.current_approval &&
                                ticket.current_approval.status === 'pending' &&
                                !['resolved', 'closed', 'cancelled'].includes(
                                    ticket.status,
                                ) && (
                                    <Card className="border-0 bg-amber-50/50 shadow-sm dark:bg-amber-950/20">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start gap-3">
                                                        <div className="rounded-lg border border-amber-400 bg-amber-200/60 p-2.5 shadow-sm">
                                                            <Clock className="h-5 w-5 text-amber-900" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                                                <Badge className="border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                                                    {ticket
                                                                        .current_approval
                                                                        .approval_level ===
                                                                    'lm'
                                                                        ? 'Line Manager'
                                                                        : 'Head of Department'}
                                                                </Badge>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-amber-200 bg-amber-50 text-xs font-medium text-amber-900"
                                                                >
                                                                    <Clock className="mr-1 h-3 w-3" />
                                                                    Pending
                                                                    Approval
                                                                </Badge>
                                                            </div>
                                                            <h3 className="mb-3 text-lg font-semibold text-foreground">
                                                                Approval
                                                                Required
                                                            </h3>
                                                            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                                                                This ticket is
                                                                waiting for{' '}
                                                                {ticket
                                                                    .current_approval
                                                                    .approval_level ===
                                                                'lm'
                                                                    ? 'Line Manager'
                                                                    : 'Head of Department'}{' '}
                                                                approval.
                                                            </p>
                                                            {ticket
                                                                .current_approval
                                                                .approver && (
                                                                <div className="flex items-start gap-2.5 text-sm">
                                                                    <UserAvatar
                                                                        user={
                                                                            ticket
                                                                                .current_approval
                                                                                .approver
                                                                        }
                                                                        size="sm"
                                                                        className="mt-0.5 shrink-0"
                                                                    />
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">
                                                                            Assigned
                                                                            to:
                                                                        </span>{' '}
                                                                        <span className="font-semibold text-foreground">
                                                                            {
                                                                                ticket
                                                                                    .current_approval
                                                                                    .approver
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                        {ticket
                                                                            .current_approval
                                                                            .approver
                                                                            .email && (
                                                                            <span className="ml-1 text-muted-foreground">
                                                                                (
                                                                                {
                                                                                    ticket
                                                                                        .current_approval
                                                                                        .approver
                                                                                        .email
                                                                                }

                                                                                )
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {ticket.current_approval
                                                    .can_approve && (
                                                    <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[200px] lg:shrink-0">
                                                        <Button
                                                            size="default"
                                                            onClick={() => {
                                                                setSelectedApprovalId(
                                                                    ticket
                                                                        .current_approval!
                                                                        .id,
                                                                );
                                                                setApprovalDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            className="bg-emerald-600 text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Approve Ticket
                                                        </Button>
                                                        <Button
                                                            size="default"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                setSelectedApprovalId(
                                                                    ticket
                                                                        .current_approval!
                                                                        .id,
                                                                );
                                                                setRejectDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            className="shadow-md transition-all hover:shadow-lg"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Reject Ticket
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {/* Rejected Ticket */}
                            {ticket.rejected_approval &&
                                ticket.status === 'cancelled' && (
                                    <Card className="border-0 bg-red-50/50 shadow-sm dark:bg-red-950/20">
                                        <CardContent className="p-6">
                                            <div className="mb-4 flex items-start gap-3">
                                                <div className="rounded-lg border border-red-300 bg-red-200/50 p-2">
                                                    <XCircle className="h-5 w-5 text-red-700" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                                        <Badge className="border-red-200 bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-900">
                                                            {ticket
                                                                .rejected_approval
                                                                .approval_level ===
                                                            'lm'
                                                                ? 'Line Manager'
                                                                : 'Head of Department'}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="border-red-200 bg-red-50 text-xs text-red-900"
                                                        >
                                                            Rejected
                                                        </Badge>
                                                    </div>
                                                    <h3 className="mb-3 text-lg font-semibold text-foreground">
                                                        Ticket Rejected
                                                    </h3>
                                                    <div className="space-y-2 text-sm text-red-800">
                                                        <p>
                                                            This ticket was
                                                            rejected by{' '}
                                                            {ticket
                                                                .rejected_approval
                                                                .approval_level ===
                                                            'lm'
                                                                ? 'Line Manager'
                                                                : 'Head of Department'}
                                                            {ticket
                                                                .rejected_approval
                                                                .approver && (
                                                                <>
                                                                    :{' '}
                                                                    <strong className="text-red-900">
                                                                        {
                                                                            ticket
                                                                                .rejected_approval
                                                                                .approver
                                                                                .name
                                                                        }
                                                                    </strong>
                                                                </>
                                                            )}
                                                        </p>
                                                        {ticket
                                                            .rejected_approval
                                                            .rejected_at && (
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-red-700" />
                                                                <span>
                                                                    {new Date(
                                                                        ticket
                                                                            .rejected_approval
                                                                            .rejected_at,
                                                                    ).toLocaleString(
                                                                        'en-US',
                                                                        {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        },
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {ticket.rejected_approval
                                                .comments && (
                                                <div className="mt-4 rounded-lg border border-red-300 bg-red-100/70 p-4">
                                                    <p className="mb-2 text-xs font-semibold tracking-wider text-red-900 uppercase">
                                                        Rejection Reason
                                                    </p>
                                                    <p className="text-sm leading-relaxed break-words text-red-900">
                                                        {
                                                            ticket
                                                                .rejected_approval
                                                                .comments
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {ticket.capabilities.resubmit &&
                                                (() => {
                                                    const rejectedCount =
                                                        ticket.rejected_approval_count ||
                                                        0;
                                                    const maxResubmissions = 3;
                                                    const canResubmit =
                                                        ticket.capabilities
                                                            .resubmit;

                                                    return (
                                                        <div className="mt-4 space-y-3">
                                                            {rejectedCount >
                                                                0 && (
                                                                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50/50 px-3 py-2 text-xs text-red-700">
                                                                    <span className="font-medium">
                                                                        Rejection
                                                                        count:
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-red-300 text-red-800"
                                                                    >
                                                                        {
                                                                            rejectedCount
                                                                        }{' '}
                                                                        of{' '}
                                                                        {
                                                                            maxResubmissions
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {!canResubmit && (
                                                                <div className="rounded-lg border border-yellow-300 bg-yellow-50/80 p-3">
                                                                    <p className="text-sm break-words text-yellow-900">
                                                                        <strong className="font-semibold">
                                                                            Resubmission
                                                                            limit
                                                                            reached:
                                                                        </strong>{' '}
                                                                        This
                                                                        ticket
                                                                        has been
                                                                        rejected{' '}
                                                                        {
                                                                            rejectedCount
                                                                        }{' '}
                                                                        times.
                                                                        Maximum
                                                                        resubmission
                                                                        limit (
                                                                        {
                                                                            maxResubmissions
                                                                        }
                                                                        ) has
                                                                        been
                                                                        reached.
                                                                        Please
                                                                        create a
                                                                        new
                                                                        ticket
                                                                        or
                                                                        contact
                                                                        an
                                                                        administrator.
                                                                    </p>
                                                                </div>
                                                            )}
                                                            <AlertDialog>
                                                                <AlertDialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        size="default"
                                                                        variant="outline"
                                                                        className="border-emerald-300 text-emerald-700 shadow-sm hover:border-emerald-400 hover:bg-emerald-50"
                                                                        disabled={
                                                                            !canResubmit
                                                                        }
                                                                    >
                                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                                        Resubmit
                                                                        for
                                                                        Approval
                                                                        {rejectedCount >
                                                                            0 && (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="ml-2 border-emerald-300 text-emerald-700"
                                                                            >
                                                                                {
                                                                                    rejectedCount
                                                                                }

                                                                                /
                                                                                {
                                                                                    maxResubmissions
                                                                                }
                                                                            </Badge>
                                                                        )}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                {canResubmit && (
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Resubmit
                                                                                Ticket
                                                                                for
                                                                                Approval?
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This
                                                                                will
                                                                                reopen
                                                                                the
                                                                                ticket
                                                                                and
                                                                                resubmit
                                                                                it
                                                                                for
                                                                                approval.
                                                                                The
                                                                                ticket
                                                                                status
                                                                                will
                                                                                be
                                                                                changed
                                                                                from
                                                                                "cancelled"
                                                                                to
                                                                                "open"
                                                                                and
                                                                                a
                                                                                new
                                                                                approval
                                                                                request
                                                                                will
                                                                                be
                                                                                created.
                                                                                {rejectedCount >
                                                                                    0 && (
                                                                                    <span className="mt-2 block text-amber-600">
                                                                                        <strong>
                                                                                            Note:
                                                                                        </strong>{' '}
                                                                                        This
                                                                                        is
                                                                                        attempt{' '}
                                                                                        {rejectedCount +
                                                                                            1}{' '}
                                                                                        of{' '}
                                                                                        {maxResubmissions +
                                                                                            1}{' '}
                                                                                        total
                                                                                        attempts.
                                                                                    </span>
                                                                                )}
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>
                                                                                Cancel
                                                                            </AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => {
                                                                                    router.post(
                                                                                        route(
                                                                                            'admin.tickets.resubmit',
                                                                                            {
                                                                                                ticket: ticket.id,
                                                                                            },
                                                                                        ),
                                                                                        {},
                                                                                        {
                                                                                            onSuccess:
                                                                                                () => {
                                                                                                    // Success handled by flash message
                                                                                                },
                                                                                            onError:
                                                                                                (
                                                                                                    errors,
                                                                                                ) => {
                                                                                                    // Error handled by flash message
                                                                                                },
                                                                                        },
                                                                                    );
                                                                                }}
                                                                                className="bg-green-600 hover:bg-green-700"
                                                                            >
                                                                                Resubmit
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                )}
                                                            </AlertDialog>
                                                        </div>
                                                    );
                                                })()}
                                        </CardContent>
                                    </Card>
                                )}

                            {ticket.resolution_summary && (
                                <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            Resolution Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {ticket.resolution_summary}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Comments Section */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg font-semibold">
                                                Comments
                                            </CardTitle>
                                            <Badge variant="outline">
                                                {ticket.comments?.length ?? 0}
                                            </Badge>
                                        </div>
                                        {ticket.capabilities.manage_comments &&
                                            (ticket.comments?.length ?? 0) >
                                                0 && (
                                                <div className="flex items-center gap-2">
                                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex gap-1 rounded-md border p-0.5">
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                commentFilter ===
                                                                'all'
                                                                    ? 'default'
                                                                    : 'ghost'
                                                            }
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() =>
                                                                setCommentFilter(
                                                                    'all',
                                                                )
                                                            }
                                                        >
                                                            All
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                commentFilter ===
                                                                'public'
                                                                    ? 'default'
                                                                    : 'ghost'
                                                            }
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() =>
                                                                setCommentFilter(
                                                                    'public',
                                                                )
                                                            }
                                                        >
                                                            Public
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                commentFilter ===
                                                                'internal'
                                                                    ? 'default'
                                                                    : 'ghost'
                                                            }
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() =>
                                                                setCommentFilter(
                                                                    'internal',
                                                                )
                                                            }
                                                        >
                                                            Internal
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Add Comment Form */}
                                    {ticket.capabilities.comment && (
                                        <div className="rounded-lg border bg-muted/30 p-4">
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    commentForm.post(
                                                        route(
                                                            'admin.ticket-comments.store',
                                                            ticket.id,
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                commentForm.reset();
                                                                commentForm.setData(
                                                                    'parent_id',
                                                                    null,
                                                                );
                                                                setReplyingToCommentId(
                                                                    null,
                                                                );
                                                            },
                                                        },
                                                    );
                                                }}
                                                className="space-y-3"
                                            >
                                                <div>
                                                    <Textarea
                                                        placeholder="Add a comment..."
                                                        value={
                                                            commentForm.data
                                                                .body
                                                        }
                                                        onChange={(e) =>
                                                            commentForm.setData(
                                                                'body',
                                                                e.target.value,
                                                            )
                                                        }
                                                        rows={3}
                                                        className="resize-none text-sm"
                                                    />
                                                    {commentForm.errors
                                                        .body && (
                                                        <p className="mt-1 text-xs text-destructive">
                                                            {
                                                                commentForm
                                                                    .errors.body
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {ticket.capabilities
                                                            .manage_comments && (
                                                            <>
                                                                <Checkbox
                                                                    id="internal-comment"
                                                                    checked={
                                                                        commentForm
                                                                            .data
                                                                            .is_internal
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) =>
                                                                        commentForm.setData(
                                                                            'is_internal',
                                                                            checked ===
                                                                                true,
                                                                        )
                                                                    }
                                                                />
                                                                <Label
                                                                    htmlFor="internal-comment"
                                                                    className="cursor-pointer text-xs text-muted-foreground"
                                                                >
                                                                    Internal
                                                                    (only
                                                                    visible to
                                                                    agents)
                                                                </Label>
                                                            </>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={
                                                            commentForm.processing ||
                                                            !commentForm.data.body.trim()
                                                        }
                                                        className="w-full sm:w-auto"
                                                    >
                                                        <Send className="mr-2 h-4 w-4" />
                                                        {commentForm.processing
                                                            ? 'Posting...'
                                                            : 'Post Comment'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {(ticket.comments?.length ?? 0) === 0 && (
                                        <div className="rounded-lg border bg-muted/20 py-8 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                No comments yet.
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        {(
                                            (ticket.comments ?? []).filter(
                                                (c: any) => {
                                                    // Filter by parent_id first
                                                    if (c.parent_id)
                                                        return false;
                                                    // Then filter by comment filter
                                                    if (
                                                        commentFilter ===
                                                        'internal'
                                                    )
                                                        return (
                                                            c.is_internal ===
                                                            true
                                                        );
                                                    if (
                                                        commentFilter ===
                                                        'public'
                                                    )
                                                        return (
                                                            c.is_internal ===
                                                            false
                                                        );
                                                    return true; // 'all'
                                                },
                                            ) as any[]
                                        ).map((comment) => (
                                            <div
                                                key={comment.id}
                                                className={cn(
                                                    'rounded-lg border p-4 transition-colors',
                                                    comment.is_internal
                                                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                                                        : 'bg-card',
                                                )}
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        {comment.user && (
                                                            <UserAvatar
                                                                user={
                                                                    comment.user
                                                                }
                                                                size="sm"
                                                            />
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold">
                                                                {comment.user
                                                                    ?.name ??
                                                                    'System'}
                                                            </span>
                                                            {comment.is_internal && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    Internal
                                                                </Badge>
                                                            )}
                                                            {comment.type && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs capitalize"
                                                                >
                                                                    {
                                                                        comment.type
                                                                    }
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(
                                                                comment.created_at,
                                                            ).toLocaleString()}
                                                        </span>
                                                        {canEditComment(
                                                            comment,
                                                        ) && (
                                                            <div className="flex items-center gap-1">
                                                                {editingCommentId ===
                                                                comment.id ? (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleSaveComment(
                                                                                    comment.id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                editCommentForm.processing
                                                                            }
                                                                            className="h-7 w-7 p-0"
                                                                        >
                                                                            <Check className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={
                                                                                handleCancelEdit
                                                                            }
                                                                            disabled={
                                                                                editCommentForm.processing
                                                                            }
                                                                            className="h-7 w-7 p-0"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleEditComment(
                                                                                    comment,
                                                                                )
                                                                            }
                                                                            className="h-7 w-7 p-0"
                                                                        >
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                        <AlertDialog
                                                                            open={
                                                                                deleteCommentDialogOpen ===
                                                                                comment.id
                                                                            }
                                                                            onOpenChange={(
                                                                                open,
                                                                            ) => {
                                                                                if (
                                                                                    !open
                                                                                ) {
                                                                                    setDeleteCommentDialogOpen(
                                                                                        null,
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <AlertDialogTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        setDeleteCommentDialogOpen(
                                                                                            comment.id,
                                                                                        )
                                                                                    }
                                                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>
                                                                                        Delete
                                                                                        Comment
                                                                                    </AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Are
                                                                                        you
                                                                                        sure
                                                                                        you
                                                                                        want
                                                                                        to
                                                                                        delete
                                                                                        this
                                                                                        comment?
                                                                                        This
                                                                                        action
                                                                                        cannot
                                                                                        be
                                                                                        undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>
                                                                                        Cancel
                                                                                    </AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => {
                                                                                            router.delete(
                                                                                                route(
                                                                                                    'admin.ticket-comments.destroy',
                                                                                                    {
                                                                                                        ticket: ticket.id,
                                                                                                        comment:
                                                                                                            comment.id,
                                                                                                    },
                                                                                                ),
                                                                                                {
                                                                                                    preserveScroll: true,
                                                                                                    onSuccess:
                                                                                                        () => {
                                                                                                            setDeleteCommentDialogOpen(
                                                                                                                null,
                                                                                                            );
                                                                                                        },
                                                                                                },
                                                                                            );
                                                                                        }}
                                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                    >
                                                                                        Delete
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {editingCommentId ===
                                                comment.id ? (
                                                    <div className="space-y-2">
                                                        <Textarea
                                                            value={
                                                                editCommentForm
                                                                    .data.body
                                                            }
                                                            onChange={(e) =>
                                                                editCommentForm.setData(
                                                                    'body',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            rows={3}
                                                            className="resize-none"
                                                        />
                                                        {editCommentForm.errors
                                                            .body && (
                                                            <p className="text-xs text-destructive">
                                                                {
                                                                    editCommentForm
                                                                        .errors
                                                                        .body
                                                                }
                                                            </p>
                                                        )}
                                                        {ticket.capabilities
                                                            .manage_comments && (
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`edit-internal-${comment.id}`}
                                                                    checked={
                                                                        editCommentForm
                                                                            .data
                                                                            .is_internal
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) =>
                                                                        editCommentForm.setData(
                                                                            'is_internal',
                                                                            checked ===
                                                                                true,
                                                                        )
                                                                    }
                                                                />
                                                                <Label
                                                                    htmlFor={`edit-internal-${comment.id}`}
                                                                    className="cursor-pointer text-xs text-muted-foreground"
                                                                >
                                                                    Internal
                                                                    (only
                                                                    visible to
                                                                    agents)
                                                                </Label>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm leading-relaxed whitespace-pre-line">
                                                            {comment.body}
                                                        </p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setReplyingToCommentId(
                                                                        comment.id,
                                                                    );
                                                                    commentForm.setData(
                                                                        'parent_id',
                                                                        comment.id,
                                                                    );
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                <Reply className="mr-1 h-3 w-3" />
                                                                Reply
                                                            </Button>
                                                            {comment.replies &&
                                                                (
                                                                    comment.replies as any[]
                                                                ).length >
                                                                    0 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {
                                                                            (
                                                                                comment.replies as any[]
                                                                            )
                                                                                .length
                                                                        }{' '}
                                                                        {(
                                                                            comment.replies as any[]
                                                                        )
                                                                            .length ===
                                                                        1
                                                                            ? 'reply'
                                                                            : 'replies'}
                                                                    </span>
                                                                )}
                                                        </div>
                                                        {/* Display replies */}
                                                        {comment.replies &&
                                                            (
                                                                comment.replies as any[]
                                                            ).length > 0 && (
                                                                <div className="mt-3 ml-6 space-y-2 border-l-2 border-muted pl-4">
                                                                    {(
                                                                        comment.replies as any[]
                                                                    ).map(
                                                                        (
                                                                            reply: any,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    reply.id
                                                                                }
                                                                                className={cn(
                                                                                    'rounded-lg border p-3 text-sm',
                                                                                    reply.is_internal
                                                                                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                                                                                        : 'bg-muted/30',
                                                                                )}
                                                                            >
                                                                                <div className="mb-1 flex items-center justify-between">
                                                                                    <div className="flex items-center gap-2">
                                                                                        {reply.user && (
                                                                                            <UserAvatar
                                                                                                user={
                                                                                                    reply.user
                                                                                                }
                                                                                                size="xs"
                                                                                            />
                                                                                        )}
                                                                                        <span className="text-xs font-semibold">
                                                                                            {reply
                                                                                                .user
                                                                                                ?.name ??
                                                                                                'System'}
                                                                                        </span>
                                                                                        {reply.is_internal && (
                                                                                            <Badge
                                                                                                variant="secondary"
                                                                                                className="text-xs"
                                                                                            >
                                                                                                Internal
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {new Date(
                                                                                            reply.created_at,
                                                                                        ).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-xs leading-relaxed whitespace-pre-line">
                                                                                    {
                                                                                        reply.body
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        {/* Reply form */}
                                                        {replyingToCommentId ===
                                                            comment.id && (
                                                            <div className="mt-3 ml-6 border-l-2 border-primary pl-4">
                                                                <form
                                                                    onSubmit={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        commentForm.post(
                                                                            route(
                                                                                'admin.ticket-comments.store',
                                                                                ticket.id,
                                                                            ),
                                                                            {
                                                                                preserveScroll: true,
                                                                                onSuccess:
                                                                                    () => {
                                                                                        commentForm.reset();
                                                                                        setReplyingToCommentId(
                                                                                            null,
                                                                                        );
                                                                                    },
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="space-y-2"
                                                                >
                                                                    <Textarea
                                                                        placeholder="Write a reply..."
                                                                        value={
                                                                            commentForm
                                                                                .data
                                                                                .body
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            commentForm.setData(
                                                                                'body',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        rows={2}
                                                                        className="resize-none text-sm"
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex items-center justify-between">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setReplyingToCommentId(
                                                                                    null,
                                                                                );
                                                                                commentForm.setData(
                                                                                    'parent_id',
                                                                                    null,
                                                                                );
                                                                                commentForm.setData(
                                                                                    'body',
                                                                                    '',
                                                                                );
                                                                            }}
                                                                            className="h-7 text-xs"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            type="submit"
                                                                            size="sm"
                                                                            disabled={
                                                                                commentForm.processing ||
                                                                                !commentForm.data.body.trim()
                                                                            }
                                                                            className="h-7 text-xs"
                                                                        >
                                                                            <Send className="mr-1 h-3 w-3" />
                                                                            {commentForm.processing
                                                                                ? 'Posting...'
                                                                                : 'Reply'}
                                                                        </Button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Attachments Section */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                                            <CardTitle className="text-lg font-semibold">
                                                Attachments
                                            </CardTitle>
                                            <Badge variant="outline">
                                                {ticket.attachments?.length ??
                                                    0}
                                            </Badge>
                                        </div>
                                        {can('tickets.edit') && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    disabled={uploadingFiles}
                                                    className="h-8"
                                                >
                                                    <Upload className="mr-2 h-3 w-3" />
                                                    Add Files
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Selected Files Preview */}
                                    {selectedFiles.length > 0 && (
                                        <div className="mb-4 space-y-2 rounded-lg border bg-muted/30 p-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">
                                                    Selected Files (
                                                    {selectedFiles.length})
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={handleFileUpload}
                                                    disabled={uploadingFiles}
                                                    className="h-8"
                                                >
                                                    {uploadingFiles ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-3 w-3" />
                                                            Upload All
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="space-y-1.5">
                                                {selectedFiles.map(
                                                    (file, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm"
                                                        >
                                                            <Paperclip className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                            <span className="min-w-0 flex-1 truncate">
                                                                {file.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {(
                                                                    file.size /
                                                                    1024
                                                                ).toFixed(
                                                                    1,
                                                                )}{' '}
                                                                KB
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleFileRemove(
                                                                        index,
                                                                    )
                                                                }
                                                                disabled={
                                                                    uploadingFiles
                                                                }
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {(ticket.attachments?.length ?? 0) === 0 ? (
                                        <div className="rounded-lg border bg-muted/20 py-8 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                No attachments uploaded.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {(ticket.attachments ?? []).map(
                                                (
                                                    attachment: TicketAttachment,
                                                ) => {
                                                    const isImage =
                                                        attachment.mime_type?.startsWith(
                                                            'image/',
                                                        );
                                                    const imageUrl = isImage
                                                        ? route(
                                                              'admin.ticket-attachments.download',
                                                              attachment.id,
                                                          )
                                                        : null;

                                                    return (
                                                        <div
                                                            key={attachment.id}
                                                            className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
                                                        >
                                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                {isImage &&
                                                                    imageUrl && (
                                                                        <div className="flex-shrink-0">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setPreviewImageUrl(
                                                                                        imageUrl,
                                                                                    );
                                                                                    setPreviewImageName(
                                                                                        attachment.original_filename,
                                                                                    );
                                                                                    setImagePreviewOpen(
                                                                                        true,
                                                                                    );
                                                                                }}
                                                                                className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted transition-opacity hover:opacity-80 sm:h-16 sm:w-16"
                                                                            >
                                                                                <img
                                                                                    src={
                                                                                        imageUrl
                                                                                    }
                                                                                    alt={
                                                                                        attachment.original_filename
                                                                                    }
                                                                                    className="h-full w-full object-cover"
                                                                                    onError={(
                                                                                        e,
                                                                                    ) => {
                                                                                        // Hide image if it fails to load
                                                                                        (
                                                                                            e.target as HTMLImageElement
                                                                                        ).style.display =
                                                                                            'none';
                                                                                    }}
                                                                                />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium">
                                                                        {
                                                                            attachment.original_filename
                                                                        }
                                                                    </p>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {
                                                                                attachment.mime_type
                                                                            }
                                                                        </p>
                                                                        <span className="hidden text-xs text-muted-foreground sm:inline">
                                                                            ·
                                                                        </span>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {(
                                                                                attachment.file_size /
                                                                                1024
                                                                            ).toFixed(
                                                                                1,
                                                                            )}{' '}
                                                                            KB
                                                                        </p>
                                                                        {attachment.uploader && (
                                                                            <>
                                                                                <span className="hidden text-xs text-muted-foreground sm:inline">
                                                                                    ·
                                                                                </span>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    by{' '}
                                                                                    {
                                                                                        attachment
                                                                                            .uploader
                                                                                            .name
                                                                                    }
                                                                                </p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex w-full items-center gap-2 sm:w-auto">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    asChild
                                                                    className="flex-1 sm:flex-initial"
                                                                >
                                                                    <a
                                                                        href={route(
                                                                            'admin.ticket-attachments.download',
                                                                            attachment.id,
                                                                        )}
                                                                        download
                                                                    >
                                                                        Download
                                                                    </a>
                                                                </Button>
                                                                {can(
                                                                    'tickets.edit',
                                                                ) && (
                                                                    <AlertDialog
                                                                        open={
                                                                            deleteAttachmentDialogOpen ===
                                                                            attachment.id
                                                                        }
                                                                        onOpenChange={(
                                                                            open,
                                                                        ) => {
                                                                            if (
                                                                                !open
                                                                            ) {
                                                                                setDeleteAttachmentDialogOpen(
                                                                                    null,
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <AlertDialogTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    setDeleteAttachmentDialogOpen(
                                                                                        attachment.id,
                                                                                    )
                                                                                }
                                                                                className="flex-1 sm:flex-initial"
                                                                            >
                                                                                Delete
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    Delete
                                                                                    Attachment
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Are
                                                                                    you
                                                                                    sure
                                                                                    you
                                                                                    want
                                                                                    to
                                                                                    delete
                                                                                    "
                                                                                    {
                                                                                        attachment.original_filename
                                                                                    }
                                                                                    "?
                                                                                    This
                                                                                    action
                                                                                    cannot
                                                                                    be
                                                                                    undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>
                                                                                    Cancel
                                                                                </AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => {
                                                                                        router.delete(
                                                                                            route(
                                                                                                'admin.ticket-attachments.destroy',
                                                                                                attachment.id,
                                                                                            ),
                                                                                            {
                                                                                                preserveScroll: true,
                                                                                                onSuccess:
                                                                                                    () => {
                                                                                                        setDeleteAttachmentDialogOpen(
                                                                                                            null,
                                                                                                        );
                                                                                                    },
                                                                                            },
                                                                                        );
                                                                                    }}
                                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                >
                                                                                    Delete
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Activity Timeline */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle className="text-lg font-semibold">
                                            Activity Timeline
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className="ml-auto"
                                        >
                                            {ticket.histories?.length ?? 0}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {(ticket.histories?.length ?? 0) === 0 ? (
                                        <div className="rounded-lg border bg-muted/20 py-8 text-center">
                                            <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground opacity-50" />
                                            <p className="text-sm text-muted-foreground">
                                                No activity recorded yet.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-gradient-to-b from-primary/30 via-border to-transparent sm:left-[17px]" />
                                            <div className="space-y-1">
                                                {(ticket.histories ?? [])
                                                    .slice(0, 10)
                                                    .map((history: any) => {
                                                        const getActionIcon = (
                                                            action: string,
                                                        ) => {
                                                            switch (action) {
                                                                case 'status_changed':
                                                                    return {
                                                                        icon: (
                                                                            <TrendingUp className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-blue-100 dark:bg-blue-950 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400',
                                                                    };
                                                                case 'assigned':
                                                                    return {
                                                                        icon: (
                                                                            <UserPlus className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-violet-100 dark:bg-violet-950 border-violet-400 dark:border-violet-600 text-violet-600 dark:text-violet-400',
                                                                    };
                                                                case 'priority_changed':
                                                                    return {
                                                                        icon: (
                                                                            <TrendingDown className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-amber-100 dark:bg-amber-950 border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400',
                                                                    };
                                                                case 'approval_requested':
                                                                    return {
                                                                        icon: (
                                                                            <Shield className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-orange-100 dark:bg-orange-950 border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400',
                                                                    };
                                                                case 'approved':
                                                                case 'auto_approved':
                                                                    return {
                                                                        icon: (
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400',
                                                                    };
                                                                case 'rejected':
                                                                    return {
                                                                        icon: (
                                                                            <XCircle className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-red-100 dark:bg-red-950 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400',
                                                                    };
                                                                case 'routed':
                                                                    return {
                                                                        icon: (
                                                                            <ArrowRight className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-cyan-100 dark:bg-cyan-950 border-cyan-400 dark:border-cyan-600 text-cyan-600 dark:text-cyan-400',
                                                                    };
                                                                default:
                                                                    if (
                                                                        action.startsWith(
                                                                            'system_',
                                                                        )
                                                                    )
                                                                        return {
                                                                            icon: (
                                                                                <Zap className="h-3 w-3" />
                                                                            ),
                                                                            cls: 'bg-indigo-100 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400',
                                                                        };
                                                                    return {
                                                                        icon: (
                                                                            <Clock className="h-3 w-3" />
                                                                        ),
                                                                        cls: 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400',
                                                                    };
                                                            }
                                                        };
                                                        const s = getActionIcon(
                                                            history.action,
                                                        );
                                                        return (
                                                            <div
                                                                key={history.id}
                                                                className="relative flex gap-3 py-1.5"
                                                            >
                                                                <div
                                                                    className={`relative z-10 h-[32px] w-[32px] flex-shrink-0 rounded-full ${s.cls} flex items-center justify-center border-2 shadow-sm`}
                                                                >
                                                                    {s.icon}
                                                                </div>
                                                                <div className="min-w-0 flex-1 pt-1">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="truncate text-xs font-medium">
                                                                            {history
                                                                                .user
                                                                                ?.name ??
                                                                                'System'}
                                                                        </span>
                                                                        <span className="flex-shrink-0 text-[10px] text-muted-foreground tabular-nums">
                                                                            {new Date(
                                                                                history.created_at,
                                                                            ).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                    <p className="truncate text-xs text-muted-foreground capitalize">
                                                                        {history.action.replace(
                                                                            /_/g,
                                                                            ' ',
                                                                        )}
                                                                    </p>
                                                                    {history.field_name && (
                                                                        <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                                                                            <span className="text-red-600 line-through">
                                                                                {history.old_value ??
                                                                                    '—'}
                                                                            </span>
                                                                            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                                                                            <span className="font-medium text-emerald-600">
                                                                                {history.new_value ??
                                                                                    '—'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                {(ticket.histories?.length ??
                                                    0) > 10 && (
                                                    <p className="pt-2 text-center text-xs text-muted-foreground">
                                                        +
                                                        {(ticket.histories
                                                            ?.length ?? 0) -
                                                            10}{' '}
                                                        more events — see
                                                        Activity tab
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar - Quick Actions */}
                        <div className="space-y-6">
                            {(ticket.allowed_statuses.length > 0 ||
                                ticket.capabilities.change_priority ||
                                ticket.capabilities.assign) && (
                                <Card className="sticky top-6">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-lg font-semibold">
                                                Quick Actions
                                            </CardTitle>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Update without leaving page
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Quick Status Change */}
                                        {ticket.allowed_statuses.length > 0 && (
                                            <div>
                                                <Label className="mb-2 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Status
                                                </Label>
                                                <Select
                                                    value={ticket.status}
                                                    onValueChange={(value) => {
                                                        if (
                                                            value === 'resolved'
                                                        ) {
                                                            resolutionForm.setData(
                                                                'resolution_summary',
                                                                ticket.resolution_summary ??
                                                                    '',
                                                            );
                                                            setResolutionDialogOpen(
                                                                true,
                                                            );
                                                            return;
                                                        }

                                                        router.put(
                                                            route(
                                                                'admin.tickets.update',
                                                                {
                                                                    ticket: ticket.id,
                                                                },
                                                            ),
                                                            {
                                                                status: value,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess:
                                                                    () => {
                                                                        toast.success(
                                                                            'Status updated successfully',
                                                                        );
                                                                    },
                                                                onError: (
                                                                    errors,
                                                                ) => {
                                                                    toast.error(
                                                                        errors.status ||
                                                                            'Failed to update status',
                                                                    );
                                                                },
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ticket.allowed_statuses.map(
                                                            (
                                                                status: string,
                                                            ) => (
                                                                <SelectItem
                                                                    key={status}
                                                                    value={
                                                                        status
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            className={cn(
                                                                                'text-xs',
                                                                                statusColorMap[
                                                                                    status
                                                                                ] ??
                                                                                    '',
                                                                            )}
                                                                        >
                                                                            {formatStatus(
                                                                                status,
                                                                            )}
                                                                        </Badge>
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Quick Priority Change */}
                                        {ticket.capabilities
                                            .change_priority && (
                                            <div>
                                                <Label className="mb-2 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Priority
                                                </Label>
                                                <Select
                                                    value={ticket.priority}
                                                    onValueChange={(value) => {
                                                        router.put(
                                                            route(
                                                                'admin.tickets.update',
                                                                {
                                                                    ticket: ticket.id,
                                                                },
                                                            ),
                                                            {
                                                                priority: value,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess:
                                                                    () => {
                                                                        toast.success(
                                                                            'Priority updated successfully',
                                                                        );
                                                                    },
                                                                onError: (
                                                                    errors,
                                                                ) => {
                                                                    toast.error(
                                                                        errors.priority ||
                                                                            'Failed to update priority',
                                                                    );
                                                                },
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[
                                                            'low',
                                                            'medium',
                                                            'high',
                                                            'critical',
                                                        ].map((priority) => (
                                                            <SelectItem
                                                                key={priority}
                                                                value={priority}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        className={cn(
                                                                            'text-xs',
                                                                            priorityColorMap[
                                                                                priority
                                                                            ] ??
                                                                                '',
                                                                        )}
                                                                    >
                                                                        {
                                                                            priority
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Quick Assignment Change */}
                                        {ticket.capabilities.assign &&
                                            ticket.assigned_team && (
                                                <div>
                                                    <Label className="mb-2 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                        Assign Agent
                                                    </Label>
                                                    <Select
                                                        value={
                                                            ticket
                                                                .assigned_agent
                                                                ?.id
                                                                ? String(
                                                                      ticket
                                                                          .assigned_agent
                                                                          .id,
                                                                  )
                                                                : '__unassign'
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            router.put(
                                                                route(
                                                                    'admin.tickets.update',
                                                                    {
                                                                        ticket: ticket.id,
                                                                    },
                                                                ),
                                                                {
                                                                    assigned_agent_id:
                                                                        value ===
                                                                        '__unassign'
                                                                            ? null
                                                                            : parseInt(
                                                                                  value,
                                                                              ),
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () => {
                                                                            toast.success(
                                                                                'Assignment updated successfully',
                                                                            );
                                                                        },
                                                                    onError: (
                                                                        errors,
                                                                    ) => {
                                                                        toast.error(
                                                                            errors.assigned_agent_id ||
                                                                                'Failed to update assignment',
                                                                        );
                                                                    },
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Unassigned" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__unassign">
                                                                Unassigned
                                                            </SelectItem>
                                                            {agents.length >
                                                            0 ? (
                                                                agents.map(
                                                                    (
                                                                        agent: any,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                agent.id
                                                                            }
                                                                            value={String(
                                                                                agent.id,
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                {agent.avatar ? (
                                                                                    <img
                                                                                        src={
                                                                                            agent.avatar
                                                                                        }
                                                                                        alt={
                                                                                            agent.name
                                                                                        }
                                                                                        className="h-4 w-4 rounded-full"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-xs">
                                                                                        {agent.name
                                                                                            .charAt(
                                                                                                0,
                                                                                            )
                                                                                            .toUpperCase()}
                                                                                    </div>
                                                                                )}
                                                                                <span>
                                                                                    {
                                                                                        agent.name
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <SelectItem
                                                                    value="__no_agents"
                                                                    disabled
                                                                >
                                                                    No agents
                                                                    available
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {agents.length === 0 && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            No agents in{' '}
                                                            {
                                                                ticket
                                                                    .assigned_team
                                                                    ?.name
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        {/* SLA Information */}
                                        {(ticket.first_response_due_at ||
                                            ticket.resolution_due_at) && (
                                            <div className="border-t pt-4">
                                                <Label className="mb-3 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    SLA Status
                                                </Label>
                                                <div className="space-y-3">
                                                    {ticket.first_response_due_at && (
                                                        <div className="rounded-lg border bg-muted/30 p-3">
                                                            <div className="mb-1 flex items-center justify-between">
                                                                <span className="text-xs font-medium">
                                                                    First
                                                                    Response
                                                                </span>
                                                                {ticket.response_sla_breached && (
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="text-xs"
                                                                    >
                                                                        Breached
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Timer className="h-3 w-3" />
                                                                <span>
                                                                    Due:{' '}
                                                                    {new Date(
                                                                        ticket.first_response_due_at,
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {ticket.first_response_at && (
                                                                <div className="mt-1 text-xs text-emerald-600">
                                                                    ✓ Responded:{' '}
                                                                    {new Date(
                                                                        ticket.first_response_at,
                                                                    ).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {ticket.resolution_due_at && (
                                                        <div className="rounded-lg border bg-muted/30 p-3">
                                                            <div className="mb-1 flex items-center justify-between">
                                                                <span className="text-xs font-medium">
                                                                    Resolution
                                                                </span>
                                                                {ticket.resolution_sla_breached && (
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="text-xs"
                                                                    >
                                                                        Breached
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Timer className="h-3 w-3" />
                                                                <span>
                                                                    Due:{' '}
                                                                    {new Date(
                                                                        ticket.resolution_due_at,
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {ticket.resolved_at && (
                                                                <div className="mt-1 text-xs text-emerald-600">
                                                                    ✓ Resolved:{' '}
                                                                    {new Date(
                                                                        ticket.resolved_at,
                                                                    ).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-lg font-semibold">
                                        Comments
                                    </CardTitle>
                                    <Badge variant="outline">
                                        {ticket.comments?.length ?? 0}
                                    </Badge>
                                </div>
                                {ticket.capabilities.manage_comments &&
                                    (ticket.comments?.length ?? 0) > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex gap-1 rounded-md border p-0.5">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        commentFilter === 'all'
                                                            ? 'default'
                                                            : 'ghost'
                                                    }
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() =>
                                                        setCommentFilter('all')
                                                    }
                                                >
                                                    All
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        commentFilter ===
                                                        'public'
                                                            ? 'default'
                                                            : 'ghost'
                                                    }
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() =>
                                                        setCommentFilter(
                                                            'public',
                                                        )
                                                    }
                                                >
                                                    Public
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        commentFilter ===
                                                        'internal'
                                                            ? 'default'
                                                            : 'ghost'
                                                    }
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() =>
                                                        setCommentFilter(
                                                            'internal',
                                                        )
                                                    }
                                                >
                                                    Internal
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Comment Form */}
                            {ticket.capabilities.comment && (
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            commentForm.post(
                                                route(
                                                    'admin.ticket-comments.store',
                                                    ticket.id,
                                                ),
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        commentForm.reset();
                                                        commentForm.setData(
                                                            'parent_id',
                                                            null,
                                                        );
                                                        setReplyingToCommentId(
                                                            null,
                                                        );
                                                    },
                                                },
                                            );
                                        }}
                                        className="space-y-3"
                                    >
                                        <div>
                                            <Textarea
                                                placeholder="Add a comment..."
                                                value={commentForm.data.body}
                                                onChange={(e) =>
                                                    commentForm.setData(
                                                        'body',
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="resize-none text-sm"
                                            />
                                            {commentForm.errors.body && (
                                                <p className="mt-1 text-xs text-destructive">
                                                    {commentForm.errors.body}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center space-x-2">
                                                {ticket.capabilities
                                                    .manage_comments && (
                                                    <>
                                                        <Checkbox
                                                            id="internal-comment"
                                                            checked={
                                                                commentForm.data
                                                                    .is_internal
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                commentForm.setData(
                                                                    'is_internal',
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor="internal-comment"
                                                            className="cursor-pointer text-xs text-muted-foreground"
                                                        >
                                                            Internal (only
                                                            visible to agents)
                                                        </Label>
                                                    </>
                                                )}
                                            </div>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={
                                                    commentForm.processing ||
                                                    !commentForm.data.body.trim()
                                                }
                                                className="w-full sm:w-auto"
                                            >
                                                <Send className="mr-2 h-4 w-4" />
                                                {commentForm.processing
                                                    ? 'Posting...'
                                                    : 'Post Comment'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {(ticket.comments?.length ?? 0) === 0 && (
                                <div className="rounded-lg border bg-muted/20 py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No comments yet.
                                    </p>
                                </div>
                            )}
                            <div className="space-y-3">
                                {(
                                    (ticket.comments ?? []).filter((c: any) => {
                                        if (c.parent_id) return false;
                                        if (commentFilter === 'internal')
                                            return c.is_internal === true;
                                        if (commentFilter === 'public')
                                            return c.is_internal === false;
                                        return true;
                                    }) as any[]
                                ).map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={cn(
                                            'rounded-lg border p-4 transition-colors',
                                            comment.is_internal
                                                ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                                                : 'bg-card',
                                        )}
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                {comment.user && (
                                                    <UserAvatar
                                                        user={comment.user}
                                                        size="sm"
                                                    />
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">
                                                        {comment.user?.name ??
                                                            'System'}
                                                    </span>
                                                    {comment.is_internal && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            Internal
                                                        </Badge>
                                                    )}
                                                    {comment.type && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs capitalize"
                                                        >
                                                            {comment.type}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(
                                                        comment.created_at,
                                                    ).toLocaleString()}
                                                </span>
                                                {canEditComment(comment) && (
                                                    <div className="flex items-center gap-1">
                                                        {editingCommentId ===
                                                        comment.id ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleSaveComment(
                                                                            comment.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        editCommentForm.processing
                                                                    }
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={
                                                                        handleCancelEdit
                                                                    }
                                                                    disabled={
                                                                        editCommentForm.processing
                                                                    }
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleEditComment(
                                                                            comment,
                                                                        )
                                                                    }
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <AlertDialog
                                                                    open={
                                                                        deleteCommentDialogOpen ===
                                                                        comment.id
                                                                    }
                                                                    onOpenChange={(
                                                                        open,
                                                                    ) => {
                                                                        if (
                                                                            !open
                                                                        ) {
                                                                            setDeleteCommentDialogOpen(
                                                                                null,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <AlertDialogTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                setDeleteCommentDialogOpen(
                                                                                    comment.id,
                                                                                )
                                                                            }
                                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Delete
                                                                                Comment
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are
                                                                                you
                                                                                sure
                                                                                you
                                                                                want
                                                                                to
                                                                                delete
                                                                                this
                                                                                comment?
                                                                                This
                                                                                action
                                                                                cannot
                                                                                be
                                                                                undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>
                                                                                Cancel
                                                                            </AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => {
                                                                                    router.delete(
                                                                                        route(
                                                                                            'admin.ticket-comments.destroy',
                                                                                            {
                                                                                                ticket: ticket.id,
                                                                                                comment:
                                                                                                    comment.id,
                                                                                            },
                                                                                        ),
                                                                                        {
                                                                                            preserveScroll: true,
                                                                                            onSuccess:
                                                                                                () => {
                                                                                                    setDeleteCommentDialogOpen(
                                                                                                        null,
                                                                                                    );
                                                                                                },
                                                                                        },
                                                                                    );
                                                                                }}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {editingCommentId === comment.id ? (
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={
                                                        editCommentForm.data
                                                            .body
                                                    }
                                                    onChange={(e) =>
                                                        editCommentForm.setData(
                                                            'body',
                                                            e.target.value,
                                                        )
                                                    }
                                                    rows={3}
                                                    className="resize-none"
                                                />
                                                {editCommentForm.errors
                                                    .body && (
                                                    <p className="text-xs text-destructive">
                                                        {
                                                            editCommentForm
                                                                .errors.body
                                                        }
                                                    </p>
                                                )}
                                                {ticket.capabilities
                                                    .manage_comments && (
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`edit-internal-${comment.id}`}
                                                            checked={
                                                                editCommentForm
                                                                    .data
                                                                    .is_internal
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                editCommentForm.setData(
                                                                    'is_internal',
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`edit-internal-${comment.id}`}
                                                            className="cursor-pointer text-xs text-muted-foreground"
                                                        >
                                                            Internal (only
                                                            visible to agents)
                                                        </Label>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm leading-relaxed whitespace-pre-line">
                                                    {comment.body}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setReplyingToCommentId(
                                                                comment.id,
                                                            );
                                                            commentForm.setData(
                                                                'parent_id',
                                                                comment.id,
                                                            );
                                                        }}
                                                        className="h-7 text-xs"
                                                    >
                                                        <Reply className="mr-1 h-3 w-3" />
                                                        Reply
                                                    </Button>
                                                    {comment.replies &&
                                                        (
                                                            comment.replies as any[]
                                                        ).length > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    (
                                                                        comment.replies as any[]
                                                                    ).length
                                                                }{' '}
                                                                {(
                                                                    comment.replies as any[]
                                                                ).length === 1
                                                                    ? 'reply'
                                                                    : 'replies'}
                                                            </span>
                                                        )}
                                                </div>
                                                {/* Display replies */}
                                                {comment.replies &&
                                                    (comment.replies as any[])
                                                        .length > 0 && (
                                                        <div className="mt-3 ml-6 space-y-2 border-l-2 border-muted pl-4">
                                                            {(
                                                                comment.replies as any[]
                                                            ).map(
                                                                (
                                                                    reply: any,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            reply.id
                                                                        }
                                                                        className={cn(
                                                                            'rounded-lg border p-3 text-sm',
                                                                            reply.is_internal
                                                                                ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                                                                                : 'bg-muted/30',
                                                                        )}
                                                                    >
                                                                        <div className="mb-1 flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                {reply.user && (
                                                                                    <UserAvatar
                                                                                        user={
                                                                                            reply.user
                                                                                        }
                                                                                        size="xs"
                                                                                    />
                                                                                )}
                                                                                <span className="text-xs font-semibold">
                                                                                    {reply
                                                                                        .user
                                                                                        ?.name ??
                                                                                        'System'}
                                                                                </span>
                                                                                {reply.is_internal && (
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        Internal
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {new Date(
                                                                                    reply.created_at,
                                                                                ).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs leading-relaxed whitespace-pre-line">
                                                                            {
                                                                                reply.body
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                {/* Reply form */}
                                                {replyingToCommentId ===
                                                    comment.id && (
                                                    <div className="mt-3 ml-6 border-l-2 border-primary pl-4">
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                commentForm.post(
                                                                    route(
                                                                        'admin.ticket-comments.store',
                                                                        ticket.id,
                                                                    ),
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess:
                                                                            () => {
                                                                                commentForm.reset();
                                                                                setReplyingToCommentId(
                                                                                    null,
                                                                                );
                                                                            },
                                                                    },
                                                                );
                                                            }}
                                                            className="space-y-2"
                                                        >
                                                            <Textarea
                                                                placeholder="Write a reply..."
                                                                value={
                                                                    commentForm
                                                                        .data
                                                                        .body
                                                                }
                                                                onChange={(e) =>
                                                                    commentForm.setData(
                                                                        'body',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                rows={2}
                                                                className="resize-none text-sm"
                                                                autoFocus
                                                            />
                                                            <div className="flex items-center justify-between">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setReplyingToCommentId(
                                                                            null,
                                                                        );
                                                                        commentForm.setData(
                                                                            'parent_id',
                                                                            null,
                                                                        );
                                                                        commentForm.setData(
                                                                            'body',
                                                                            '',
                                                                        );
                                                                    }}
                                                                    className="h-7 text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    disabled={
                                                                        commentForm.processing ||
                                                                        !commentForm.data.body.trim()
                                                                    }
                                                                    className="h-7 text-xs"
                                                                >
                                                                    <Send className="mr-1 h-3 w-3" />
                                                                    {commentForm.processing
                                                                        ? 'Posting...'
                                                                        : 'Reply'}
                                                                </Button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg font-semibold">
                                        Attachments
                                    </CardTitle>
                                    <Badge variant="outline">
                                        {ticket.attachments?.length ?? 0}
                                    </Badge>
                                </div>
                                {can('tickets.edit') && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={uploadingFiles}
                                            className="h-8"
                                        >
                                            <Upload className="mr-2 h-3 w-3" />
                                            Add Files
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Selected Files Preview */}
                            {selectedFiles.length > 0 && (
                                <div className="mb-4 space-y-2 rounded-lg border bg-muted/30 p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Selected Files (
                                            {selectedFiles.length})
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            onClick={handleFileUpload}
                                            disabled={uploadingFiles}
                                            className="h-8"
                                        >
                                            {uploadingFiles ? (
                                                <>
                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-3 w-3" />
                                                    Upload All
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <div className="space-y-1.5">
                                        {selectedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm"
                                            >
                                                <Paperclip className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                <span className="min-w-0 flex-1 truncate">
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {(file.size / 1024).toFixed(
                                                        1,
                                                    )}{' '}
                                                    KB
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleFileRemove(index)
                                                    }
                                                    disabled={uploadingFiles}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(ticket.attachments?.length ?? 0) === 0 ? (
                                <div className="rounded-lg border bg-muted/20 py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No attachments uploaded.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(ticket.attachments ?? []).map(
                                        (attachment: TicketAttachment) => {
                                            const isImage =
                                                attachment.mime_type?.startsWith(
                                                    'image/',
                                                );
                                            const imageUrl = isImage
                                                ? route(
                                                      'admin.ticket-attachments.download',
                                                      attachment.id,
                                                  )
                                                : null;

                                            return (
                                                <div
                                                    key={attachment.id}
                                                    className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
                                                >
                                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                                        {isImage &&
                                                            imageUrl && (
                                                                <div className="flex-shrink-0">
                                                                    <button
                                                                        onClick={() => {
                                                                            setPreviewImageUrl(
                                                                                imageUrl,
                                                                            );
                                                                            setPreviewImageName(
                                                                                attachment.original_filename,
                                                                            );
                                                                            setImagePreviewOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted transition-opacity hover:opacity-80 sm:h-16 sm:w-16"
                                                                    >
                                                                        <img
                                                                            src={
                                                                                imageUrl
                                                                            }
                                                                            alt={
                                                                                attachment.original_filename
                                                                            }
                                                                            className="h-full w-full object-cover"
                                                                            onError={(
                                                                                e,
                                                                            ) => {
                                                                                (
                                                                                    e.target as HTMLImageElement
                                                                                ).style.display =
                                                                                    'none';
                                                                            }}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">
                                                                {
                                                                    attachment.original_filename
                                                                }
                                                            </p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        attachment.mime_type
                                                                    }
                                                                </p>
                                                                <span className="hidden text-xs text-muted-foreground sm:inline">
                                                                    ·
                                                                </span>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(
                                                                        attachment.file_size /
                                                                        1024
                                                                    ).toFixed(
                                                                        1,
                                                                    )}{' '}
                                                                    KB
                                                                </p>
                                                                {attachment.uploader && (
                                                                    <>
                                                                        <span className="hidden text-xs text-muted-foreground sm:inline">
                                                                            ·
                                                                        </span>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            by{' '}
                                                                            {
                                                                                attachment
                                                                                    .uploader
                                                                                    .name
                                                                            }
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-full items-center gap-2 sm:w-auto">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="flex-1 sm:flex-initial"
                                                        >
                                                            <a
                                                                href={route(
                                                                    'admin.ticket-attachments.download',
                                                                    attachment.id,
                                                                )}
                                                                download
                                                            >
                                                                Download
                                                            </a>
                                                        </Button>
                                                        {can(
                                                            'tickets.edit',
                                                        ) && (
                                                            <AlertDialog
                                                                open={
                                                                    deleteAttachmentDialogOpen ===
                                                                    attachment.id
                                                                }
                                                                onOpenChange={(
                                                                    open,
                                                                ) => {
                                                                    if (!open) {
                                                                        setDeleteAttachmentDialogOpen(
                                                                            null,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <AlertDialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            setDeleteAttachmentDialogOpen(
                                                                                attachment.id,
                                                                            )
                                                                        }
                                                                        className="flex-1 sm:flex-initial"
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            Delete
                                                                            Attachment
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are
                                                                            you
                                                                            sure
                                                                            you
                                                                            want
                                                                            to
                                                                            delete
                                                                            "
                                                                            {
                                                                                attachment.original_filename
                                                                            }
                                                                            "?
                                                                            This
                                                                            action
                                                                            cannot
                                                                            be
                                                                            undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>
                                                                            Cancel
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => {
                                                                                router.delete(
                                                                                    route(
                                                                                        'admin.ticket-attachments.destroy',
                                                                                        attachment.id,
                                                                                    ),
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                        onSuccess:
                                                                                            () => {
                                                                                                setDeleteAttachmentDialogOpen(
                                                                                                    null,
                                                                                                );
                                                                                            },
                                                                                    },
                                                                                );
                                                                            }}
                                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <CardTitle className="text-lg font-semibold">
                                    Activity Timeline
                                </CardTitle>
                                <Badge variant="outline" className="ml-auto">
                                    {ticket.histories?.length ?? 0} events
                                </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Complete history of status changes, assignments,
                                approvals, and system actions
                            </p>
                        </CardHeader>
                        <CardContent>
                            {(ticket.histories?.length ?? 0) === 0 ? (
                                <div className="rounded-lg border bg-muted/20 py-12 text-center">
                                    <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                                    <p className="text-sm text-muted-foreground">
                                        No activity recorded yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-gradient-to-b from-primary/30 via-border to-transparent sm:left-[17px]" />

                                    <div className="space-y-1">
                                        {(ticket.histories ?? []).map(
                                            (history: any, index: number) => {
                                                // Determine icon and color based on action type
                                                const getActionStyle = (
                                                    action: string,
                                                ) => {
                                                    switch (action) {
                                                        case 'status_changed':
                                                            return {
                                                                icon: (
                                                                    <TrendingUp className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-blue-100 dark:bg-blue-950',
                                                                border: 'border-blue-400 dark:border-blue-600',
                                                                text: 'text-blue-600 dark:text-blue-400',
                                                            };
                                                        case 'assigned':
                                                            return {
                                                                icon: (
                                                                    <UserPlus className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-violet-100 dark:bg-violet-950',
                                                                border: 'border-violet-400 dark:border-violet-600',
                                                                text: 'text-violet-600 dark:text-violet-400',
                                                            };
                                                        case 'priority_changed':
                                                            return {
                                                                icon: (
                                                                    <TrendingDown className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-amber-100 dark:bg-amber-950',
                                                                border: 'border-amber-400 dark:border-amber-600',
                                                                text: 'text-amber-600 dark:text-amber-400',
                                                            };
                                                        case 'approval_requested':
                                                            return {
                                                                icon: (
                                                                    <Shield className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-orange-100 dark:bg-orange-950',
                                                                border: 'border-orange-400 dark:border-orange-600',
                                                                text: 'text-orange-600 dark:text-orange-400',
                                                            };
                                                        case 'approved':
                                                        case 'auto_approved':
                                                            return {
                                                                icon: (
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-emerald-100 dark:bg-emerald-950',
                                                                border: 'border-emerald-400 dark:border-emerald-600',
                                                                text: 'text-emerald-600 dark:text-emerald-400',
                                                            };
                                                        case 'rejected':
                                                            return {
                                                                icon: (
                                                                    <XCircle className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-red-100 dark:bg-red-950',
                                                                border: 'border-red-400 dark:border-red-600',
                                                                text: 'text-red-600 dark:text-red-400',
                                                            };
                                                        case 'routed':
                                                            return {
                                                                icon: (
                                                                    <ArrowRight className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-cyan-100 dark:bg-cyan-950',
                                                                border: 'border-cyan-400 dark:border-cyan-600',
                                                                text: 'text-cyan-600 dark:text-cyan-400',
                                                            };
                                                        case 'category_changed':
                                                            return {
                                                                icon: (
                                                                    <Filter className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-teal-100 dark:bg-teal-950',
                                                                border: 'border-teal-400 dark:border-teal-600',
                                                                text: 'text-teal-600 dark:text-teal-400',
                                                            };
                                                        case 'sla_changed':
                                                            return {
                                                                icon: (
                                                                    <Timer className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-rose-100 dark:bg-rose-950',
                                                                border: 'border-rose-400 dark:border-rose-600',
                                                                text: 'text-rose-600 dark:text-rose-400',
                                                            };
                                                        default:
                                                            if (
                                                                action.startsWith(
                                                                    'system_',
                                                                )
                                                            )
                                                                return {
                                                                    icon: (
                                                                        <Zap className="h-3 w-3" />
                                                                    ),
                                                                    bg: 'bg-indigo-100 dark:bg-indigo-950',
                                                                    border: 'border-indigo-400 dark:border-indigo-600',
                                                                    text: 'text-indigo-600 dark:text-indigo-400',
                                                                };
                                                            return {
                                                                icon: (
                                                                    <Clock className="h-3 w-3" />
                                                                ),
                                                                bg: 'bg-gray-100 dark:bg-gray-800',
                                                                border: 'border-gray-400 dark:border-gray-600',
                                                                text: 'text-gray-600 dark:text-gray-400',
                                                            };
                                                    }
                                                };

                                                const style = getActionStyle(
                                                    history.action,
                                                );
                                                const actionLabel =
                                                    history.action
                                                        .replace(/_/g, ' ')
                                                        .replace(
                                                            /\b\w/g,
                                                            (l: string) =>
                                                                l.toUpperCase(),
                                                        );

                                                return (
                                                    <div
                                                        key={history.id}
                                                        className="group relative flex gap-3 py-2"
                                                    >
                                                        {/* Icon node */}
                                                        <div
                                                            className={`relative z-10 h-[32px] w-[32px] flex-shrink-0 rounded-full sm:h-[36px] sm:w-[36px] ${style.bg} ${style.border} flex items-center justify-center border-2 ${style.text} shadow-sm transition-transform duration-200 group-hover:scale-110`}
                                                        >
                                                            {style.icon}
                                                        </div>

                                                        {/* Content card */}
                                                        <div className="min-w-0 flex-1 rounded-lg border bg-card p-3 transition-colors duration-200 hover:bg-accent/30">
                                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-xs font-semibold sm:text-sm">
                                                                        {history
                                                                            .user
                                                                            ?.name ??
                                                                            'System'}
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`px-1.5 py-0 text-[10px] ${style.text} border-current`}
                                                                    >
                                                                        {
                                                                            actionLabel
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground tabular-nums sm:text-xs">
                                                                    {new Date(
                                                                        history.created_at,
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>

                                                            {/* Field change visualization */}
                                                            {history.field_name && (
                                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                                    <span className="font-medium text-muted-foreground capitalize">
                                                                        {history.field_name.replace(
                                                                            /_/g,
                                                                            ' ',
                                                                        )}
                                                                        :
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[11px] text-red-700 line-through dark:bg-red-950/50 dark:text-red-400">
                                                                        {history.old_value ??
                                                                            '—'}
                                                                    </span>
                                                                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                                        {history.new_value ??
                                                                            '—'}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Description */}
                                                            {history.description &&
                                                                !history.field_name && (
                                                                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                                                        {
                                                                            history.description
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Image Preview Dialog */}
            <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
                <DialogContent
                    className={cn(
                        'max-h-[90vh] max-w-[95vw] p-0 sm:max-w-6xl',
                        isFullscreen &&
                            'h-screen max-h-none w-screen max-w-none rounded-none',
                    )}
                >
                    <div ref={dialogContentRef} className="h-full w-full">
                        <DialogHeader className="px-3 pt-4 pb-2 sm:px-6 sm:pt-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="truncate text-sm sm:text-base">
                                        {previewImageName}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm">
                                        <span className="hidden sm:inline">
                                            Scroll to zoom • Drag to pan •{' '}
                                        </span>
                                        {Math.round(imageZoom * 100)}%
                                    </DialogDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleZoomOut}
                                        disabled={imageZoom <= 0.5}
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetZoom}
                                        disabled={imageZoom === 1}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleZoomIn}
                                        disabled={imageZoom >= 5}
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleFullscreen}
                                        title={
                                            isFullscreen
                                                ? 'Exit fullscreen'
                                                : 'Enter fullscreen'
                                        }
                                    >
                                        {isFullscreen ? (
                                            <Minimize className="h-4 w-4" />
                                        ) : (
                                            <Maximize className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>
                        <div
                            ref={imageContainerRef}
                            className="relative flex items-center justify-center overflow-hidden bg-muted/30 p-2 sm:p-4"
                            style={{
                                height: isFullscreen
                                    ? 'calc(100vh - 120px)'
                                    : 'calc(90vh - 120px)',
                                minHeight: '300px',
                            }}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {previewImageUrl && (
                                <img
                                    ref={imageRef}
                                    src={previewImageUrl}
                                    alt={previewImageName}
                                    className="rounded-lg transition-transform duration-200 select-none"
                                    style={{
                                        transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        cursor:
                                            imageZoom > 1
                                                ? isDragging
                                                    ? 'grabbing'
                                                    : 'grab'
                                                : 'default',
                                    }}
                                    draggable={false}
                                    onError={(e) => {
                                        (
                                            e.target as HTMLImageElement
                                        ).style.display = 'none';
                                        const errorDiv =
                                            document.createElement('div');
                                        errorDiv.className =
                                            'text-center text-muted-foreground p-4';
                                        errorDiv.textContent =
                                            'Failed to load image';
                                        (
                                            e.target as HTMLImageElement
                                        ).parentElement?.appendChild(errorDiv);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Approval Dialog */}
            <Dialog
                open={resolutionDialogOpen}
                onOpenChange={setResolutionDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Ticket</DialogTitle>
                        <DialogDescription>
                            Summarize the solution or outcome before resolving
                            this ticket.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            resolutionForm.put(
                                route('admin.tickets.update', {
                                    ticket: ticket.id,
                                }),
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setResolutionDialogOpen(false);
                                        resolutionForm.reset();
                                        toast.success(
                                            'Ticket resolved successfully',
                                        );
                                    },
                                },
                            );
                        }}
                    >
                        <div>
                            <Label htmlFor="resolution_summary">
                                Resolution Summary *
                            </Label>
                            <Textarea
                                id="resolution_summary"
                                value={resolutionForm.data.resolution_summary}
                                onChange={(event) =>
                                    resolutionForm.setData(
                                        'resolution_summary',
                                        event.target.value,
                                    )
                                }
                                placeholder="Describe what was fixed, changed, or delivered..."
                                rows={5}
                                maxLength={5000}
                                required
                            />
                            {resolutionForm.errors.resolution_summary && (
                                <p className="mt-1 text-xs text-destructive">
                                    {resolutionForm.errors.resolution_summary}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setResolutionDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    resolutionForm.processing ||
                                    !resolutionForm.data.resolution_summary.trim()
                                }
                            >
                                {resolutionForm.processing
                                    ? 'Resolving...'
                                    : 'Resolve Ticket'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={approvalDialogOpen}
                onOpenChange={setApprovalDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Ticket</DialogTitle>
                        <DialogDescription>
                            Add comments and optionally route the ticket to a
                            specific team after approval.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (selectedApprovalId) {
                                approvalForm.post(
                                    route(
                                        'admin.ticket-approvals.approve',
                                        selectedApprovalId,
                                    ),
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setApprovalDialogOpen(false);
                                            setSelectedApprovalId(null);
                                            approvalForm.reset();
                                        },
                                    },
                                );
                            }
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="approval_comments">
                                Comments (Optional)
                            </Label>
                            <Textarea
                                id="approval_comments"
                                value={approvalForm.data.comments}
                                onChange={(e) =>
                                    approvalForm.setData(
                                        'comments',
                                        e.target.value,
                                    )
                                }
                                placeholder="Add approval comments..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="routed_to_team">
                                Route to Team (Optional)
                            </Label>
                            <Select
                                value={
                                    approvalForm.data.routed_to_team_id
                                        ? String(
                                              approvalForm.data
                                                  .routed_to_team_id,
                                          )
                                        : '__none'
                                }
                                onValueChange={(value) =>
                                    approvalForm.setData(
                                        'routed_to_team_id',
                                        value === '__none'
                                            ? null
                                            : parseInt(value),
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none">
                                        Use category default
                                    </SelectItem>
                                    {departments.map((dept: BaseOption) => (
                                        <SelectItem
                                            key={dept.id}
                                            value={String(dept.id)}
                                        >
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setApprovalDialogOpen(false);
                                    setSelectedApprovalId(null);
                                    approvalForm.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={approvalForm.processing}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {approvalForm.processing
                                    ? 'Approving...'
                                    : 'Approve'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Ticket</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this ticket.
                            This will cancel the ticket.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (selectedApprovalId) {
                                rejectForm.post(
                                    route(
                                        'admin.ticket-approvals.reject',
                                        selectedApprovalId,
                                    ),
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setRejectDialogOpen(false);
                                            setSelectedApprovalId(null);
                                            rejectForm.reset();
                                        },
                                    },
                                );
                            }
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="reject_comments">
                                Rejection Reason *
                            </Label>
                            <Textarea
                                id="reject_comments"
                                value={rejectForm.data.comments}
                                onChange={(e) =>
                                    rejectForm.setData(
                                        'comments',
                                        e.target.value,
                                    )
                                }
                                placeholder="Please explain why this ticket is being rejected..."
                                rows={4}
                                required
                            />
                            {rejectForm.errors.comments && (
                                <p className="mt-1 text-xs text-red-500">
                                    {rejectForm.errors.comments}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setRejectDialogOpen(false);
                                    setSelectedApprovalId(null);
                                    rejectForm.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={rejectForm.processing}
                                variant="destructive"
                            >
                                {rejectForm.processing
                                    ? 'Rejecting...'
                                    : 'Reject Ticket'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
