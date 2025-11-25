import React from 'react';
import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  location?: string | null;
  project_manager?: { id: number; name: string; email: string } | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  tickets_count: number;
  recent_tickets: Array<{
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
  }>;
  created_at: string;
}

interface ProjectShowProps {
  project: Project;
}

const statusColorMap: Record<string, string> = {
  planning: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  on_hold: 'bg-slate-100 text-slate-700',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

const priorityColorMap: Record<string, string> = {
  low: 'bg-slate-200 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function ProjectShow({ project }: ProjectShowProps) {
  return (
    <AppLayout>
      <Head title={project.name} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Project: {project.code}</p>
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={route('admin.projects.index')}>← Back</Link>
            </Button>
            <Button asChild>
              <Link href={route('admin.projects.edit', project.id)}>Edit</Link>
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Details and configuration</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={`capitalize ${statusColorMap[project.status] ?? ''}`}
                >
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge
                  variant={project.is_active ? 'default' : 'secondary'}
                  className={project.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                >
                  {project.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {project.description}
                </p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Code</h3>
                <p className="text-sm font-medium">{project.code}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Location
                </h3>
                <p className="text-sm font-medium">{project.location ?? '—'}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Project Manager
                </h3>
                <p className="text-sm font-medium">
                  {project.project_manager ? (
                    <>
                      {project.project_manager.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({project.project_manager.email})
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Dates
                </h3>
                <p className="text-sm font-medium">
                  {project.start_date && (
                    <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                  )}
                  {project.start_date && project.end_date && <span className="mx-2">•</span>}
                  {project.end_date && (
                    <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                  )}
                  {!project.start_date && !project.end_date && '—'}
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Total Tickets
                </h3>
                <p className="text-sm font-medium">{project.tickets_count}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Created
                </h3>
                <p className="text-sm font-medium">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        {project.tickets_count > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Tickets</CardTitle>
                  <CardDescription>Latest tickets for this project</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={route('admin.tickets.index', { project: project.id })}>
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.recent_tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tickets found.
                </p>
              ) : (
                <div className="space-y-2">
                  {project.recent_tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={route('admin.tickets.show', ticket.id)}
                      className="block p-3 rounded border hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ticket.ticket_number}</p>
                          <p className="text-xs text-muted-foreground truncate">{ticket.subject}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${priorityColorMap[ticket.priority] ?? ''}`}
                          >
                            {ticket.priority}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusColorMap[ticket.status] ?? ''}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

