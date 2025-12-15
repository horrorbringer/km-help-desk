import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
  is_support_team: boolean;
  is_active: boolean;
  description?: string | null;
  users: Array<{
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: Array<{
      id: number;
      name: string;
    }>;
  }>;
  users_count: number;
  recent_tickets: Array<{
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
  }>;
  tickets_count: number;
  created_at: string;
}

interface DepartmentShowProps {
  department: Department;
}

const statusColorMap: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-amber-100 text-amber-800',
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-200 text-slate-800',
  cancelled: 'bg-gray-200 text-gray-700',
};

const priorityColorMap: Record<string, string> = {
  low: 'bg-slate-200 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function DepartmentShow({ department }: DepartmentShowProps) {
  const { can } = usePermissions();
  const { toast } = useToast();

  const handleDelete = () => {
    router.delete(route('admin.departments.destroy', department.id), {
      onSuccess: () => {
        toast.success('Department deleted successfully.');
      },
      onError: () => {
        toast.error('Failed to delete department.');
      },
    });
  };

  return (
    <AppLayout>
      <Head title={department.name} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Department: {department.code}</p>
            <h1 className="text-3xl font-bold">{department.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={route('admin.departments.index')}>← Back</Link>
            </Button>
            {can('departments.edit') && (
              <Button asChild>
                <Link href={route('admin.departments.edit', department.id)}>Edit</Link>
              </Button>
            )}
            {can('departments.delete') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Department</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{department.name}"? This action cannot be undone.
                      {department.users_count > 0 && (
                        <span className="block mt-2 text-red-600 font-medium">
                          Warning: This department has {department.users_count} user(s) assigned. You must reassign or remove all users before deleting.
                        </span>
                      )}
                      {department.tickets_count > 0 && (
                        <span className="block mt-2 text-red-600 font-medium">
                          Warning: This department has {department.tickets_count} ticket(s) assigned. You must reassign or close all tickets before deleting.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Department Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Department Information</CardTitle>
                <CardDescription>Details and configuration</CardDescription>
              </div>
              <div className="flex gap-2">
                {department.is_support_team && (
                  <Badge variant="default">Support Team</Badge>
                )}
                <Badge
                  variant={department.is_active ? 'default' : 'secondary'}
                  className={department.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                >
                  {department.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {department.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {department.description}
                </p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Code</h3>
                <p className="text-sm font-medium">{department.code}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Created
                </h3>
                <p className="text-sm font-medium">
                  {new Date(department.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members ({department.users.length})</CardTitle>
                  <CardDescription>Users assigned to this department</CardDescription>
                </div>
                {can('users.view') && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={route('admin.users.index', { department: department.id })}>
                      Manage Users
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {department.users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No team members assigned yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {department.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded border hover:bg-muted/50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.roles && user.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.roles.map((role) => (
                              <Badge key={role.id} variant="outline" className="text-xs">
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge
                          variant={user.is_active ? 'default' : 'secondary'}
                          className={user.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {can('users.edit') && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.users.edit', user.id)}>Edit</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Tickets</CardTitle>
                  <CardDescription>Latest tickets assigned to this team</CardDescription>
                </div>
                {can('tickets.view') && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={route('admin.tickets.index', { team: department.id })}>
                      View All
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {department.recent_tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tickets assigned yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {department.recent_tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={route('admin.tickets.show', ticket.id)}
                      className="block p-3 rounded border hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ticket.ticket_number}</p>
                          <p className="text-xs text-muted-foreground truncate">{ticket.subject}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusColorMap[ticket.status] ?? ''}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${priorityColorMap[ticket.priority] ?? ''}`}
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

