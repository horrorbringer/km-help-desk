import { Head, Link, router } from '@inertiajs/react';
import { useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvancedSearch } from '@/components/advanced-search';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

type Option = { id: number; name: string };

type Ticket = {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  source: string;
  requester?: Option;
  assigned_team?: Option;
  assigned_agent?: Option;
  category?: Option;
  project?: { id: number; name: string; code: string };
  sla_policy?: Option;
  tags: { id: number; name: string; color: string }[];
  created_at: string;
};

type Filters = {
  q?: string;
  status?: string;
  priority?: string;
  team?: number | string;
  agent?: number | string;
  category?: number | string;
  project?: number | string;
  requester?: number | string;
  date_from?: string;
  date_to?: string;
  sla_breached?: string;
  tags?: string[] | string;
};

type Props = {
  tickets: {
    data: Ticket[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: Filters;
  options: {
    statuses: string[];
    priorities: string[];
    teams: Option[];
    agents: Option[];
    categories: Option[];
    projects: Option[];
    requesters: Option[];
    tags: Array<{ id: number; name: string; color: string }>;
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

export default function TicketIndex({ tickets, filters, options }: Props) {
  const { can } = usePermissions();

  const handleFiltersChange = (newFilters: Filters) => {
    router.get(route('admin.tickets.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Tickets" />

      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer issues across projects and departments.
          </p>
        </div>

        {can('tickets.create') && (
          <Button asChild>
            <Link href={route('admin.tickets.create')}>New Ticket</Link>
          </Button>
        )}
      </div>

      {/* Advanced Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <AdvancedSearch
            filters={filters}
            options={options}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tickets ({tickets.total})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets found.</p>
          ) : (
            tickets.data.map((ticket) => (
              <div key={ticket.id} className="p-4 border rounded-lg hover:bg-muted/50 transition">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={route('admin.tickets.show', ticket.id)} className="font-medium text-primary">
                      {ticket.ticket_number} &mdash; {ticket.subject}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {ticket.category?.name} · {ticket.project?.name ?? 'No project'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn('capitalize', statusColorMap[ticket.status] ?? '')}>{ticket.status.replace('_', ' ')}</Badge>
                    <Badge className={cn('capitalize', priorityColorMap[ticket.priority] ?? '')}>{ticket.priority}</Badge>
                    {ticket.tags.map((tag) => (
                      <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                    <div>
                      <div className="text-xs uppercase tracking-wider">Requester</div>
                      <div>{ticket.requester?.name ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider">Assigned</div>
                      <div>{ticket.assigned_agent?.name ?? ticket.assigned_team?.name ?? 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider">Opened</div>
                      <div>{new Date(ticket.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  {(can('tickets.edit') || can('tickets.delete')) && (
                    <div className="flex gap-2 ml-4">
                      {can('tickets.edit') && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={route('admin.tickets.edit', ticket.id)}>Edit</Link>
                        </Button>
                      )}
                      {can('tickets.delete') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this ticket?')) {
                              router.delete(route('admin.tickets.destroy', ticket.id));
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          <div className="flex justify-end gap-2 pt-4">
            {tickets.links.map((link) => (
              <Button
                key={link.label}
                variant={link.active ? 'default' : 'outline'}
                size="sm"
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url)}
              >
                <span dangerouslySetInnerHTML={{ __html: link.label }} />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}


