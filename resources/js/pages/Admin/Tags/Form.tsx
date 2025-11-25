import React, { FormEvent, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface TagFormProps {
  tag?: Tag;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
];

export default function TagForm({ tag }: TagFormProps) {
  const isEdit = !!tag;
  const { errors } = usePage<PageProps>().props;
  const [selectedColor, setSelectedColor] = useState(tag?.color || PRESET_COLORS[0]);

  const { data, setData, post, put, processing } = useForm({
    name: tag?.name ?? '',
    slug: tag?.slug ?? '',
    color: tag?.color || PRESET_COLORS[0],
  });

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setData('color', color);
  };

  const handleNameChange = (name: string) => {
    setData('name', name);
    // Auto-generate slug if not editing or if slug is empty
    if (!isEdit || !data.slug) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setData('slug', slug);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && tag) {
      put(route('admin.tags.update', tag.id));
    } else {
      post(route('admin.tags.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Tag' : 'New Tag'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Edit Tag' : 'New Tag'}</h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update the tag details.' : 'Create a new tag for organizing tickets.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.tags.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Tag Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the tag details below.'
                  : 'Fill in the information to create a new tag.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Urgent, Bug, Feature Request"
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

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <div className="space-y-3">
                  {/* Color Input */}
                  <div className="flex items-center gap-3">
                    <Input
                      id="color"
                      type="text"
                      value={data.color}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(value) || value === '') {
                          handleColorChange(value);
                        }
                      }}
                      placeholder="#3b82f6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      className="max-w-[120px]"
                    />
                    <div
                      className="w-12 h-12 rounded border-2 border-muted"
                      style={{ backgroundColor: selectedColor || '#3b82f6' }}
                    />
                    <Badge
                      style={{ backgroundColor: selectedColor || '#3b82f6', color: '#fff' }}
                      className="px-3 py-1"
                    >
                      Preview
                    </Badge>
                  </div>

                  {/* Preset Colors */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Preset Colors:</p>
                    <div className="grid grid-cols-8 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorChange(color)}
                          className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                            selectedColor === color ? 'border-foreground ring-2 ring-offset-2' : 'border-muted'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {errors.color && <p className="text-xs text-red-500">{errors.color}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.tags.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Tag' : 'Create Tag'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

