import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageProps } from '@/types';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent?: { id: number; name: string } | null;
  default_team?: { id: number; name: string } | null;
  is_active: boolean;
  sort_order: number;
  children_count: number;
  tickets_count: number;
  created_at: string;
}

interface CategoriesIndexProps extends PageProps {
  categories: {
    data: Category[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    parent_id?: string;
    is_active?: string;
  };
  rootCategories: Array<{ id: number; name: string }>;
}

export default function CategoriesIndex() {
  const { categories, filters, rootCategories, flash } = usePage<CategoriesIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.categories.index'), newFilters, { preserveState: true, replace: true });
  };

  return (
    <AppLayout>
      <Head title="Categories" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ticket Categories</h1>
            <p className="text-muted-foreground">Organize and classify tickets by category</p>
          </div>
          <Button asChild>
            <Link href={route('admin.categories.create')}>+ New Category</Link>
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
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name, slug, or description..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.parent_id as string) ?? '__all'}
              onValueChange={(value) => handleFilter('parent_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All categories</SelectItem>
                <SelectItem value="root">Root categories only</SelectItem>
                {rootCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
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

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Categories ({categories.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No categories found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Parent</th>
                      <th className="px-4 py-3 text-left">Default Team</th>
                      <th className="px-4 py-3 text-left">Subcategories</th>
                      <th className="px-4 py-3 text-left">Tickets</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.data.map((category) => (
                      <tr key={category.id} className="border-t hover:bg-muted/50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {category.parent ? (
                            <span className="text-sm">{category.parent.name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {category.default_team ? (
                            <span className="text-sm">{category.default_team.name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{category.children_count}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{category.tickets_count}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={category.is_active ? 'default' : 'secondary'}
                            className={category.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.categories.edit', category.id)}>Edit</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {categories.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {categories.links.map((link) => (
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

