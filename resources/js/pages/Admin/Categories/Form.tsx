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

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | number | null;
  default_team_id?: string | number | null;
  is_active: boolean;
  sort_order: number;
}

interface CategoryFormProps {
  category?: Category;
  parentCategories: Array<{ id: number; name: string }>;
  departments: Array<{ id: number; name: string }>;
}

export default function CategoryForm({
  category,
  parentCategories,
  departments,
}: CategoryFormProps) {
  const isEdit = !!category;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing, transform } = useForm({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    parent_id: category?.parent_id ?? '__none',
    default_team_id: category?.default_team_id ? category.default_team_id.toString() : '',
    is_active: category?.is_active ?? true,
    sort_order: category?.sort_order ?? 0,
  });

  // Transform data before submission
  transform((data) => ({
    ...data,
    parent_id: data.parent_id === '__none' ? null : Number(data.parent_id),
    default_team_id: data.default_team_id ? Number(data.default_team_id) : null,
    sort_order: Number(data.sort_order),
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && category) {
      put(route('admin.categories.update', category.id));
    } else {
      post(route('admin.categories.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Category' : 'New Category'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Edit Category' : 'New Category'}</h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update category information.' : 'Create a new ticket category.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.categories.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the category details below.'
                  : 'Fill in the information to create a new category.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g. IT Support, Equipment Issue, Site Problem"
                  required
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => setData('slug', e.target.value)}
                  placeholder="Auto-generated from name"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (auto-generated if left blank)
                </p>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Describe when this category should be used..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Parent Category & Default Team */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="parent_id">Parent Category</Label>
                  <Select
                    value={data.parent_id.toString()}
                    onValueChange={(value) => setData('parent_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent (root category)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">No parent (root category)</SelectItem>
                      {parentCategories.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id.toString()}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Create a hierarchical structure (e.g., IT → Hardware → Laptop)
                  </p>
                  {errors.parent_id && (
                    <p className="text-xs text-red-500">{errors.parent_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_team_id">Default Team *</Label>
                  <Select
                    value={data.default_team_id}
                    onValueChange={(value) => setData('default_team_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default team" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tickets in this category will be auto-assigned to this team
                  </p>
                  {errors.default_team_id && (
                    <p className="text-xs text-red-500">{errors.default_team_id}</p>
                  )}
                </div>
              </div>

              {/* Sort Order & Active Status */}
              <div className="grid gap-4 md:grid-cols-2">
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
                    Lower numbers appear first in lists
                  </p>
                  {errors.sort_order && (
                    <p className="text-xs text-red-500">{errors.sort_order}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="is_active"
                      checked={data.is_active}
                      onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                    />
                    <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                      Category is active
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Inactive categories won't appear in ticket creation forms
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.categories.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

