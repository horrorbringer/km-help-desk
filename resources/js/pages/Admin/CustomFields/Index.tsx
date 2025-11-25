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

interface CustomField {
  id: number;
  name: string;
  slug: string;
  label: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface CustomFieldsIndexProps extends PageProps {
  customFields: {
    data: CustomField[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    field_type?: string;
    is_active?: string;
  };
  fieldTypes: Record<string, string>;
}

export default function CustomFieldsIndex() {
  const { customFields, filters, fieldTypes, flash } = usePage<CustomFieldsIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.custom-fields.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Custom Fields" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Custom Fields</h1>
            <p className="text-muted-foreground">
              Create custom fields to capture additional ticket information
            </p>
          </div>
          <Button asChild>
            <Link href={route('admin.custom-fields.create')}>+ New Field</Link>
          </Button>
        </div>

        {/* Flash Messages */}
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
              placeholder="Search fields..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.field_type as string) ?? '__all'}
              onValueChange={(value) => handleFilter('field_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All field types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All field types</SelectItem>
                {Object.entries(fieldTypes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
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

        {/* Custom Fields Table */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields ({customFields.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {customFields.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No custom fields found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customFields.data.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{field.label}</p>
                          <p className="text-xs text-muted-foreground">{field.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {fieldTypes[field.field_type] || field.field_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {field.is_required ? (
                          <Badge variant="default" className="bg-red-100 text-red-800">
                            Required
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Optional</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{field.display_order}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={field.is_active ? 'default' : 'secondary'}
                          className={field.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          {field.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={route('admin.custom-fields.edit', field.id)}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {customFields.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {customFields.links.map((link) => (
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

