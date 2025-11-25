import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageProps } from '@/types';

interface CannedResponse {
  id: number;
  title: string;
  content: string;
  category?: { id: number; name: string } | null;
  author?: { id: number; name: string } | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

interface CannedResponsesIndexProps extends PageProps {
  responses: {
    data: CannedResponse[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    category?: string;
    is_active?: string;
  };
  categories: Array<{ id: number; name: string }>;
}

export default function CannedResponsesIndex() {
  const { responses, filters, categories, flash } = usePage<CannedResponsesIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.canned-responses.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Canned Responses" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Canned Responses</h1>
            <p className="text-muted-foreground">
              Pre-written responses for common ticket scenarios
            </p>
          </div>
          <Button asChild>
            <Link href={route('admin.canned-responses.create')}>+ New Response</Link>
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
              placeholder="Search by title or content..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.category as string) ?? '__all'}
              onValueChange={(value) => handleFilter('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All categories</SelectItem>
                {categories.map((cat) => (
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

        {/* Responses Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {responses.data.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No canned responses found.
              </CardContent>
            </Card>
          ) : (
            responses.data.map((response) => (
              <Card key={response.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{response.title}</CardTitle>
                      {response.category && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {response.category.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        variant={response.is_active ? 'default' : 'secondary'}
                        className={response.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {response.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {response.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      <span>Used {response.usage_count} times</span>
                      {response.author && (
                        <span className="ml-2">by {response.author.name}</span>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={route('admin.canned-responses.edit', response.id)}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {responses.links.length > 3 && (
          <div className="flex justify-end gap-2">
            {responses.links.map((link) => (
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

