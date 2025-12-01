import { Head, Link, router } from '@inertiajs/react';
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Option = { id: number; name: string };

type TicketApproval = {
  id: number;
  approval_level: string;
  status: string;
  comments?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  created_at: string;
  ticket: {
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    requester?: Option;
    category?: Option;
    assigned_team?: Option;
  };
  approver?: Option | null;
};

type Props = {
  approvals: {
    data: TicketApproval[];
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

export default function PendingApprovals({ approvals }: Props) {
  useToast(); // Handle flash messages

  const formatApprovalLevel = (level: string) => {
    return level
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <AppLayout>
      <Head title="Pending Approvals" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
            <p className="text-muted-foreground mt-1">
              Tickets awaiting your approval
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={route('admin.tickets.index')}>Back to Tickets</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals ({approvals.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.data.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No pending approvals
                </p>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! There are no tickets waiting for your approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.data.map((approval) => (
                  <div
                    key={approval.id}
                    className="p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all duration-200 bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Link
                            href={route('admin.tickets.show', { ticket: approval.ticket.id })}
                            className="font-semibold text-lg text-primary hover:underline"
                          >
                            {approval.ticket.ticket_number}
                          </Link>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            {formatApprovalLevel(approval.approval_level)} Approval
                          </Badge>
                        </div>

                        <h3 className="font-medium text-base mb-2">
                          {approval.ticket.subject}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge
                            className={cn(
                              'capitalize font-medium',
                              statusColorMap[approval.ticket.status] ?? 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {approval.ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            className={cn(
                              'capitalize font-medium',
                              priorityColorMap[approval.ticket.priority] ?? 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {approval.ticket.priority}
                          </Badge>
                          {approval.ticket.category && (
                            <span className="text-sm text-muted-foreground">
                              📁 {approval.ticket.category.name}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Requester: </span>
                            <span className="font-medium">
                              {approval.ticket.requester?.name ?? '—'}
                            </span>
                          </div>
                          {approval.ticket.assigned_team && (
                            <div>
                              <span className="text-muted-foreground">Team: </span>
                              <span className="font-medium">
                                {approval.ticket.assigned_team.name}
                              </span>
                            </div>
                          )}
                          {approval.approver && (
                            <div>
                              <span className="text-muted-foreground">Approver: </span>
                              <span className="font-medium">{approval.approver.name}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Created: </span>
                            <span className="font-medium">
                              {new Date(approval.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            router.visit(route('admin.tickets.show', { ticket: approval.ticket.id }));
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Review & Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={route('admin.tickets.show', { ticket: approval.ticket.id })}>
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
            {approvals.links.length > 3 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {approvals.links.map((link, index) => (
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

