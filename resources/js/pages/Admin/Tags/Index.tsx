import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  tickets_count: number;
  created_at: string;
}

interface TagsIndexProps extends PageProps {
  tags: {
    data: Tag[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
  };
}

export default function TagsIndex() {
  const { tags, filters, flash } = usePage<TagsIndexProps>().props;

  const handleFilter = (value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters.q;
    } else {
      newFilters.q = value;
    }
    router.get(route('admin.tags.index'), newFilters, { preserveState: true, replace: true });
  };

  return (
    <AppLayout>
      <Head title="Tags" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tags</h1>
            <p className="text-muted-foreground">Organize tickets with tags and labels</p>
          </div>
          <Button asChild>
            <Link href={route('admin.tags.create')}>+ New Tag</Link>
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
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name or slug..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter(e.currentTarget.value);
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Tags Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.data.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No tags found.
              </CardContent>
            </Card>
          ) : (
            tags.data.map((tag) => (
              <Card key={tag.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                      className="text-sm font-medium px-3 py-1"
                    >
                      {tag.name}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={route('admin.tags.edit', tag.id)}>Edit</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Slug:</span>
                      <code className="text-xs">{tag.slug}</code>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Color:</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: tag.color }}
                        />
                        <code className="text-xs">{tag.color}</code>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tickets:</span>
                      <Badge variant="outline">{tag.tickets_count}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {tags.links.length > 3 && (
          <div className="flex justify-end gap-2">
            {tags.links.map((link) => (
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

