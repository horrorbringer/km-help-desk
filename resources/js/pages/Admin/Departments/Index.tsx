import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import type { PageProps } from '@/types';

interface Department {
  id: number;
  name: string;
  code: string;
  is_support_team: boolean;
  is_active: boolean;
  description?: string | null;
  users_count: number;
  tickets_count: number;
  created_at: string;
}

interface DepartmentsIndexProps extends PageProps {
  departments: {
    data: Department[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    is_support_team?: string;
    is_active?: string;
  };
}

export default function DepartmentsIndex() {
  const { departments, filters, flash } = usePage<DepartmentsIndexProps>().props;
  const { can } = usePermissions();

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.departments.index'), newFilters, { preserveState: true, replace: true });
  };

  return (
    <AppLayout>
      <Head title="Departments" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground">Manage departments and support teams</p>
          </div>
          {can('departments.create') && (
            <Button asChild>
              <Link href={route('admin.departments.create')}>+ New Department</Link>
            </Button>
          )}
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
              placeholder="Search by name, code, or description..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.is_support_team as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_support_team', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All types</SelectItem>
                <SelectItem value="1">Support teams only</SelectItem>
                <SelectItem value="0">Regular departments only</SelectItem>
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

        {/* Departments Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.data.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No departments found.
              </CardContent>
            </Card>
          ) : (
            departments.data.map((department) => (
              <Card key={department.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Code: {department.code}</p>
                    </div>
                    <div className="flex gap-1">
                      {department.is_support_team && (
                        <Badge variant="default" className="text-xs">
                          Support
                        </Badge>
                      )}
                      <Badge
                        variant={department.is_active ? 'default' : 'secondary'}
                        className={department.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {department.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {department.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {department.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-muted-foreground">Users:</span>{' '}
                        <span className="font-medium">{department.users_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tickets:</span>{' '}
                        <span className="font-medium">{department.tickets_count}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={route('admin.departments.show', department.id)}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {departments.links.length > 3 && (
          <div className="flex justify-end gap-2">
            {departments.links.map((link) => (
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
      </div>
    </AppLayout>
  );
}

