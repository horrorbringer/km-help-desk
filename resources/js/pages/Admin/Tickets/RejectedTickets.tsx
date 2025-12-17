import { Head, Link, router } from '@inertiajs/react';
import { XCircle, FileText, RotateCcw } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

type Option = { id: number; name: string };

type Ticket = {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  requester?: Option;
  category?: Option;
  assigned_team?: Option;
  rejected_approval?: {
    id: number;
    approval_level: string;
    comments?: string | null;
    rejected_at?: string | null;
    approver?: Option | null;
  } | null;
  created_at: string;
};

type Props = {
  tickets: {
    data: Ticket[];
    links: { url: string | null; label: string; active: boolean }[];
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

export default function RejectedTickets({ tickets }: Props) {
  useToast(); // Handle flash messages

  const handleResubmit = (ticketId: number) => {
    router.post(route('admin.tickets.resubmit', { ticket: ticketId }), {}, {
      onSuccess: () => {
        // Success handled by flash message
      },
    });
  };

  const formatApprovalLevel = (level: string) => {
    return level
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <AppLayout>
      <Head title="Rejected Tickets" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rejected Tickets</h1>
            <p className="text-muted-foreground mt-1">
              Tickets that were rejected during the approval process
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={route('admin.tickets.index')}>Back to Tickets</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejected Tickets ({tickets.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.data.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No rejected tickets
                </p>
                <p className="text-sm text-muted-foreground">
                  There are no tickets that have been rejected.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.data.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all duration-200 bg-card border-red-100"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Link
                            href={route('admin.tickets.show', { ticket: ticket.id })}
                            className="font-semibold text-lg text-primary hover:underline"
                          >
                            {ticket.ticket_number}
                          </Link>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            Rejected
                          </Badge>
                          {ticket.rejected_approval && (
                            <Badge variant="outline" className="text-xs">
                              {formatApprovalLevel(ticket.rejected_approval.approval_level)} Rejection
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-medium text-base mb-2">
                          {ticket.subject}
                        </h3>

                        {ticket.rejected_approval && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                            <div className="text-sm space-y-1">
                              {ticket.rejected_approval.approver && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Rejected by:</span>{' '}
                                  {ticket.rejected_approval.approver.name}
                                </p>
                              )}
                              {ticket.rejected_approval.rejected_at && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Rejected on:</span>{' '}
                                  {new Date(ticket.rejected_approval.rejected_at).toLocaleString()}
                                </p>
                              )}
                              {ticket.rejected_approval.comments && (
                                <p className="text-muted-foreground mt-2">
                                  <span className="font-medium">Reason:</span>{' '}
                                  {ticket.rejected_approval.comments}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge
                            className={cn(
                              'capitalize font-medium',
                              statusColorMap[ticket.status] ?? 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            className={cn(
                              'capitalize font-medium',
                              priorityColorMap[ticket.priority] ?? 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {ticket.priority}
                          </Badge>
                          {ticket.category && (
                            <span className="text-sm text-muted-foreground">
                              📁 {ticket.category.name}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Requester: </span>
                            <span className="font-medium">
                              {ticket.requester?.name ?? '—'}
                            </span>
                          </div>
                          {ticket.assigned_team && (
                            <div>
                              <span className="text-muted-foreground">Team: </span>
                              <span className="font-medium">
                                {ticket.assigned_team.name}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Created: </span>
                            <span className="font-medium">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 text-green-700 hover:bg-green-50"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Resubmit
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
                                onClick={() => handleResubmit(ticket.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Resubmit
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={route('admin.tickets.show', { ticket: ticket.id })}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {tickets.links.length > 3 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {tickets.links.map((link, index) => (
                  <Button
                    key={index}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

