import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Filter, Download, TrendingUp, Ticket as TicketIcon } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  requester?: { id: number; name: string };
  assigned_team?: { id: number; name: string };
  assigned_agent?: { id: number; name: string };
  category?: { id: number; name: string };
  project?: { id: number; name: string };
  created_at: string;
}

interface TicketsReportProps extends PageProps {
  tickets: {
    data: Ticket[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    date_from?: string;
    date_to?: string;
    status?: string;
    priority?: string;
    team?: string;
    agent?: string;
    category?: string;
    project?: string;
  };
  summary: {
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
  };
  filterOptions: {
    statuses: string[];
    priorities: string[];
    teams: Array<{ id: number; name: string }>;
    agents: Array<{ id: number; name: string }>;
    categories: Array<{ id: number; name: string }>;
    projects: Array<{ id: number; name: string }>;
  };
}

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

export default function TicketsReport() {
  const { tickets, filters, summary, filterOptions } = usePage<TicketsReportProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.reports.tickets'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Ticket Reports" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href={route('admin.reports.index')}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <TicketIcon className="h-8 w-8 text-primary" />
                Ticket Reports
              </h1>
              <p className="text-muted-foreground mt-1">Detailed ticket analysis and statistics</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{summary.total}</p>
              <p className="text-xs text-muted-foreground mt-2">All tickets in system</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(summary.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">By Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(summary.by_priority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        priorityColorMap[priority]?.includes('red') ? 'bg-red-500' :
                        priorityColorMap[priority]?.includes('orange') ? 'bg-orange-500' :
                        priorityColorMap[priority]?.includes('blue') ? 'bg-blue-500' : 'bg-slate-500'
                      )} />
                      <span className="text-sm capitalize">{priority}</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Filters</CardTitle>
            </div>
            <CardDescription>Refine your report by selecting specific criteria</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              type="date"
              placeholder="From Date"
              value={filters.date_from ?? ''}
              onChange={(e) => handleFilter('date_from', e.target.value)}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filters.date_to ?? ''}
              onChange={(e) => handleFilter('date_to', e.target.value)}
            />
            <Select
              value={(filters.status as string) ?? '__all'}
              onValueChange={(value) => handleFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All statuses</SelectItem>
                {filterOptions.statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.priority as string) ?? '__all'}
              onValueChange={(value) => handleFilter('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All priorities</SelectItem>
                {filterOptions.priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.team as string) ?? '__all'}
              onValueChange={(value) => handleFilter('team', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All teams</SelectItem>
                {filterOptions.teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.agent as string) ?? '__all'}
              onValueChange={(value) => handleFilter('agent', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All agents</SelectItem>
                {filterOptions.agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.category as string) ?? '__all'}
              onValueChange={(value) => handleFilter('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All categories</SelectItem>
                {filterOptions.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.project as string) ?? '__all'}
              onValueChange={(value) => handleFilter('project', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All projects</SelectItem>
                {filterOptions.projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id.toString()}>
                    {proj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tickets</CardTitle>
                <CardDescription className="mt-1">{tickets.total} total entries</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tickets.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tickets found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Ticket</TableHead>
                      <TableHead className="font-semibold">Subject</TableHead>
                      <TableHead className="font-semibold">Requester</TableHead>
                      <TableHead className="font-semibold">Assigned</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Priority</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.data.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Link
                            href={route('admin.tickets.show', ticket.id)}
                            className="text-primary hover:underline font-medium"
                          >
                            {ticket.ticket_number}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {ticket.requester?.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ticket.assigned_agent?.name ?? ticket.assigned_team?.name ?? 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("capitalize", statusColorMap[ticket.status] ?? '')}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("capitalize", priorityColorMap[ticket.priority] ?? '')}
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {tickets.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
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
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

