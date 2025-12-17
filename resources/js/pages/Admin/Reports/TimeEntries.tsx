import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Clock, Download, DollarSign, TrendingUp, Filter } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PageProps } from '@/types';

interface TimeEntry {
  id: number;
  date: string;
  duration_minutes: number;
  formatted_duration: string;
  activity_type?: string;
  description?: string;
  is_billable: boolean;
  hourly_rate?: number;
  amount?: number;
  is_approved: boolean;
  ticket?: {
    id: number;
    ticket_number: string;
    subject: string;
    project?: {
      id: number;
      name: string;
    } | null;
  } | null;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface TimeEntriesReportProps extends PageProps {
  timeEntries: {
    data: TimeEntry[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    date_from?: string;
    date_to?: string;
    user_id?: string;
    ticket_id?: string;
    activity_type?: string;
    is_billable?: string;
    is_approved?: string;
    project_id?: string;
  };
  summary: {
    total_entries: number;
    total_minutes: number;
    total_hours: number;
    billable_minutes: number;
    billable_hours: number;
    total_amount: number;
    billable_amount: number;
    approved_amount: number;
    by_activity: Record<string, { minutes: number; hours: number; amount: number }>;
    by_user: Array<{
      user: { id: number; name: string } | null;
      minutes: number;
      hours: number;
      amount: number;
    }>;
  };
  filterOptions: {
    users: Array<{ id: number; name: string }>;
    activity_types: string[];
    projects: Array<{ id: number; name: string }>;
  };
}

export default function TimeEntriesReport() {
  const { timeEntries, filters, summary, filterOptions } = usePage<TimeEntriesReportProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.reports.time-entries'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '$0.00';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <AppLayout>
      <Head title="Time Entries & Billing Report" />

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
                <Clock className="h-8 w-8 text-primary" />
                Time Entries & Billing
              </h1>
              <p className="text-muted-foreground mt-1">Time tracking and billing analysis</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.total_entries}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatHours(summary.total_hours)} total time
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Billable Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatHours(summary.billable_hours)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.billable_amount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(summary.total_amount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                All time entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(summary.approved_amount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Approved entries only
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Breakdown */}
        {Object.keys(summary.by_activity).length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Time by Activity Type</CardTitle>
              <CardDescription>Breakdown of time spent by activity category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(summary.by_activity)
                  .sort((a, b) => b[1].minutes - a[1].minutes)
                  .map(([activity, stats]) => (
                    <div key={activity} className="flex items-center justify-between p-2 rounded-lg border">
                      <div>
                        <p className="font-medium">{activity}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatHours(stats.hours)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(stats.amount)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Users */}
        {summary.by_user.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Users with the most time logged</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.by_user.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                    <div>
                      <p className="font-medium">{item.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatHours(item.hours)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              value={(filters.user_id as string) ?? '__all'}
              onValueChange={(value) => handleFilter('user_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All users</SelectItem>
                {filterOptions.users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.activity_type as string) ?? '__all'}
              onValueChange={(value) => handleFilter('activity_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All activities</SelectItem>
                {filterOptions.activity_types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.is_billable as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_billable', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Billable status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All entries</SelectItem>
                <SelectItem value="1">Billable only</SelectItem>
                <SelectItem value="0">Non-billable only</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(filters.is_approved as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_approved', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Approval status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All entries</SelectItem>
                <SelectItem value="1">Approved only</SelectItem>
                <SelectItem value="0">Pending only</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(filters.project_id as string) ?? '__all'}
              onValueChange={(value) => handleFilter('project_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All projects</SelectItem>
                {filterOptions.projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Time Entries Table */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Time Entries</CardTitle>
                <CardDescription className="mt-1">{timeEntries.total} total entries</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {timeEntries.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No time entries found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.data.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{entry.user?.name ?? '—'}</p>
                            {entry.user?.email && (
                              <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.ticket ? (
                            <Link
                              href={route('admin.tickets.show', entry.ticket.id)}
                              className="text-primary hover:underline"
                            >
                              {entry.ticket.ticket_number}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {entry.ticket?.project && (
                            <p className="text-xs text-muted-foreground">
                              {entry.ticket.project.name}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.activity_type ? (
                            <Badge variant="outline" className="text-xs">
                              {entry.activity_type}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {entry.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {entry.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{entry.formatted_duration}</p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={entry.is_billable ? 'default' : 'secondary'}
                            className={entry.is_billable ? 'bg-blue-100 text-blue-800' : ''}
                          >
                            {entry.is_billable ? 'Billable' : 'Non-billable'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.amount ? (
                            <p className="font-medium">{formatCurrency(entry.amount)}</p>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {entry.hourly_rate && (
                            <p className="text-xs text-muted-foreground">
                              @ {formatCurrency(entry.hourly_rate)}/hr
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={entry.is_approved ? 'default' : 'secondary'}
                            className={entry.is_approved ? 'bg-emerald-100 text-emerald-800' : ''}
                          >
                            {entry.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {timeEntries.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {timeEntries.links.map((link) => (
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
