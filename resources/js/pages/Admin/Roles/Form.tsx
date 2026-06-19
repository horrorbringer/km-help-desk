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
import { Badge } from '@/components/ui/badge';
import { SUPER_ADMIN } from '@/constants/roles';
import type { PageProps } from '@/types';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

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
  const [search, setSearch] = useState('');

  const { data, setData, post, put, processing } = useForm({
    name: role?.name ?? '',
    permissions: (role?.permission_ids ?? []) as number[],
  });

  const normalizedSearch = search.trim().toLowerCase();
  const totalPermissions = permissions.reduce(
    (count, group) => count + group.permissions.length,
    0,
  );
  const filteredPermissions = permissions
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((permission) => {
        if (!normalizedSearch) return true;

        return (
          permission.label.toLowerCase().includes(normalizedSearch) ||
          permission.name.toLowerCase().includes(normalizedSearch) ||
          group.group.toLowerCase().includes(normalizedSearch)
        );
      }),
    }))
    .filter((group) => group.permissions.length > 0);
  const selectedCount = data.permissions.length;

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

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isEdit ? 'Edit Role' : 'New Role'}
              </h1>
              <Badge variant="secondary" className="text-xs">
                {selectedCount}/{totalPermissions}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? 'Update the role and its permissions.'
                : 'Create a new role and assign permissions.'}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={route('admin.roles.index')}>Back</Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="border-b pb-4">
                <CardTitle>Role Information</CardTitle>
                <CardDescription>
                  {isEdit
                    ? 'Update the role details below.'
                    : 'Fill in the information to create a new role.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Support Agent"
                    required
                    disabled={role?.name === SUPER_ADMIN}
                  />
                  {role?.name === SUPER_ADMIN && (
                    <p className="text-xs text-muted-foreground">
                      Super Admin role name cannot be changed
                    </p>
                  )}
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Permissions</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-normal">
                        {selectedCount} selected
                      </Badge>
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
                  </div>

                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter permissions"
                      className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                    {search && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSearch('')}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="h-[420px] rounded-md border">
                    <div className="space-y-4 p-4">
                      {filteredPermissions.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                          No permissions match your search.
                        </p>
                      ) : (
                        filteredPermissions.map((group) => {
                        const groupIds = group.permissions.map((p) => p.id);
                        const allSelected = groupIds.every((id) => data.permissions.includes(id));
                        const someSelected = groupIds.some((id) => data.permissions.includes(id));

                        return (
                          <div key={group.group} className="space-y-2 rounded-md border bg-background p-3">
                            <div className="flex items-center justify-between gap-3">
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
                              <Badge variant="outline" className="font-normal">
                                {group.permissions.length}
                              </Badge>
                            </div>
                            <div className="grid gap-2 pl-6">
                              {group.permissions.map((permission) => (
                                <div key={permission.id} className="flex items-start gap-2">
                                  <Checkbox
                                    id={`permission-${permission.id}`}
                                    checked={data.permissions.includes(permission.id)}
                                    onCheckedChange={() => togglePermission(permission.id)}
                                  />
                                  <div className="min-w-0">
                                    <Label
                                      htmlFor={`permission-${permission.id}`}
                                      className="cursor-pointer text-sm font-normal leading-none"
                                    >
                                      {permission.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      {permission.name}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.roles.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing || role?.name === SUPER_ADMIN}>
                  {processing ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
                </Button>
              </CardFooter>
            </Card>

            {/* Help Card */}
            <Card className="lg:sticky lg:top-6">
              <CardHeader className="border-b pb-4">
                <CardTitle>About Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
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
