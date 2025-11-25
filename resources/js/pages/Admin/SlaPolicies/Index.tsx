import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageProps } from '@/types';

interface SlaPolicy {
  id: number;
  name: string;
  description?: string | null;
  priority: string;
  response_time: number;
  resolution_time: number;
  is_active: boolean;
  tickets_count: number;
  created_at: string;
}

interface SlaPoliciesIndexProps extends PageProps {
  policies: {
    data: SlaPolicy[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    priority?: string;
    is_active?: string;
  };
}

const priorityColorMap: Record<string, string> = {
  low: 'bg-slate-200 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours}h ${mins}m`;
};

export default function SlaPoliciesIndex() {
  const { policies, filters, flash } = usePage<SlaPoliciesIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.sla-policies.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="SLA Policies" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SLA Policies</h1>
            <p className="text-muted-foreground">
              Manage Service Level Agreement policies and track compliance
            </p>
          </div>
          <Button asChild>
            <Link href={route('admin.sla-policies.create')}>+ New SLA Policy</Link>
          </Button>
        </div>

        {/* Flash Message */}
        {flash?.success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {flash.error}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name or description..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.priority as string) ?? '__all'}
              onValueChange={(value) => handleFilter('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(filters.is_active as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_active', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All statuses</SelectItem>
                <SelectItem value="1">Active only</SelectItem>
                <SelectItem value="0">Inactive only</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Policies ({policies.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {policies.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No SLA policies found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Priority</th>
                      <th className="px-4 py-3 text-left">Response Time</th>
                      <th className="px-4 py-3 text-left">Resolution Time</th>
                      <th className="px-4 py-3 text-left">Tickets</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.data.map((policy) => (
                      <tr key={policy.id} className="border-t hover:bg-muted/50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{policy.name}</p>
                            {policy.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {policy.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`capitalize ${priorityColorMap[policy.priority] ?? ''}`}
                          >
                            {policy.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatTime(policy.response_time)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatTime(policy.resolution_time)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{policy.tickets_count}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={policy.is_active ? 'default' : 'secondary'}
                            className={policy.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                          >
                            {policy.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={route('admin.sla-policies.show', policy.id)}>View</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={route('admin.sla-policies.edit', policy.id)}>Edit</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {policies.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {policies.links.map((link) => (
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

