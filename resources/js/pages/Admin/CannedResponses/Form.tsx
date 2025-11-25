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

interface CannedResponse {
  id: number;
  title: string;
  content: string;
  category_id?: string | number | null;
  is_active: boolean;
}

interface CannedResponseFormProps {
  response?: CannedResponse;
  categories: Array<{ id: number; name: string }>;
}

export default function CannedResponseForm({
  response,
  categories,
}: CannedResponseFormProps) {
  const isEdit = !!response;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing, transform } = useForm({
    title: response?.title ?? '',
    content: response?.content ?? '',
    category_id: response?.category_id ?? '__none',
    is_active: response?.is_active ?? true,
  });

  // Transform data before submission
  transform((data) => ({
    ...data,
    category_id: data.category_id === '__none' ? null : Number(data.category_id),
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && response) {
      put(route('admin.canned-responses.update', response.id));
    } else {
      post(route('admin.canned-responses.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Canned Response' : 'New Canned Response'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Canned Response' : 'New Canned Response'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the canned response.'
                : 'Create a pre-written response for common scenarios.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.canned-responses.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Response Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the canned response details below.'
                  : 'Fill in the information to create a new canned response.'}
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
                  placeholder="e.g. Password Reset Instructions, Equipment Maintenance Request"
                  required
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category_id">Category (Optional)</Label>
                <Select
                  value={data.category_id.toString()}
                  onValueChange={(value) => setData('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No specific category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No specific category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this response to a specific ticket category for easier access
                </p>
                {errors.category_id && (
                  <p className="text-xs text-red-500">{errors.category_id}</p>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={data.content}
                  onChange={(e) => setData('content', e.target.value)}
                  placeholder="Write the response content here. You can use placeholders like {{ticket_number}} or {{requester_name}}..."
                  rows={10}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is the actual response text that will be used when replying to tickets
                </p>
                {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                />
                <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                  Response is active
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Inactive responses won't appear in the quick response list
              </p>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.canned-responses.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Response' : 'Create Response'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

