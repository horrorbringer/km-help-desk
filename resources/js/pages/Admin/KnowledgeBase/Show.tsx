import React from 'react';
import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  category?: { id: number; name: string } | null;
  author?: { id: number; name: string; email: string } | null;
  status: string;
  is_featured: boolean;
  views_count: number;
  helpful_count: number;
  not_helpful_count: number;
  sort_order: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface ArticleShowProps {
  article: Article;
}

const statusColorMap: Record<string, string> = {
  draft: 'bg-slate-200 text-slate-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-gray-200 text-gray-700',
};

export default function ArticleShow({ article }: ArticleShowProps) {
  return (
    <AppLayout>
      <Head title={article.title} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Article: {article.slug}</p>
            <h1 className="text-3xl font-bold">{article.title}</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={route('admin.knowledge-base.index')}>← Back</Link>
            </Button>
            <Button asChild>
              <Link href={route('admin.knowledge-base.edit', article.id)}>Edit</Link>
            </Button>
          </div>
        </div>

        {/* Article Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Article Information</CardTitle>
                <CardDescription>Details and statistics</CardDescription>
              </div>
              <div className="flex gap-2">
                {article.is_featured && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800">
                    Featured
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`capitalize ${statusColorMap[article.status] ?? ''}`}
                >
                  {article.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {article.excerpt && (
              <div>
                <h3 className="text-sm font-medium mb-2">Excerpt</h3>
                <p className="text-sm text-muted-foreground">{article.excerpt}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Content</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm whitespace-pre-line leading-relaxed">{article.content}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Category
                </h3>
                <p className="text-sm font-medium">
                  {article.category ? article.category.name : '—'}
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Author
                </h3>
                <p className="text-sm font-medium">
                  {article.author ? (
                    <>
                      {article.author.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({article.author.email})
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Views
                </h3>
                <p className="text-sm font-medium">{article.views_count}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Feedback
                </h3>
                <p className="text-sm font-medium">
                  <span className="text-emerald-600">+{article.helpful_count}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-red-600">-{article.not_helpful_count}</span>
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Published
                </h3>
                <p className="text-sm font-medium">
                  {article.published_at
                    ? new Date(article.published_at).toLocaleString()
                    : 'Not published'}
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Created
                </h3>
                <p className="text-sm font-medium">
                  {new Date(article.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

