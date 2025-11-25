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
import type { PageProps } from '@/types';

interface Department {
  id: number;
  name: string;
  code: string;
  is_support_team: boolean;
  is_active: boolean;
  description?: string | null;
}

interface DepartmentFormProps {
  department?: Department;
}

export default function DepartmentForm({ department }: DepartmentFormProps) {
  const isEdit = !!department;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing } = useForm({
    name: department?.name ?? '',
    code: department?.code ?? '',
    is_support_team: department?.is_support_team ?? false,
    is_active: department?.is_active ?? true,
    description: department?.description ?? '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && department) {
      put(route('admin.departments.update', department.id));
    } else {
      post(route('admin.departments.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Department' : 'New Department'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Edit Department' : 'New Department'}</h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update department information.' : 'Create a new department or support team.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.departments.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the department details below.'
                  : 'Fill in the information to create a new department.'}
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
                  placeholder="e.g. IT Support, Maintenance, HR"
                  required
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value.toUpperCase())}
                  placeholder="e.g. IT, MAINT, HR"
                  maxLength={20}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Short unique code for quick reference (max 20 characters)
                </p>
                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Describe the department's purpose and responsibilities..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_support_team"
                    checked={data.is_support_team}
                    onCheckedChange={(checked) => setData('is_support_team', Boolean(checked))}
                  />
                  <Label htmlFor="is_support_team" className="text-sm font-normal cursor-pointer">
                    This is a support team
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Support teams can receive and handle tickets
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                    Department is active
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Inactive departments won't appear in assignment options
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.departments.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Department' : 'Create Department'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

