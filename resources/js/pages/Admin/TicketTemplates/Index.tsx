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

interface TicketTemplate {
  id: number;
  name: string;
  slug: string;
  description?: string;
  usage_count: number;
  is_active: boolean;
  is_public: boolean;
  creator?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
}

interface TicketTemplatesIndexProps extends PageProps {
  templates: {
    data: TicketTemplate[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    is_active?: string;
  };
}

export default function TicketTemplatesIndex() {
  const { templates, filters, flash } = usePage<TicketTemplatesIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.ticket-templates.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Ticket Templates" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ticket Templates</h1>
            <p className="text-muted-foreground">
              Create reusable templates to quickly create tickets
            </p>
          </div>
          <Button asChild>
            <Link href={route('admin.ticket-templates.create')}>+ New Template</Link>
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
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search templates..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
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

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Templates ({templates.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {templates.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No ticket templates found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.data.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.slug}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {template.description || '—'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{template.usage_count} times</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_public ? 'default' : 'outline'}>
                          {template.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={template.is_active ? 'default' : 'secondary'}
                          className={template.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{template.creator?.name ?? 'System'}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={route('admin.ticket-templates.edit', template.id)}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {templates.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {templates.links.map((link) => (
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

