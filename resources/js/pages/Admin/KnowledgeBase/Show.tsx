import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Edit, Eye, ThumbsUp, ThumbsDown, Calendar, User, Tag, Star } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  category?: { id: number; name: string } | null;
  author?: { id: number; name: string; email: string; avatar?: string | null } | null;
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
  article?: Article;
}

const statusColorMap: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  archived: 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function ArticleShow(props: ArticleShowProps) {
  const page = usePage();
  const pageProps = page.props as { article?: Article };
  
  // Get article from props or page props
  let article = props.article || pageProps.article;
  
  // Handle potential data nesting (similar to TicketResource)
  if (article && typeof article === 'object' && 'data' in article) {
    article = (article as any).data;
  }

  if (!article || !article.id) {
    return (
      <AppLayout>
        <Head title="Article Not Found" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Article not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head title={article.title} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href={route('admin.knowledge-base.index')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Link>
          </Button>
          {article?.id && (
            <Button asChild size="sm">
              <Link href={route('admin.knowledge-base.edit', { knowledge_base: article.id })}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Article
              </Link>
            </Button>
          )}
        </div>

        {/* Article Header */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-start gap-3">
            {article.is_featured && (
              <Star className="h-5 w-5 text-amber-500 fill-amber-500 mt-1" />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight mb-3">{article.title}</h1>
              {article.excerpt && (
                <p className="text-lg text-muted-foreground mb-4">{article.excerpt}</p>
              )}
            </div>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {article.category && (
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                <span>{article.category.name}</span>
              </div>
            )}
            {article.author && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{article.author.name}</span>
              </div>
            )}
            {article.published_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.published_at).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{article.views_count} views</span>
            </div>
            {(article.helpful_count > 0 || article.not_helpful_count > 0) && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">{article.helpful_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">{article.not_helpful_count}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {article.is_featured && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                <Star className="h-3 w-3 mr-1 fill-amber-700" />
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

        {/* Article Content - GitHub README Style */}
        <div className="bg-card rounded-lg border border-border p-8">
          <article className="prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-headings:mt-8 prose-headings:mb-4 prose-headings:scroll-mt-20
            prose-h1:text-3xl prose-h1:font-bold prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h1:mb-6 prose-h1:mt-0
            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-[15px] prose-p:leading-7 prose-p:my-5 prose-p:text-foreground
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:decoration-2
            prose-strong:font-semibold prose-strong:text-foreground
            prose-code:text-[13px] prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
            prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg 
            prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-6
            prose-pre-code:bg-transparent prose-pre-code:p-0 prose-pre-code:border-0
            prose-ul:my-5 prose-ul:pl-6 prose-ul:list-disc
            prose-ol:my-5 prose-ol:pl-6 prose-ol:list-decimal
            prose-li:my-2 prose-li:text-[15px] prose-li:leading-7
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-5 prose-blockquote:pr-4 
            prose-blockquote:italic prose-blockquote:my-6 prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:rounded-r
            prose-table:w-full prose-table:my-6 prose-table:border-collapse
            prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3 prose-th:bg-muted prose-th:text-left prose-th:font-semibold
            prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3 prose-td:text-[15px]
            prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-6 prose-img:shadow-sm
            prose-hr:my-8 prose-hr:border-border prose-hr:border-t-2">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </article>
        </div>

        {/* Footer Information */}
        <Separator className="my-8" />
        
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Created
            </p>
            <p className="text-foreground">
              {new Date(article.created_at).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Updated
            </p>
            <p className="text-foreground">
              {new Date(article.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
