import React, { FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PageProps } from '@/types';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  category_id?: string | number | null;
  status: string;
  is_featured: boolean;
  sort_order: number;
  published_at?: string | null;
}

interface ArticleFormProps {
  article?: Article;
  categories: Array<{ id: number; name: string }>;
}

export default function ArticleForm({ article, categories }: ArticleFormProps) {
  const isEdit = !!article;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing, transform } = useForm({
    title: article?.title ?? '',
    slug: article?.slug ?? '',
    content: article?.content ?? '',
    excerpt: article?.excerpt ?? '',
    category_id: article?.category_id ?? '__none',
    status: article?.status ?? 'draft',
    is_featured: article?.is_featured ?? false,
    sort_order: article?.sort_order ?? 0,
    published_at: article?.published_at ?? '',
  });

  // Transform data before submission
  transform((data) => ({
    ...data,
    category_id: data.category_id === '__none' ? null : Number(data.category_id),
    sort_order: Number(data.sort_order),
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && article) {
      put(route('admin.knowledge-base.update', article.id));
    } else {
      post(route('admin.knowledge-base.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Article' : 'New Article'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Edit Article' : 'New Article'}</h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update the article.' : 'Create a new knowledge base article.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.knowledge-base.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the article details below.'
                  : 'Fill in the information to create a new article.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="e.g. How to Reset Your Password"
                  required
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => setData('slug', e.target.value)}
                  placeholder="Auto-generated from title"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (auto-generated if left blank)
                </p>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
              </div>

              {/* Category and Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category (Optional)</Label>
                  <Select
                    value={data.category_id.toString()}
                    onValueChange={(value) => setData('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">No category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-xs text-red-500">{errors.category_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData('status', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={data.excerpt}
                  onChange={(e) => setData('excerpt', e.target.value)}
                  placeholder="Short summary that appears in article listings..."
                  rows={2}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Brief summary (max 500 characters)
                </p>
                {errors.excerpt && <p className="text-xs text-red-500">{errors.excerpt}</p>}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={data.content}
                  onChange={(e) => setData('content', e.target.value)}
                  placeholder="Write the full article content here..."
                  rows={15}
                  required
                />
                {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
              </div>

              {/* Published Date, Sort Order, and Featured */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="published_at">Published Date</Label>
                  <Input
                    id="published_at"
                    type="datetime-local"
                    value={data.published_at}
                    onChange={(e) => setData('published_at', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to publish immediately when status is "Published"
                  </p>
                  {errors.published_at && (
                    <p className="text-xs text-red-500">{errors.published_at}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={data.sort_order}
                    onChange={(e) => setData('sort_order', e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first
                  </p>
                  {errors.sort_order && (
                    <p className="text-xs text-red-500">{errors.sort_order}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="is_featured"
                      checked={data.is_featured}
                      onCheckedChange={(checked) => setData('is_featured', Boolean(checked))}
                    />
                    <Label htmlFor="is_featured" className="text-sm font-normal cursor-pointer">
                      Featured article
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Featured articles appear prominently
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.knowledge-base.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Article' : 'Create Article'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

