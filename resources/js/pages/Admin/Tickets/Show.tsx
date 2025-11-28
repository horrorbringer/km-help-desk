import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Send } from 'lucide-react';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Comment form
  const commentForm = useForm({
    body: '',
    is_internal: false,
  });

  // Reset zoom and position when dialog closes
  useEffect(() => {
    if (!imagePreviewOpen) {
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [imagePreviewOpen]);

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
  const page = usePage();
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
                {(ticket.comments ?? []).map((comment) => (
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
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{comment.body}</p>
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
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
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
              </div>
            </div>
          </DialogHeader>
          <div
            ref={imageContainerRef}
            className="relative flex items-center justify-center p-4 overflow-hidden bg-muted/30"
            style={{ height: 'calc(90vh - 120px)', minHeight: '400px' }}
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
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}


