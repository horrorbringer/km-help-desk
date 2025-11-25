import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';

type BaseOption = { id: number; name: string };

type TicketShowProps = {
  ticket: {
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

export default function TicketShow({ ticket }: TicketShowProps) {
  const { put } = useForm();
  // console.log(ticket);

  return (
    <AppLayout>
      <Head title={`Ticket ${ticket.ticket_number}`} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Ticket #{ticket.ticket_number}</p>
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={route('admin.tickets.index')}>Back to list</Link>
          </Button>
          <Button asChild>
            <button onClick={() => put(route('admin.tickets.edit', ticket.id))}>Edit Ticket</button>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Details & Context</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created {new Date(ticket.created_at).toLocaleString()} · Last updated{' '}
                {new Date(ticket.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{ticket.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Requester</h3>
                <p className="text-sm font-medium">{ticket.requester?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{ticket.requester?.email}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Assignment</h3>
                <p className="text-sm font-medium">
                  {ticket.assigned_agent?.name ?? ticket.assigned_team?.name ?? 'Unassigned'}
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Category</h3>
                <p className="text-sm font-medium">{ticket.category?.name ?? '—'}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Project</h3>
                <p className="text-sm font-medium">{ticket.project?.name ?? 'No project'}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Source</h3>
                <p className="text-sm font-medium capitalize">{ticket.source}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">SLA</h3>
                <p className="text-sm font-medium">{ticket.sla_policy?.name ?? 'No SLA'}</p>
              </div>
            </div>

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
              <h3 className="text-sm font-semibold">Comments</h3>
              {(ticket.comments?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
              {(ticket.comments ?? []).map((comment) => (
                <div key={comment.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{comment.user?.name ?? 'System'}</span>
                      {comment.is_internal && <Badge variant="secondary">Internal</Badge>}
                    </div>
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-line">{comment.body}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Attachments</h3>
              {(ticket.attachments?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No attachments uploaded.</p>
              )}
              {(ticket.attachments ?? []).map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{attachment.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.mime_type} · {(attachment.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <a href={attachment.file_path} className="text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                    View
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Status changes, assignments, and SLA tracking.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(ticket.histories?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No history recorded.</p>
            )}
            {(ticket.histories ?? []).map((history) => (
              <div key={history.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{history.user?.name ?? 'System'}</span>
                  <span>{new Date(history.created_at).toLocaleString()}</span>
                </div>
                <p className="font-medium mt-1 capitalize">{history.action.replace('_', ' ')}</p>
                {history.field_name && (
                  <p className="text-xs text-muted-foreground">
                    {history.field_name}: {history.old_value ?? '—'} → {history.new_value ?? '—'}
                  </p>
                )}
                {history.description && <p className="text-xs mt-1">{history.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


