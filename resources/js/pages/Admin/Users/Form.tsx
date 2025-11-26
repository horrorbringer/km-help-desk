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

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  employee_id?: string | null;
  department_id?: number | null;
  is_active: boolean;
}

interface UserFormProps {
  user?: User & { role_ids?: number[] };
  departments: Array<{ id: number; name: string }>;
  roles: Array<{ id: number; name: string }>;
}

export default function UserForm({ user, departments, roles }: UserFormProps) {
  const isEdit = !!user;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing, transform } = useForm({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    phone: user?.phone ?? '',
    employee_id: user?.employee_id ?? '',
    department_id: user?.department_id ? user.department_id.toString() : '__none',
    role_ids: (user?.role_ids ?? []) as number[],
    is_active: user?.is_active ?? true,
  });

  // Transform data before submission
  transform((data) => ({
    ...data,
    department_id: data.department_id === '__none' ? null : Number(data.department_id),
    password: data.password || undefined,
    password_confirmation: data.password ? data.password_confirmation : undefined,
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && user) {
      put(route('admin.users.update', user.id));
    } else {
      post(route('admin.users.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit User' : 'New User'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Edit User' : 'New User'}</h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update user information.' : 'Create a new system user.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.users.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the user details below.'
                  : 'Fill in the information to create a new user.'}
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
                  placeholder="Full name"
                  required
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password {isEdit ? '(leave blank to keep current)' : '*'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder={isEdit ? 'New password' : 'Password'}
                    required={!isEdit}
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                {data.password && (
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      placeholder="Confirm password"
                    />
                    {errors.password_confirmation && (
                      <p className="text-xs text-red-500">{errors.password_confirmation}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Employee ID & Phone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={data.employee_id}
                    onChange={(e) => setData('employee_id', e.target.value)}
                    placeholder="EMP-001"
                  />
                  {errors.employee_id && (
                    <p className="text-xs text-red-500">{errors.employee_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="+855 12 345 678"
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select
                  value={data.department_id}
                  onValueChange={(value) => setData('department_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department_id && (
                  <p className="text-xs text-red-500">{errors.department_id}</p>
                )}
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="space-y-2 border rounded-lg p-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={data.role_ids.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setData('role_ids', [...data.role_ids, role.id]);
                          } else {
                            setData(
                              'role_ids',
                              data.role_ids.filter((id) => id !== role.id)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.role_ids && (
                  <p className="text-xs text-red-500">{errors.role_ids}</p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                />
                <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                  User is active
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.users.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

