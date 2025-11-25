import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface SlaStat {
  id: number;
  name: string;
  priority: string;
  total_tickets: number;
  response_breaches: number;
  resolution_breaches: number;
  response_compliance: number;
  resolution_compliance: number;
}

interface SlaReportProps extends PageProps {
  slaStats: SlaStat[];
  filters: {
    date_from?: string;
    date_to?: string;
  };
}

const priorityColorMap: Record<string, string> = {
  low: 'bg-slate-200 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function SlaReport() {
  const { slaStats, filters } = usePage<SlaReportProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.reports.sla'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="SLA Compliance Report" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SLA Compliance</h1>
            <p className="text-muted-foreground">Service level agreement compliance reports</p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.reports.index')}>← Back to Reports</Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* SLA Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {slaStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No SLA statistics found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Policy</th>
                      <th className="px-4 py-3 text-left">Priority</th>
                      <th className="px-4 py-3 text-left">Total Tickets</th>
                      <th className="px-4 py-3 text-left">Response Breaches</th>
                      <th className="px-4 py-3 text-left">Resolution Breaches</th>
                      <th className="px-4 py-3 text-left">Response Compliance</th>
                      <th className="px-4 py-3 text-left">Resolution Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaStats.map((stat) => (
                      <tr key={stat.id} className="border-t hover:bg-muted/50 transition">
                        <td className="px-4 py-3 font-medium">{stat.name}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`capitalize ${priorityColorMap[stat.priority] ?? ''}`}
                          >
                            {stat.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{stat.total_tickets}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              stat.response_breaches > 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }
                          >
                            {stat.response_breaches}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              stat.resolution_breaches > 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }
                          >
                            {stat.resolution_breaches}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              stat.response_compliance >= 95
                                ? 'text-emerald-600'
                                : stat.response_compliance >= 80
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {stat.response_compliance.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              stat.resolution_compliance >= 95
                                ? 'text-emerald-600'
                                : stat.resolution_compliance >= 80
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {stat.resolution_compliance.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

