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

interface Project {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  location?: string | null;
  project_manager_id?: string | number | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

interface ProjectFormProps {
  project?: Project;
  projectManagers: Array<{ id: number; name: string }>;
}

export default function ProjectForm({ project, projectManagers }: ProjectFormProps) {
  const isEdit = !!project;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing, transform } = useForm({
    name: project?.name ?? '',
    code: project?.code ?? '',
    description: project?.description ?? '',
    location: project?.location ?? '',
    project_manager_id: project?.project_manager_id ?? '__none',
    status: project?.status ?? 'planning',
    start_date: project?.start_date ?? '',
    end_date: project?.end_date ?? '',
    is_active: project?.is_active ?? true,
  });

  // Transform data before submission
  transform((data) => ({
    ...data,
    project_manager_id: data.project_manager_id === '__none' ? null : Number(data.project_manager_id),
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && project) {
      put(route('admin.projects.update', project.id));
    } else {
      post(route('admin.projects.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Project' : 'New Project'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Edit Project' : 'New Project'}</h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update project information.' : 'Create a new construction project.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.projects.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the project details below.'
                  : 'Fill in the information to create a new project.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name and Code */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. 3-Storey Residential Villa"
                    required
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Project Code *</Label>
                  <Input
                    id="code"
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                    placeholder="e.g. PRJ-2024-001"
                    maxLength={50}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Short unique code for quick reference
                  </p>
                  {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Describe the project scope, location, and key details..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Location and Manager */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="project_manager_id">Project Manager</Label>
                  <Select
                    value={data.project_manager_id.toString()}
                    onValueChange={(value) => setData('project_manager_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No manager assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">No manager assigned</SelectItem>
                      {projectManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.project_manager_id && (
                    <p className="text-xs text-red-500">{errors.project_manager_id}</p>
                  )}
                </div>
              </div>

              {/* Status and Dates */}
              <div className="grid gap-4 md:grid-cols-3">
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
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={data.end_date}
                    onChange={(e) => setData('end_date', e.target.value)}
                    min={data.start_date || undefined}
                  />
                  {errors.end_date && (
                    <p className="text-xs text-red-500">{errors.end_date}</p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                />
                <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                  Project is active
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Inactive projects won't appear in ticket assignment options
              </p>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.projects.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
