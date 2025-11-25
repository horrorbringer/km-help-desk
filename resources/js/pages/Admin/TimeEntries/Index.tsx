import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ticket: {
    id: number;
    ticket_number: string;
    subject: string;
  };
  user: {
    id: number;
    name: string;
  };
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  formatted_duration: string;
  description?: string;
  activity_type?: string;
  is_billable: boolean;
  hourly_rate?: number;
  amount?: number;
  is_approved: boolean;
  approver?: {
    id: number;
    name: string;
  } | null;
  approved_at?: string;
  created_at: string;
}

interface TimeEntriesIndexProps extends PageProps {
  timeEntries: {
    data: TimeEntry[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    ticket_id?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    is_billable?: string;
    is_approved?: string;
  };
  totals: {
    total_minutes: number;
    total_amount: number;
  };
  activityTypes: string[];
}

export default function TimeEntriesIndex() {
  const { timeEntries, filters, totals, activityTypes, flash } =
    usePage<TimeEntriesIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.time-entries.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const formatTotalDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  return (
    <AppLayout>
      <Head title="Time Entries" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Time Entries</h1>
            <p className="text-muted-foreground">
              Track time spent on tickets for billing and reporting
            </p>
          </div>
          <Button asChild>
            <Link href={route('admin.time-entries.create')}>+ Log Time</Link>
          </Button>
        </div>

        {/* Flash Message */}
        {flash?.success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {flash.success}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTotalDuration(totals.total_minutes)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totals.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
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
          </CardContent>
        </Card>

        {/* Time Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries ({timeEntries.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No time entries found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Billable</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                          {entry.start_time && entry.end_time && (
                            <p className="text-xs text-muted-foreground">
                              {entry.start_time} - {entry.end_time}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={route('admin.tickets.show', entry.ticket.id)}
                          className="text-primary hover:underline"
                        >
                          {entry.ticket.ticket_number}
                        </Link>
                        <p className="text-xs text-muted-foreground">{entry.ticket.subject}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{entry.user.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{entry.formatted_duration}</p>
                      </TableCell>
                      <TableCell>
                        {entry.activity_type && (
                          <Badge variant="outline" className="text-xs">
                            {entry.activity_type}
                          </Badge>
                        )}
                        {entry.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {entry.description}
                          </p>
                        )}
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
                          <p className="font-medium">
                            ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={route('admin.time-entries.edit', entry.id)}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

