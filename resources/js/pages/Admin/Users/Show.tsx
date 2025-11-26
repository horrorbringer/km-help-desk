import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import type { PageProps } from '@/types';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  employee_id?: string | null;
  department?: { id: number; name: string } | null;
  roles?: Array<{ id: number; name: string }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserShowProps extends PageProps {
  user: User;
}

export default function UserShow({ user }: UserShowProps) {
  const { can } = usePermissions();
  useToast();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      router.delete(route('admin.users.destroy', { user: user.id }), {
        onSuccess: () => {
          toast.success(`User ${user.name} has been deleted.`);
        },
        onError: () => {
          toast.error('Failed to delete user.');
        },
      });
    }
  };

  return (
    <AppLayout>
      <Head title={`User: ${user.name}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href={route('admin.users.index')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {can('users.edit') && (
              <Button asChild variant="outline">
                <Link href={route('admin.users.edit', { user: user.id })}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Link>
              </Button>
            )}
            {can('users.delete') && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* User Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic user details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-base font-medium">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-base">{user.email}</p>
              </div>
              {user.employee_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                  <p className="text-base">{user.employee_id}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-base">{user.phone}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge
                    variant={user.is_active ? 'default' : 'secondary'}
                    className={user.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Department and role assignments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="text-base">
                  {user.department ? user.department.name : <span className="text-muted-foreground">—</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Roles</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role.id} variant="outline">
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Account creation and update information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-base">{new Date(user.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-base">{new Date(user.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

