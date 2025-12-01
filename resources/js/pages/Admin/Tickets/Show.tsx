import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Send, Edit, Trash2, X, Check, Reply, Maximize, Minimize, CheckCircle2, XCircle, Clock } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BaseOption = { id: number; name: string };

type TicketShowProps = {
  ticket?: {
    id: number;
    ticket_number: string;
    subject: string;
    description: string;
    status: string;
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
      comments?: string | null;
      approved_at?: string | null;
      rejected_at?: string | null;
      sequence: number;
      approver?: BaseOption & { email?: string };
      routed_to_team?: BaseOption;
      created_at: string;
    }[];
    current_approval?: {
      id: number;
      approval_level: 'lm' | 'hod';
      status: 'pending' | 'approved' | 'rejected';
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
    created_at: string;
    updated_at: string;
  };
};

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

export default function TicketShow(props: TicketShowProps) {
  const { can } = usePermissions();
  useToast(); // Handle flash messages
  const departments = props.departments || [];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState<number | null>(null);

  // Comment form
  const commentForm = useForm({
    body: '',
    is_internal: false,
    parent_id: null as number | null,
  });
  
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);

  // Get current user ID
  const page = usePage();
  const currentUserId = (page.props as any).auth?.user?.id;

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
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);

  const canEditComment = (comment: any) => {
    return comment.user?.id === currentUserId || can('tickets.edit');
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
    editCommentForm.put(route('admin.ticket-comments.update', { ticket: ticket.id, comment: commentId }), {
      preserveScroll: true,
      onSuccess: () => {
        setEditingCommentId(null);
        editCommentForm.reset();
      },
    });
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
        } else if ((dialogContentRef.current as any).webkitRequestFullscreen) {
          await (dialogContentRef.current as any).webkitRequestFullscreen();
        } else if ((dialogContentRef.current as any).msRequestFullscreen) {
          await (dialogContentRef.current as any).msRequestFullscreen();
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
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
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
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticket not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head title={`Ticket ${ticket.ticket_number}`} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-muted-foreground">Ticket #{ticket.ticket_number}</p>
            {ticket.status && (
              <Badge className={cn('capitalize', statusColorMap[ticket.status] ?? '')}>
                {ticket.status.replace('_', ' ')}
              </Badge>
            )}
            {ticket.priority && (
              <Badge className={cn('capitalize', priorityColorMap[ticket.priority] ?? '')}>
                {ticket.priority}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{ticket.subject}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={route('admin.tickets.index')}>← Back to list</Link>
          </Button>
          {can('tickets.edit') && (
            <Button asChild>
              <Link href={route('admin.tickets.edit', { ticket: ticket.id })}>Edit Ticket</Link>
            </Button>
          )}
          {can('tickets.delete') && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete ticket "{ticket.ticket_number}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      const ticketId = ticket.id;
                      setDeleteDialogOpen(false); // Close dialog immediately
                      router.delete(route('admin.tickets.destroy', { ticket: ticketId }), {
                        preserveScroll: true,
                        onSuccess: () => {
                          // Success handled by flash message and redirect
                        },
                        onError: (errors) => {
                          console.error('Delete errors:', errors);
                          // Error handled by flash message
                        },
                      });
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Details & Context</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Created {new Date(ticket.created_at).toLocaleString()} · Last updated{' '}
              {new Date(ticket.updated_at).toLocaleString()}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</h2>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="whitespace-pre-line text-sm leading-relaxed">{ticket.description}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 bg-muted/30 rounded-lg border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Requester</h3>
                <p className="text-sm font-semibold">{ticket.requester?.name ?? '—'}</p>
                {ticket.requester?.email && (
                  <p className="text-xs text-muted-foreground mt-1">{ticket.requester.email}</p>
                )}
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Assignment</h3>
                <p className="text-sm font-semibold">
                  {ticket.assigned_agent?.name ?? ticket.assigned_team?.name ?? (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Category</h3>
                <p className="text-sm font-semibold">{ticket.category?.name ?? '—'}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Project</h3>
                <p className="text-sm font-semibold">{ticket.project?.name ?? 'No project'}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Source</h3>
                <p className="text-sm font-semibold capitalize">{ticket.source}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">SLA Policy</h3>
                <p className="text-sm font-semibold">{ticket.sla_policy?.name ?? 'No SLA'}</p>
              </div>
            </div>

            {(ticket.custom_field_values?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Custom Fields
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {(ticket.custom_field_values ?? []).map((cfv) => {
                    let displayValue = cfv.value;
                    
                    // Format value based on field type
                    if (cfv.custom_field.field_type === 'multiselect') {
                      try {
                        const values = JSON.parse(cfv.value);
                        const options = cfv.custom_field.options || [];
                        displayValue = values
                          .map((v: string) => options.find((opt: any) => opt.value === v)?.label || v)
                          .join(', ');
                      } catch {
                        displayValue = cfv.value;
                      }
                    } else if (cfv.custom_field.field_type === 'boolean') {
                      displayValue = cfv.value === '1' || cfv.value === true ? 'Yes' : 'No';
                    } else if (cfv.custom_field.field_type === 'select') {
                      const option = cfv.custom_field.options?.find(
                        (opt: any) => opt.value === cfv.value
                      );
                      displayValue = option?.label || cfv.value;
                    }

                    return (
                      <div key={cfv.id}>
                        <p className="text-xs text-muted-foreground mb-1">
                          {cfv.custom_field.label}
                        </p>
                        <p className="text-sm font-medium">{displayValue || '—'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(ticket.tags?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(ticket.tags ?? []).map((tag) => (
                    <Badge key={tag.id} style={{ backgroundColor: tag.color, color: '#fff' }}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(ticket.watchers?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Watchers</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {(ticket.watchers ?? []).map((watcher) => (
                    <span key={watcher.id}>{watcher.name}</span>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Approval Section */}
            {(ticket.approvals && ticket.approvals.length > 0) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Approvals</h3>
                </div>

                <div className="space-y-3">
                  {ticket.approvals.map((approval) => {
                    const isPending = approval.status === 'pending';
                    const isApproved = approval.status === 'approved';
                    const isRejected = approval.status === 'rejected';
                    const canApprove = can('tickets.edit') && 
                      isPending && 
                      (!approval.approver || approval.approver.id === currentUserId);

                    return (
                      <div
                        key={approval.id}
                        className={cn(
                          "rounded-lg border p-4",
                          isPending && "bg-amber-50 border-amber-200",
                          isApproved && "bg-emerald-50 border-emerald-200",
                          isRejected && "bg-red-50 border-red-200"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={isPending ? 'default' : isApproved ? 'default' : 'destructive'}
                                className={cn(
                                  isPending && 'bg-amber-100 text-amber-800',
                                  isApproved && 'bg-emerald-100 text-emerald-800',
                                  isRejected && 'bg-red-100 text-red-800'
                                )}
                              >
                                {approval.approval_level === 'lm' ? 'Line Manager' : 'Head of Department'}
                              </Badge>
                              {isPending && <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>}
                              {isApproved && <Badge variant="outline" className="flex items-center gap-1 bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </Badge>}
                              {isRejected && <Badge variant="outline" className="flex items-center gap-1 bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </Badge>}
                            </div>

                            <div className="space-y-1 text-sm">
                              {approval.approver && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Approver:</span> {approval.approver.name}
                                  {approval.approver.email && ` (${approval.approver.email})`}
                                </p>
                              )}
                              {approval.approved_at && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Approved:</span>{' '}
                                  {new Date(approval.approved_at).toLocaleString()}
                                </p>
                              )}
                              {approval.rejected_at && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Rejected:</span>{' '}
                                  {new Date(approval.rejected_at).toLocaleString()}
                                </p>
                              )}
                              {approval.comments && (
                                <p className="text-muted-foreground mt-2">
                                  <span className="font-medium">Comments:</span> {approval.comments}
                                </p>
                              )}
                              {approval.routed_to_team && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Routed to:</span> {approval.routed_to_team.name}
                                </p>
                              )}
                            </div>
                          </div>

                          {canApprove && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedApprovalId(approval.id);
                                  setApprovalDialogOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedApprovalId(approval.id);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Pending Approval - Prominent Display */}
            {/* Only show pending approval banner if ticket is not resolved/closed/cancelled */}
            {ticket.current_approval && 
             ticket.current_approval.status === 'pending' && 
             !['resolved', 'closed', 'cancelled'].includes(ticket.status) && (
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <h3 className="text-lg font-semibold text-amber-900">
                        {ticket.current_approval.approval_level === 'lm' ? 'Line Manager' : 'Head of Department'} Approval Required
                      </h3>
                    </div>
                    <p className="text-sm text-amber-800 mb-3">
                      This ticket is waiting for {ticket.current_approval.approval_level === 'lm' ? 'Line Manager' : 'Head of Department'} approval.
                      {ticket.current_approval.approver && (
                        <> Assigned to: <strong>{ticket.current_approval.approver.name}</strong></>
                      )}
                    </p>
                    {can('tickets.edit') && (!ticket.current_approval.approver || ticket.current_approval.approver.id === currentUserId) && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApprovalId(ticket.current_approval!.id);
                            setApprovalDialogOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve Ticket
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApprovalId(ticket.current_approval!.id);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject Ticket
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rejected Ticket - Prominent Display */}
            {ticket.rejected_approval && ticket.status === 'cancelled' && (
              <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h3 className="text-lg font-semibold text-red-900">
                        Ticket Rejected
                      </h3>
                    </div>
                    <p className="text-sm text-red-800 mb-2">
                      This ticket was rejected by {ticket.rejected_approval.approval_level === 'lm' ? 'Line Manager' : 'Head of Department'}
                      {ticket.rejected_approval.approver && (
                        <>: <strong>{ticket.rejected_approval.approver.name}</strong></>
                      )}
                      {ticket.rejected_approval.rejected_at && (
                        <> on {new Date(ticket.rejected_approval.rejected_at).toLocaleString()}</>
                      )}
                    </p>
                    {ticket.rejected_approval.comments && (
                      <div className="bg-red-100 border border-red-200 rounded p-3 mb-3">
                        <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{ticket.rejected_approval.comments}</p>
                      </div>
                    )}
                    {can('tickets.edit') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Resubmit for Approval
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Resubmit Ticket for Approval?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reopen the ticket and resubmit it for approval. The ticket status will be changed from "cancelled" to "open" and a new approval request will be created.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                router.post(route('admin.tickets.resubmit', { ticket: ticket.id }), {}, {
                                  onSuccess: () => {
                                    // Success handled by flash message
                                  },
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Resubmit
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(ticket.approvals && ticket.approvals.length > 0) && <Separator />}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Comments</h3>
                <Badge variant="outline">{(ticket.comments?.length ?? 0)}</Badge>
              </div>

              {/* Add Comment Form */}
              {can('tickets.view') && (
                <div className="rounded-lg border p-4 bg-muted/30">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      commentForm.post(route('admin.ticket-comments.store', ticket.id), {
                        preserveScroll: true,
                        onSuccess: () => {
                          commentForm.reset();
                          commentForm.setData('parent_id', null);
                          setReplyingToCommentId(null);
                        },
                      });
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Textarea
                        placeholder="Add a comment..."
                        value={commentForm.data.body}
                        onChange={(e) => commentForm.setData('body', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      {commentForm.errors.body && (
                        <p className="text-xs text-destructive mt-1">{commentForm.errors.body}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {can('tickets.edit') && (
                          <>
                            <Checkbox
                              id="internal-comment"
                              checked={commentForm.data.is_internal}
                              onCheckedChange={(checked) =>
                                commentForm.setData('is_internal', checked === true)
                              }
                            />
                            <Label
                              htmlFor="internal-comment"
                              className="text-xs text-muted-foreground cursor-pointer"
                            >
                              Internal (only visible to agents)
                            </Label>
                          </>
                        )}
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={commentForm.processing || !commentForm.data.body.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {commentForm.processing ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {(ticket.comments?.length ?? 0) === 0 && (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                </div>
              )}
              <div className="space-y-3">
                {((ticket.comments ?? []).filter((c: any) => !c.parent_id) as any[]).map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      'rounded-lg border p-4 transition-colors',
                      comment.is_internal ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.user?.name ?? 'System'}</span>
                        {comment.is_internal && (
                          <Badge variant="secondary" className="text-xs">Internal</Badge>
                        )}
                        {comment.type && (
                          <Badge variant="outline" className="text-xs capitalize">{comment.type}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                        {canEditComment(comment) && (
                          <div className="flex items-center gap-1">
                            {editingCommentId === comment.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveComment(comment.id)}
                                  disabled={editCommentForm.processing}
                                  className="h-7 w-7 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={editCommentForm.processing}
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
                                  onClick={() => handleEditComment(comment)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog
                                  open={deleteCommentDialogOpen === comment.id}
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setDeleteCommentDialogOpen(null);
                                    }
                                  }}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteCommentDialogOpen(comment.id)}
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this comment? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          router.delete(route('admin.ticket-comments.destroy', { ticket: ticket.id, comment: comment.id }), {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                              setDeleteCommentDialogOpen(null);
                                            },
                                          });
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
                          value={editCommentForm.data.body}
                          onChange={(e) => editCommentForm.setData('body', e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        {editCommentForm.errors.body && (
                          <p className="text-xs text-destructive">{editCommentForm.errors.body}</p>
                        )}
                        {can('tickets.edit') && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-internal-${comment.id}`}
                              checked={editCommentForm.data.is_internal}
                              onCheckedChange={(checked) =>
                                editCommentForm.setData('is_internal', checked === true)
                              }
                            />
                            <Label
                              htmlFor={`edit-internal-${comment.id}`}
                              className="text-xs text-muted-foreground cursor-pointer"
                            >
                              Internal (only visible to agents)
                            </Label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-line leading-relaxed">{comment.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyingToCommentId(comment.id);
                              commentForm.setData('parent_id', comment.id);
                            }}
                            className="h-7 text-xs"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          {comment.replies && (comment.replies as any[]).length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {(comment.replies as any[]).length} {(comment.replies as any[]).length === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </div>
                        {/* Display replies */}
                        {comment.replies && (comment.replies as any[]).length > 0 && (
                          <div className="mt-3 ml-6 space-y-2 border-l-2 border-muted pl-4">
                            {(comment.replies as any[]).map((reply: any) => (
                              <div
                                key={reply.id}
                                className={cn(
                                  'rounded-lg border p-3 text-sm',
                                  reply.is_internal ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-muted/30'
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs">{reply.user?.name ?? 'System'}</span>
                                    {reply.is_internal && (
                                      <Badge variant="secondary" className="text-xs">Internal</Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs whitespace-pre-line leading-relaxed">{reply.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Reply form */}
                        {replyingToCommentId === comment.id && (
                          <div className="mt-3 ml-6 border-l-2 border-primary pl-4">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                commentForm.post(route('admin.ticket-comments.store', ticket.id), {
                                  preserveScroll: true,
                                  onSuccess: () => {
                                    commentForm.reset();
                                    setReplyingToCommentId(null);
                                  },
                                });
                              }}
                              className="space-y-2"
                            >
                              <Textarea
                                placeholder="Write a reply..."
                                value={commentForm.data.body}
                                onChange={(e) => commentForm.setData('body', e.target.value)}
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
                                    setReplyingToCommentId(null);
                                    commentForm.setData('parent_id', null);
                                    commentForm.setData('body', '');
                                  }}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={commentForm.processing || !commentForm.data.body.trim()}
                                  className="h-7 text-xs"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  {commentForm.processing ? 'Posting...' : 'Reply'}
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
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Attachments</h3>
                <Badge variant="outline">{(ticket.attachments?.length ?? 0)}</Badge>
              </div>
              {(ticket.attachments?.length ?? 0) === 0 && (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No attachments uploaded.</p>
                </div>
              )}
              <div className="space-y-2">
                {(ticket.attachments ?? []).map((attachment) => {
                  const isImage = attachment.mime_type?.startsWith('image/');
                  const imageUrl = isImage ? route('admin.ticket-attachments.download', attachment.id) : null;

                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      {isImage && imageUrl && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => {
                              setPreviewImageUrl(imageUrl);
                              setPreviewImageName(attachment.original_filename);
                              setImagePreviewOpen(true);
                            }}
                            className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={imageUrl}
                              alt={attachment.original_filename}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </button>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{attachment.original_filename}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{attachment.mime_type}</p>
                          <span className="text-xs text-muted-foreground">·</span>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.file_size / 1024).toFixed(1)} KB
                          </p>
                          {attachment.uploader && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <p className="text-xs text-muted-foreground">by {attachment.uploader.name}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={route('admin.ticket-attachments.download', attachment.id)}
                            download
                          >
                            Download
                          </a>
                        </Button>
                        {can('tickets.edit') && (
                          <AlertDialog open={deleteDialogOpen === attachment.id} onOpenChange={(open) => {
                            if (!open) {
                              setDeleteDialogOpen(null);
                            }
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteDialogOpen(attachment.id)}
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{attachment.original_filename}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    router.delete(route('admin.ticket-attachments.destroy', attachment.id), {
                                      preserveScroll: true,
                                      onSuccess: () => {
                                        setDeleteDialogOpen(null);
                                      },
                                    });
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
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Activity Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">Status changes, assignments, and SLA tracking.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(ticket.histories?.length ?? 0) === 0 && (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground">No history recorded.</p>
              </div>
            )}
            <div className="space-y-3">
              {(ticket.histories ?? []).map((history, index) => (
                <div key={history.id} className="relative">
                  {index < (ticket.histories?.length ?? 0) - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 min-w-0 rounded-lg border p-3 bg-card">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{history.user?.name ?? 'System'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(history.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-sm capitalize mb-1">
                        {history.action.replace('_', ' ')}
                      </p>
                      {history.field_name && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">{history.field_name}:</span>{' '}
                            <span className="line-through text-red-600">{history.old_value ?? '—'}</span>
                            {' → '}
                            <span className="text-green-600 font-medium">{history.new_value ?? '—'}</span>
                          </p>
                        </div>
                      )}
                      {history.description && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{history.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent 
          className={cn(
            "max-w-6xl max-h-[90vh] p-0",
            isFullscreen && "max-w-none max-h-none w-screen h-screen rounded-none"
          )}
        >
          <div ref={dialogContentRef} className="w-full h-full">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{previewImageName}</DialogTitle>
                <DialogDescription>
                  Scroll to zoom • Drag to pan • {Math.round(imageZoom * 100)}%
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
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
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
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
            className="relative flex items-center justify-center p-4 overflow-hidden bg-muted/30"
            style={{ 
              height: isFullscreen ? 'calc(100vh - 120px)' : 'calc(90vh - 120px)', 
              minHeight: '400px' 
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
                  cursor: imageZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                }}
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-center text-muted-foreground p-4';
                  errorDiv.textContent = 'Failed to load image';
                  (e.target as HTMLImageElement).parentElement?.appendChild(errorDiv);
                }}
              />
            )}
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Ticket</DialogTitle>
            <DialogDescription>
              Add comments and optionally route the ticket to a specific team after approval.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedApprovalId) {
                approvalForm.post(route('admin.ticket-approvals.approve', selectedApprovalId), {
                  preserveScroll: true,
                  onSuccess: () => {
                    setApprovalDialogOpen(false);
                    setSelectedApprovalId(null);
                    approvalForm.reset();
                  },
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="approval_comments">Comments (Optional)</Label>
              <Textarea
                id="approval_comments"
                value={approvalForm.data.comments}
                onChange={(e) => approvalForm.setData('comments', e.target.value)}
                placeholder="Add approval comments..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="routed_to_team">Route to Team (Optional)</Label>
              <Select
                value={approvalForm.data.routed_to_team_id ? String(approvalForm.data.routed_to_team_id) : '__none'}
                onValueChange={(value) =>
                  approvalForm.setData('routed_to_team_id', value === '__none' ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Use category default</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
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
              <Button type="submit" disabled={approvalForm.processing} className="bg-emerald-600 hover:bg-emerald-700">
                {approvalForm.processing ? 'Approving...' : 'Approve'}
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
              Please provide a reason for rejecting this ticket. This will cancel the ticket.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedApprovalId) {
                rejectForm.post(route('admin.ticket-approvals.reject', selectedApprovalId), {
                  preserveScroll: true,
                  onSuccess: () => {
                    setRejectDialogOpen(false);
                    setSelectedApprovalId(null);
                    rejectForm.reset();
                  },
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="reject_comments">Rejection Reason *</Label>
              <Textarea
                id="reject_comments"
                value={rejectForm.data.comments}
                onChange={(e) => rejectForm.setData('comments', e.target.value)}
                placeholder="Please explain why this ticket is being rejected..."
                rows={4}
                required
              />
              {rejectForm.errors.comments && (
                <p className="text-xs text-red-500 mt-1">{rejectForm.errors.comments}</p>
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
              <Button type="submit" disabled={rejectForm.processing} variant="destructive">
                {rejectForm.processing ? 'Rejecting...' : 'Reject Ticket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}


