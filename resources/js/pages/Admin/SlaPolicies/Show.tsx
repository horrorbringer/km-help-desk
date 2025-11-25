import React from 'react';
import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SlaPolicy {
  id: number;
  name: string;
  description?: string | null;
  priority: string;
  response_time: number;
  resolution_time: number;
  is_active: boolean;
  tickets_count: number;
  response_compliance: number;
  resolution_compliance: number;
  response_breaches: number;
  resolution_breaches: number;
  created_at: string;
}

interface SlaPolicyShowProps {
  policy: SlaPolicy;
}

const priorityColorMap: Record<string, string> = {
  low: 'bg-slate-200 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
};

export default function SlaPolicyShow({ policy }: SlaPolicyShowProps) {
  return (
    <AppLayout>
      <Head title={policy.name} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">SLA Policy</p>
            <h1 className="text-3xl font-bold">{policy.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={route('admin.sla-policies.index')}>← Back</Link>
            </Button>
            <Button asChild>
              <Link href={route('admin.sla-policies.edit', policy.id)}>Edit</Link>
            </Button>
          </div>
        </div>

        {/* Policy Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Policy Information</CardTitle>
                <CardDescription>Details and configuration</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={`capitalize ${priorityColorMap[policy.priority] ?? ''}`}
                >
                  {policy.priority}
                </Badge>
                <Badge
                  variant={policy.is_active ? 'default' : 'secondary'}
                  className={policy.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                >
                  {policy.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {policy.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {policy.description}
                </p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  First Response Time
                </h3>
                <p className="text-sm font-medium">{formatTime(policy.response_time)}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Resolution Time
                </h3>
                <p className="text-sm font-medium">{formatTime(policy.resolution_time)}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Total Tickets
                </h3>
                <p className="text-sm font-medium">{policy.tickets_count}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Created
                </h3>
                <p className="text-sm font-medium">
                  {new Date(policy.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Statistics */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Compliance</CardTitle>
              <CardDescription>
                Percentage of tickets that met the first response time requirement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {policy.response_compliance.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {policy.tickets_count - policy.response_breaches} / {policy.tickets_count}{' '}
                    tickets
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${policy.response_compliance}%` }}
                  />
                </div>
              </div>
              {policy.response_breaches > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <strong>{policy.response_breaches}</strong> ticket
                  {policy.response_breaches > 1 ? 's' : ''} breached the response time SLA
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolution Time Compliance</CardTitle>
              <CardDescription>
                Percentage of tickets that met the resolution time requirement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {policy.resolution_compliance.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {policy.tickets_count - policy.resolution_breaches} / {policy.tickets_count}{' '}
                    tickets
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${policy.resolution_compliance}%` }}
                  />
                </div>
              </div>
              {policy.resolution_breaches > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <strong>{policy.resolution_breaches}</strong> ticket
                  {policy.resolution_breaches > 1 ? 's' : ''} breached the resolution time SLA
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Tickets */}
        {policy.tickets_count > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Tickets</CardTitle>
              <CardDescription>Tickets using this SLA policy</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={route('admin.tickets.index', { sla_policy: policy.id })}>
                  View All {policy.tickets_count} Ticket{policy.tickets_count > 1 ? 's' : ''}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

