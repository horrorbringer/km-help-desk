import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface Team {
  id: number;
  name: string;
  code: string;
  total_tickets: number;
  resolved_tickets: number;
}

interface TeamsReportProps extends PageProps {
  teams: Team[];
  filters: {
    date_from?: string;
    date_to?: string;
  };
}

export default function TeamsReport() {
  const { teams, filters } = usePage<TeamsReportProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.reports.teams'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Team Performance Report" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Performance</h1>
            <p className="text-muted-foreground">Department and team statistics</p>
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

        {/* Teams Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No teams found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Team</th>
                      <th className="px-4 py-3 text-left">Total Tickets</th>
                      <th className="px-4 py-3 text-left">Resolved</th>
                      <th className="px-4 py-3 text-left">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => {
                      const resolutionRate =
                        team.total_tickets > 0
                          ? ((team.resolved_tickets / team.total_tickets) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <tr key={team.id} className="border-t hover:bg-muted/50 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{team.name}</p>
                              <p className="text-xs text-muted-foreground">{team.code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{team.total_tickets}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                              {team.resolved_tickets}
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

