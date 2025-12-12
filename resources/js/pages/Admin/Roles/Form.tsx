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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PageProps } from '@/types';

interface Permission {
  id: number;
  name: string;
  label: string;
}

interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

interface RoleFormProps {
  role?: {
    id: number;
    name: string;
    permission_ids: number[];
  };
  permissions: PermissionGroup[];
}

export default function RoleForm({ role, permissions }: RoleFormProps) {
  const isEdit = !!role;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing } = useForm({
    name: role?.name ?? '',
    permissions: (role?.permission_ids ?? []) as number[],
  });

  const togglePermission = (permissionId: number) => {
    setData(
      'permissions',
      data.permissions.includes(permissionId)
        ? data.permissions.filter((id) => id !== permissionId)
        : [...data.permissions, permissionId]
    );
  };

  const toggleGroup = (groupPermissions: Permission[]) => {
    const groupIds = groupPermissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => data.permissions.includes(id));

    if (allSelected) {
      // Deselect all
      setData(
        'permissions',
        data.permissions.filter((id) => !groupIds.includes(id))
      );
    } else {
      // Select all
      setData('permissions', [...new Set([...data.permissions, ...groupIds])]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && role) {
      put(route('admin.roles.update', role.id));
    } else {
      post(route('admin.roles.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Role' : 'New Role'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Edit Role' : 'New Role'}</h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the role and its permissions.'
                : 'Create a new role and assign permissions.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.roles.index')}>← Back</Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Role Information</CardTitle>
                <CardDescription>
                  {isEdit
                    ? 'Update the role details below.'
                    : 'Fill in the information to create a new role.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Support Agent"
                    required
                    disabled={role?.name === 'Super Admin'} // TODO: Use role constants
                  />
                  {role?.name === 'Super Admin' && ( // TODO: Use role constants
                    <p className="text-xs text-muted-foreground">
                      Super Admin role name cannot be changed
                    </p>
                  )}
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Permissions */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Permissions</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allIds = permissions.flatMap((g) => g.permissions.map((p) => p.id));
                        setData('permissions', allIds);
                      }}
                    >
                      Select All
                    </Button>
                  </div>

                  <ScrollArea className="h-[500px] border rounded-lg p-4">
                    <div className="space-y-6">
                      {permissions.map((group) => {
                        const groupIds = group.permissions.map((p) => p.id);
                        const allSelected = groupIds.every((id) => data.permissions.includes(id));
                        const someSelected = groupIds.some((id) => data.permissions.includes(id));

                        return (
                          <div key={group.group} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={allSelected}
                                ref={(el) => {
                                  if (el) {
                                    el.indeterminate = someSelected && !allSelected;
                                  }
                                }}
                                onCheckedChange={() => toggleGroup(group.permissions)}
                              />
                              <Label className="font-semibold capitalize">
                                {group.group.replace('-', ' ')}
                              </Label>
                            </div>
                            <div className="ml-6 space-y-2">
                              {group.permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`permission-${permission.id}`}
                                    checked={data.permissions.includes(permission.id)}
                                    onCheckedChange={() => togglePermission(permission.id)}
                                  />
                                  <Label
                                    htmlFor={`permission-${permission.id}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {permission.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.roles.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing || role?.name === 'Super Admin'}>
                  {processing ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
                </Button>
              </CardFooter>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>About Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Role-Based Access</p>
                  <p className="text-muted-foreground">
                    Roles define what users can do in the system. Assign permissions to control
                    access to features.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Default Roles</p>
                  <p className="text-muted-foreground">
                    Super Admin has all permissions. Agent and Requester roles have limited access
                    for their specific needs.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Permissions</p>
                  <p className="text-muted-foreground">
                    Select the permissions this role should have. Users with this role will inherit
                    all selected permissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

