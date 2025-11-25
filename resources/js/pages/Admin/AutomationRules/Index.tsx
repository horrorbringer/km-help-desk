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

interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  trigger_event: string;
  priority: number;
  is_active: boolean;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
}

interface AutomationRulesIndexProps extends PageProps {
  rules: {
    data: AutomationRule[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    trigger_event?: string;
    is_active?: string;
  };
  triggerEvents: string[];
}

export default function AutomationRulesIndex() {
  const { rules, filters, triggerEvents, flash } = usePage<AutomationRulesIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.automation-rules.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Automation Rules" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automation Rules</h1>
            <p className="text-muted-foreground">
              Automate ticket assignment, routing, and workflow actions
            </p>
          </div>
          <Button asChild>
            <Link href={route('admin.automation-rules.create')}>+ New Rule</Link>
          </Button>
        </div>

        {/* Flash Message */}
        {flash?.success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {flash.success}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search rules..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.trigger_event as string) ?? '__all'}
              onValueChange={(value) => handleFilter('trigger_event', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All trigger events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All trigger events</SelectItem>
                {triggerEvents.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
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

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Rules ({rules.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {rules.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No automation rules found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Executions</TableHead>
                    <TableHead>Last Executed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.data.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground">{rule.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {rule.trigger_event.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rule.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.is_active ? 'default' : 'secondary'}
                          className={rule.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{rule.execution_count}</span>
                      </TableCell>
                      <TableCell>
                        {rule.last_executed_at ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(rule.last_executed_at).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={route('admin.automation-rules.edit', rule.id)}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {rules.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {rules.links.map((link) => (
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

