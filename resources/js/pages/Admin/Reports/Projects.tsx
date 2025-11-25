import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface Project {
  id: number;
  name: string;
  code: string;
  status: string;
  total_tickets: number;
  resolved_tickets: number;
}

interface ProjectsReportProps extends PageProps {
  projects: Project[];
  filters: {
    date_from?: string;
    date_to?: string;
  };
}

const statusColorMap: Record<string, string> = {
  planning: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  on_hold: 'bg-slate-100 text-slate-700',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

export default function ProjectsReport() {
  const { projects, filters } = usePage<ProjectsReportProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.reports.projects'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Project Reports" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Reports</h1>
            <p className="text-muted-foreground">Project-related ticket statistics</p>
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

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Project Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No projects found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Total Tickets</th>
                      <th className="px-4 py-3 text-left">Resolved</th>
                      <th className="px-4 py-3 text-left">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => {
                      const resolutionRate =
                        project.total_tickets > 0
                          ? ((project.resolved_tickets / project.total_tickets) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <tr key={project.id} className="border-t hover:bg-muted/50 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">{project.code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`capitalize ${statusColorMap[project.status] ?? ''}`}
                            >
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{project.total_tickets}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                              {project.resolved_tickets}
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

