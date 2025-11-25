import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageProps } from '@/types';

interface Project {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  location?: string | null;
  project_manager?: { id: number; name: string } | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  tickets_count: number;
  created_at: string;
}

interface ProjectsIndexProps extends PageProps {
  projects: {
    data: Project[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    status?: string;
    project_manager_id?: string;
    is_active?: string;
  };
  projectManagers: Array<{ id: number; name: string }>;
}

const statusColorMap: Record<string, string> = {
  planning: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  on_hold: 'bg-slate-100 text-slate-700',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

export default function ProjectsIndex() {
  const { projects, filters, projectManagers, flash } = usePage<ProjectsIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.projects.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Projects" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage construction projects and track tickets</p>
          </div>
          <Button asChild>
            <Link href={route('admin.projects.create')}>+ New Project</Link>
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
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name, code, location..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
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
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(filters.project_manager_id as string) ?? '__all'}
              onValueChange={(value) => handleFilter('project_manager_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All managers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All managers</SelectItem>
                {projectManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.name}
                  </SelectItem>
                ))}
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

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projects ({projects.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No projects found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Manager</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Tickets</th>
                      <th className="px-4 py-3 text-left">Dates</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.data.map((project) => (
                      <tr key={project.id} className="border-t hover:bg-muted/50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs">{project.code}</code>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {project.location ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {project.project_manager ? (
                            <span className="text-sm">{project.project_manager.name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
                          <Badge variant="outline">{project.tickets_count}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {project.start_date && (
                            <div>Start: {new Date(project.start_date).toLocaleDateString()}</div>
                          )}
                          {project.end_date && (
                            <div>End: {new Date(project.end_date).toLocaleDateString()}</div>
                          )}
                          {!project.start_date && !project.end_date && '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={route('admin.projects.show', project.id)}>View</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={route('admin.projects.edit', project.id)}>Edit</Link>
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
            {projects.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {projects.links.map((link) => (
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

