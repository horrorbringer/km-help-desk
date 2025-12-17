import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Edit, Eye, ThumbsUp, ThumbsDown, Calendar, User, Tag, Star, Clock, FileText } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
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

  // State for feedback
  const [feedbackState, setFeedbackState] = useState<{
    helpful: number;
    notHelpful: number;
    userFeedback: 'helpful' | 'not_helpful' | null;
    isSubmitting: boolean;
  }>({
    helpful: article.helpful_count || 0,
    notHelpful: article.not_helpful_count || 0,
    userFeedback: null, // Track if user has submitted feedback
    isSubmitting: false,
  });

  const handleFeedback = async (type: 'helpful' | 'not_helpful') => {
    if (feedbackState.isSubmitting || feedbackState.userFeedback !== null) {
      return; // Prevent multiple submissions
    }

    setFeedbackState(prev => ({ ...prev, isSubmitting: true }));

    router.post(
      route('admin.knowledge-base.feedback', article.id),
      { type },
      {
        preserveScroll: true,
        onSuccess: () => {
          setFeedbackState(prev => ({
            ...prev,
            helpful: type === 'helpful' ? prev.helpful + 1 : prev.helpful,
            notHelpful: type === 'not_helpful' ? prev.notHelpful + 1 : prev.notHelpful,
            userFeedback: type,
            isSubmitting: false,
          }));
          toast.success('Thank you for your feedback!', {
            description: `You marked this article as ${type === 'helpful' ? 'helpful' : 'not helpful'}.`,
          });
        },
        onError: () => {
          setFeedbackState(prev => ({ ...prev, isSubmitting: false }));
          toast.error('Failed to submit feedback', {
            description: 'Please try again later.',
          });
        },
      }
    );
  };

  return (
    <AppLayout>
      <Head title={article.title} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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

        {/* Article Header Card */}
        <Card className="border-2 shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Title Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {article.is_featured && (
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500 mt-1 shrink-0" />
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">
                    {article.title}
                  </h1>
                  {article.excerpt && (
                    <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {article.is_featured && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                    <Star className="h-3 w-3 mr-1.5 fill-amber-700" />
                    Featured
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn('capitalize', statusColorMap[article.status] ?? '')}
                >
                  {article.status}
                </Badge>
                {article.category && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    <Tag className="h-3 w-3 mr-1.5" />
                    {article.category.name}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Meta Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Author */}
              {article.author && (
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    user={{ 
                      id: article.author.id, 
                      name: article.author.name, 
                      avatar: article.author.avatar 
                    }} 
                    size="sm" 
                    showTooltip={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Author
                    </p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {article.author.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Published Date */}
              {article.published_at && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Published
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(article.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Views */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    Views
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {article.views_count.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <ThumbsUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Was this helpful?
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant={feedbackState.userFeedback === 'helpful' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFeedback('helpful')}
                      disabled={feedbackState.isSubmitting || feedbackState.userFeedback !== null}
                      className={cn(
                        "h-8 gap-1.5",
                        feedbackState.userFeedback === 'helpful' && "bg-emerald-600 hover:bg-emerald-700 text-white",
                        feedbackState.userFeedback === 'not_helpful' && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <ThumbsUp className={cn(
                        "h-3.5 w-3.5",
                        feedbackState.userFeedback === 'helpful' ? "text-white" : "text-emerald-600"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        feedbackState.userFeedback === 'helpful' ? "text-white" : "text-emerald-600"
                      )}>
                        {feedbackState.helpful}
                      </span>
                    </Button>
                    <Button
                      variant={feedbackState.userFeedback === 'not_helpful' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFeedback('not_helpful')}
                      disabled={feedbackState.isSubmitting || feedbackState.userFeedback !== null}
                      className={cn(
                        "h-8 gap-1.5",
                        feedbackState.userFeedback === 'not_helpful' && "bg-red-600 hover:bg-red-700 text-white",
                        feedbackState.userFeedback === 'helpful' && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <ThumbsDown className={cn(
                        "h-3.5 w-3.5",
                        feedbackState.userFeedback === 'not_helpful' ? "text-white" : "text-red-600"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        feedbackState.userFeedback === 'not_helpful' ? "text-white" : "text-red-600"
                      )}>
                        {feedbackState.notHelpful}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Article Content - Direct Plain Text Rendering with Formatting */}
        <Card className="border-2 shadow-sm">
          <CardContent className="p-8 md:p-10 lg:p-12">
            <article className="max-w-none">
              {(() => {
                if (!article.content) return null;
                
                // Check if content has markdown syntax
                const hasMarkdown = /^#{1,6}\s|^\*\s|^-\s|^\d+\.\s|^\*\*|^__|^`|^```|^\|/m.test(article.content);
                
                if (hasMarkdown) {
                  // Render as markdown
                  return (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-4xl font-extrabold border-b-2 border-border pb-4 mb-8 mt-0 pt-0 leading-tight text-foreground">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-3xl font-bold mt-12 mb-6 pt-2 pb-3 border-b border-border leading-tight text-foreground">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-2xl font-semibold mt-10 mb-4 pt-1 text-foreground">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-base leading-8 my-6 text-foreground/90 first:mt-0 last:mb-0">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-6 pl-7 list-disc space-y-2">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-6 pl-7 list-decimal space-y-2">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="my-2 text-base leading-7 text-foreground/90">
                              {children}
                            </li>
                          ),
                        }}
                      >
                        {article.content}
                      </ReactMarkdown>
                    </div>
                  );
                }
                
                // Render plain text with smart formatting
                const lines = article.content.split('\n');
                const elements: React.ReactNode[] = [];
                let currentList: string[] = [];
                let listType: 'ul' | 'ol' | null = null;
                let key = 0;
                
                const flushList = () => {
                  if (currentList.length > 0) {
                    if (listType === 'ul') {
                      elements.push(
                        <ul key={key++} className="my-6 pl-7 list-disc space-y-2">
                          {currentList.map((item, idx) => (
                            <li key={idx} className="my-2 text-base leading-7 text-foreground/90">
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    } else if (listType === 'ol') {
                      elements.push(
                        <ol key={key++} className="my-6 pl-7 list-decimal space-y-2">
                          {currentList.map((item, idx) => (
                            <li key={idx} className="my-2 text-base leading-7 text-foreground/90">
                              {item}
                            </li>
                          ))}
                        </ol>
                      );
                    }
                    currentList = [];
                    listType = null;
                  }
                };
                
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i];
                  const trimmed = line.trim();
                  const nextLine = lines[i + 1]?.trim() || '';
                  const prevLine = lines[i - 1]?.trim() || '';
                  
                  if (!trimmed) {
                    flushList();
                    if (elements.length > 0 && elements[elements.length - 1] !== null) {
                      elements.push(null); // Add spacing
                    }
                    continue;
                  }
                  
                  // Detect headings
                  const isShort = trimmed.length < 100;
                  const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /^[A-Z\s]+$/.test(trimmed);
                  const isTitleCase = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*(\s+[a-z]+)*$/.test(trimmed) && trimmed.length < 80;
                  const endsWithQuestion = trimmed.endsWith('?');
                  const followedByEmpty = !nextLine;
                  const precededByEmpty = !prevLine;
                  
                  if (isShort && (isAllCaps || isTitleCase || endsWithQuestion) && (followedByEmpty || precededByEmpty)) {
                    flushList();
                    elements.push(
                      <h2 key={key++} className="text-3xl font-bold mt-12 mb-6 pt-2 pb-3 border-b border-border leading-tight text-foreground first:mt-0">
                        {trimmed}
                      </h2>
                    );
                    continue;
                  }
                  
                  // Detect bullet points
                  const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
                  if (bulletMatch) {
                    if (listType !== 'ul') {
                      flushList();
                      listType = 'ul';
                    }
                    currentList.push(bulletMatch[1]);
                    continue;
                  }
                  
                  // Detect numbered lists
                  const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
                  if (numberedMatch) {
                    if (listType !== 'ol') {
                      flushList();
                      listType = 'ol';
                    }
                    currentList.push(numberedMatch[2]);
                    continue;
                  }
                  
                  // Regular paragraph
                  flushList();
                  if (trimmed) {
                    elements.push(
                      <p key={key++} className="text-base leading-8 my-6 text-foreground/90 first:mt-0 last:mb-0">
                        {trimmed}
                      </p>
                    );
                  }
                }
                
                flushList();
                
                return <>{elements.filter(el => el !== null)}</>;
              })()}
            </article>
          </CardContent>
        </Card>

        {/* Footer Information */}
        <Card className="border bg-muted/30">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Created
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {new Date(article.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Last Updated
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {new Date(article.updated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
