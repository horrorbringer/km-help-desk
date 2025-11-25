import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageProps } from '@/types';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: { id: number; name: string } | null;
  author?: { id: number; name: string } | null;
  status: string;
  is_featured: boolean;
  views_count: number;
  helpful_count: number;
  not_helpful_count: number;
  published_at?: string | null;
  created_at: string;
}

interface KnowledgeBaseIndexProps extends PageProps {
  articles: {
    data: Article[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    category?: string;
    status?: string;
    is_featured?: string;
  };
  categories: Array<{ id: number; name: string }>;
}

const statusColorMap: Record<string, string> = {
  draft: 'bg-slate-200 text-slate-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-gray-200 text-gray-700',
};

export default function KnowledgeBaseIndex() {
  const { articles, filters, categories, flash } = usePage<KnowledgeBaseIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.knowledge-base.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Knowledge Base" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">Manage FAQ articles and help documentation</p>
          </div>
          <Button asChild>
            <Link href={route('admin.knowledge-base.create')}>+ New Article</Link>
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
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search articles..."
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
              value={(filters.status as string) ?? '__all'}
              onValueChange={(value) => handleFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(filters.is_featured as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_featured', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All articles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All articles</SelectItem>
                <SelectItem value="1">Featured only</SelectItem>
                <SelectItem value="0">Not featured</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Articles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Articles ({articles.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {articles.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No articles found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Helpful</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.data.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={route('admin.knowledge-base.show', article.id)}
                              className="font-medium hover:underline"
                            >
                              {article.title}
                            </Link>
                            {article.is_featured && (
                              <Badge variant="outline" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                          {article.excerpt && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {article.excerpt}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.category ? (
                          <span className="text-sm">{article.category.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {article.author ? (
                          <span className="text-sm">{article.author.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${statusColorMap[article.status] ?? ''}`}
                        >
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{article.views_count}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-emerald-600">+{article.helpful_count}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600">-{article.not_helpful_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.published_at ? (
                          <span className="text-sm">
                            {new Date(article.published_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.knowledge-base.edit', article.id)}>Edit</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {articles.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {articles.links.map((link) => (
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

