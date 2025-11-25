import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface Agent {
  id: number;
  name: string;
  email: string;
  total_tickets: number;
  resolved_tickets: number;
  open_tickets: number;
}

interface AgentsReportProps extends PageProps {
  agents: Agent[];
  filters: {
    date_from?: string;
    date_to?: string;
  };
}

export default function AgentsReport() {
  const { agents, filters } = usePage<AgentsReportProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.reports.agents'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Agent Performance Report" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Performance</h1>
            <p className="text-muted-foreground">Individual agent workload and performance metrics</p>
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

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No agents found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Agent</th>
                      <th className="px-4 py-3 text-left">Total Tickets</th>
                      <th className="px-4 py-3 text-left">Resolved</th>
                      <th className="px-4 py-3 text-left">Open</th>
                      <th className="px-4 py-3 text-left">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => {
                      const resolutionRate =
                        agent.total_tickets > 0
                          ? ((agent.resolved_tickets / agent.total_tickets) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <tr key={agent.id} className="border-t hover:bg-muted/50 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{agent.total_tickets}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                              {agent.resolved_tickets}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              {agent.open_tickets}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{resolutionRate}%</span>
                          </td>
                        </tr>
                      );
                    })}
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

