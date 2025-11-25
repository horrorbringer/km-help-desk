import React, { FormEvent } from 'react';
import { Link, useForm,router, usePage } from '@inertiajs/react';

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
// If you have a global PageProps type from Breeze:
import type { PageProps } from '@/types';

type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

interface Project {
  id: number;
  title: string;
  client_name?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: ProjectStatus;
  short_description?: string | null;
  description?: string | null;
  cover_image?: string | null;
  featured?: boolean | number | null;
}

interface ProjectFormData {
  title: string;
  client_name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  short_description: string;
  description: string;
  cover_image: string;
  featured: number; // 0 or 1
}

interface ProjectFormProps {
  project?: Project;
}

export default function Form({ project }: ProjectFormProps) {
  const isEdit = !!project;

  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing } = useForm<ProjectFormData>({
    title: project?.title ?? '',
    client_name: project?.client_name ?? '',
    location: project?.location ?? '',
    start_date: project?.start_date ?? '',
    end_date: project?.end_date ?? '',
    status: project?.status ?? 'planned',
    short_description: project?.short_description ?? '',
    description: project?.description ?? '',
    cover_image: project?.cover_image ?? '',
    featured: project?.featured ? 1 : 0,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && project) {
      put(route('admin.projects.update', project.id));
    } else {
      post(route('admin.projects.store'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isEdit ? 'Edit Project' : 'New Project'}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit ? 'Update project details.' : 'Create a new construction project.'}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={route('admin.projects.index')}>
              ← Back
            </Link>
          </Button>
        </div>

        {/* Form card */}
        <Card className="border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-base">Project information</CardTitle>
              <CardDescription>
                Fill in the core information for this project. You can manage images and phases
                later.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="e.g. 3-Storey Residential Villa in Phnom Penh"
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Client + Location */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="client_name">Client</Label>
                  <Input
                    id="client_name"
                    value={data.client_name}
                    onChange={(e) => setData('client_name', e.target.value)}
                    placeholder="Client name (optional)"
                  />
                  {errors.client_name && (
                    <p className="text-xs text-red-500">{errors.client_name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => setData('location', e.target.value)}
                    placeholder="e.g. Phnom Penh, Cambodia"
                  />
                  {errors.location && (
                    <p className="text-xs text-red-500">{errors.location}</p>
                  )}
                </div>
              </div>

              {/* Dates + Status */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start_date">Start date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={data.start_date}
                    onChange={(e) => setData('start_date', e.target.value)}
                  />
                  {errors.start_date && (
                    <p className="text-xs text-red-500">{errors.start_date}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end_date">End date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={data.end_date}
                    onChange={(e) => setData('end_date', e.target.value)}
                  />
                  {errors.end_date && (
                    <p className="text-xs text-red-500">{errors.end_date}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={data.status}
                    onValueChange={(value: ProjectStatus) => setData('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-xs text-red-500">{errors.status}</p>
                  )}
                </div>
              </div>

              {/* Short description */}
              <div className="space-y-1.5">
                <Label htmlFor="short_description">Short description</Label>
                <Textarea
                  id="short_description"
                  rows={3}
                  value={data.short_description}
                  onChange={(e) => setData('short_description', e.target.value)}
                  placeholder="A quick summary that appears in project cards and lists."
                />
                {errors.short_description && (
                  <p className="text-xs text-red-500">{errors.short_description}</p>
                )}
              </div>

              {/* Detail description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Detail description</Label>
                <Textarea
                  id="description"
                  rows={6}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Describe the project scope, challenges, and solutions..."
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Cover image URL (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="cover_image">Cover image URL (optional)</Label>
                <Input
                  id="cover_image"
                  value={data.cover_image}
                  onChange={(e) => setData('cover_image', e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                />
                {errors.cover_image && (
                  <p className="text-xs text-red-500">{errors.cover_image}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={!!data.featured}
                  onCheckedChange={(checked) =>
                    setData('featured', checked ? 1 : 0)
                  }
                />
                <Label htmlFor="featured" className="text-sm text-slate-700">
                  Featured on homepage
                </Label>
              </div>

              <Button type="submit" disabled={processing}>
                {processing
                  ? 'Saving...'
                  : isEdit
                    ? 'Update project'
                    : 'Create project'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
