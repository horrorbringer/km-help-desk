import { Head, Link, router } from '@inertiajs/react';
import { useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const appliedFilters = useMemo(() => {
    return Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .length;
  }, [filters]);

  const handleFilterChange = (key: keyof Filters, rawValue: string | undefined) => {
    const value = rawValue === '__all' ? undefined : rawValue;

    const nextFilters: Filters = { ...filters };
    if (value === undefined || value === '') {
      delete nextFilters[key];
    } else {
      nextFilters[key] = value;
    }

    router.get(route('admin.tickets.index'), nextFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const resetFilters = () => {
    router.get(route('admin.tickets.index'));
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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Clear Filters {appliedFilters > 0 ? `(${appliedFilters})` : ''}
          </Button>
          <Button asChild>
            <Link href={route('admin.tickets.create')}>New Ticket</Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by ticket number, subject, description"
            value={filters.q ?? ''}
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />

          <Select value={(filters.status as string) ?? '__all'} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All statuses</SelectItem>
              {options.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={(filters.priority as string) ?? '__all'} onValueChange={(value) => handleFilterChange('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All priorities</SelectItem>
              {options.priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.team ? filters.team.toString() : '__all'}
            onValueChange={(value) => handleFilterChange('team', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All teams</SelectItem>
              {options.teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.agent ? filters.agent.toString() : '__all'}
            onValueChange={(value) => handleFilterChange('agent', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All agents</SelectItem>
              {options.agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.category ? filters.category.toString() : '__all'}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All categories</SelectItem>
              {options.categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.project ? filters.project.toString() : '__all'}
            onValueChange={(value) => handleFilterChange('project', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All projects</SelectItem>
              {options.projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.requester ? filters.requester.toString() : '__all'}
            onValueChange={(value) => handleFilterChange('requester', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Requester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All requesters</SelectItem>
              {options.requesters.map((requester) => (
                <SelectItem key={requester.id} value={requester.id.toString()}>
                  {requester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

                <div className="mt-3 text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-2">
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


