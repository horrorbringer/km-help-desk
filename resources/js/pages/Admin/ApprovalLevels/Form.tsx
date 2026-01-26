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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PageProps } from '@/types';

interface ApprovalLevelFormProps {
  approvalLevel?: {
    id: number;
    code: string;
    label: string;
    description?: string | null;
    role_names: string[];
    hierarchy_order: number;
    is_active: boolean;
    is_system_level: boolean;
    sort_order: number;
    can_delete: boolean;
  };
  formOptions: {
    roles: string[];
  };
}

export default function ApprovalLevelForm({ approvalLevel, formOptions }: ApprovalLevelFormProps) {
  const isEdit = !!approvalLevel;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing } = useForm({
    code: approvalLevel?.code ?? '',
    label: approvalLevel?.label ?? '',
    description: approvalLevel?.description ?? '',
    role_names: approvalLevel?.role_names ?? [],
    hierarchy_order: approvalLevel?.hierarchy_order ?? 1,
    is_active: approvalLevel?.is_active ?? true,
    sort_order: approvalLevel?.sort_order ?? 0,
  });

  const toggleRole = (roleName: string) => {
    setData(
      'role_names',
      data.role_names.includes(roleName)
        ? data.role_names.filter((name) => name !== roleName)
        : [...data.role_names, roleName]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && approvalLevel) {
      put(route('admin.approval-levels.update', approvalLevel.id));
    } else {
      post(route('admin.approval-levels.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Approval Level' : 'New Approval Level'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Approval Level' : 'New Approval Level'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the approval level and its role mappings.'
                : 'Create a new approval level and assign roles that can approve at this level.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.approval-levels.index')}>← Back</Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Approval Level Information</CardTitle>
                <CardDescription>
                  {isEdit
                    ? 'Update the approval level details below.'
                    : 'Fill in the information to create a new approval level.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Code */}
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Code * <span className="text-xs text-muted-foreground">(lowercase, no spaces)</span>
                  </Label>
                  <Input
                    id="code"
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="e.g. lm, finance_manager, custom_approval"
                    required
                    disabled={approvalLevel?.is_system_level}
                    pattern="[a-z0-9_-]+"
                  />
                  {approvalLevel?.is_system_level && (
                    <p className="text-xs text-muted-foreground">
                      System approval level code cannot be changed
                    </p>
                  )}
                  {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={data.label}
                    onChange={(e) => setData('label', e.target.value)}
                    placeholder="e.g. Line Manager, Finance Manager"
                    required
                  />
                  {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Optional description of this approval level"
                    rows={3}
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>

                {/* Hierarchy Order */}
                <div className="space-y-2">
                  <Label htmlFor="hierarchy_order">
                    Hierarchy Order * <span className="text-xs text-muted-foreground">(lower = earlier in chain)</span>
                  </Label>
                  <Input
                    id="hierarchy_order"
                    type="number"
                    min="1"
                    max="100"
                    value={data.hierarchy_order}
                    onChange={(e) => setData('hierarchy_order', parseInt(e.target.value) || 1)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear earlier in the approval chain (e.g., 1 = first, 2 = second, etc.)
                  </p>
                  {errors.hierarchy_order && <p className="text-xs text-red-500">{errors.hierarchy_order}</p>}
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={data.sort_order}
                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for display ordering in lists (0 = first)
                  </p>
                  {errors.sort_order && <p className="text-xs text-red-500">{errors.sort_order}</p>}
                </div>

                {/* Roles */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Roles * <span className="text-xs text-muted-foreground">(who can approve at this level)</span></Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setData('role_names', formOptions.roles);
                      }}
                    >
                      Select All
                    </Button>
                  </div>
                  {errors.role_names && (
                    <p className="text-xs text-red-500">{errors.role_names}</p>
                  )}

                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <div className="space-y-2">
                      {formOptions.roles.map((roleName) => (
                        <div key={roleName} className="flex items-center gap-2">
                          <Checkbox
                            id={`role-${roleName}`}
                            checked={data.role_names.includes(roleName)}
                            onCheckedChange={() => toggleRole(roleName)}
                          />
                          <Label
                            htmlFor={`role-${roleName}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {roleName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {data.role_names.length === 0 && (
                    <p className="text-xs text-red-500">At least one role must be selected</p>
                  )}
                </div>

                {/* Is Active */}
                <div className="flex items-center space-x-2 border-t pt-4">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked === true)}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground ml-2">
                    Inactive approval levels won't be available for selection
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.approval-levels.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : isEdit ? 'Update Approval Level' : 'Create Approval Level'}
                </Button>
              </CardFooter>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>About Approval Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">What are Approval Levels?</p>
                  <p className="text-muted-foreground">
                    Approval levels define the stages in the approval workflow. Each level maps to specific roles that can approve tickets.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Code Format</p>
                  <p className="text-muted-foreground">
                    Use lowercase letters, numbers, underscores, and hyphens. Examples: <code className="text-xs">lm</code>, <code className="text-xs">finance_manager</code>, <code className="text-xs">custom-approval</code>
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Hierarchy Order</p>
                  <p className="text-muted-foreground">
                    Lower numbers come first in the approval chain. Level 1 approves before Level 2, and so on.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Role Mapping</p>
                  <p className="text-muted-foreground">
                    Select which roles can approve at this level. Users with any of these roles will be eligible to approve tickets requiring this level.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">System vs Custom</p>
                  <p className="text-muted-foreground">
                    System levels are built-in and cannot be deleted. Custom levels can be created and deleted as needed for your organization.
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

