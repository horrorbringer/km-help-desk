import React, { useState } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
}

interface UsersIndexProps extends PageProps {
  users: {
    data: User[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    department?: string;
    is_active?: string;
  };
  departments: Array<{ id: number; name: string }>;
  roles: Array<{ id: number; name: string }>;
  stats: {
    total: number;
    active: number;
    inactive: number;
    with_department: number;
  };
}

export default function UsersIndex() {
  const pageProps = usePage<UsersIndexProps>().props;
  const { users, filters, departments, roles, stats } = pageProps;
  const { can } = usePermissions();
  useToast(); // Initialize toast notifications
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogAction, setBulkDialogAction] = useState<string>('');
  const [bulkDialogValue, setBulkDialogValue] = useState<string>('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
  
  const { data: importData, setData: setImportData, post: importPost, processing: importProcessing, errors: importErrors } = useForm({
    file: null as File | null,
  });

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.users.index'), newFilters, { preserveState: true, replace: true });
    setSelectedUsers([]); // Clear selection when filters change
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.data.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      return;
    }

    setBulkDialogAction(action);
    setBulkDialogValue('');
    setBulkDialogOpen(true);
  };

  const handleBulkSubmit = () => {
    if (selectedUsers.length === 0) {
      return;
    }

    if (bulkDialogAction === 'delete') {
      router.post(
        route('admin.users.bulk-delete'),
        { user_ids: selectedUsers },
        {
          onSuccess: () => {
            toast.success(`Successfully deleted ${selectedUsers.length} user(s).`);
            setSelectedUsers([]);
            setBulkDialogOpen(false);
          },
          onError: () => {
            toast.error('Failed to delete users.');
          },
        }
      );
    } else {
      const payload: any = {
        user_ids: selectedUsers,
        action: bulkDialogAction,
      };

      // Only include value if the action requires it
      if (['assign_department', 'assign_role', 'remove_role'].includes(bulkDialogAction)) {
        payload.value = bulkDialogValue;
      }

      router.post(
        route('admin.users.bulk-update'),
        payload,
        {
          onSuccess: () => {
            toast.success(`Successfully updated ${selectedUsers.length} user(s).`);
            setSelectedUsers([]);
            setBulkDialogOpen(false);
            setBulkDialogValue('');
          },
          onError: (errors) => {
            console.error('Bulk update errors:', errors);
            toast.error('Failed to update users.');
          },
        }
      );
    }
  };

  const handleToggleActive = (user: User) => {
    router.post(route('admin.users.toggle-active', { user: user.id }), {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`User ${user.name} has been ${user.is_active ? 'deactivated' : 'activated'}.`);
      },
      onError: () => {
        toast.error('Failed to update user status.');
      },
    });
  };

  const allSelected = users.data.length > 0 && selectedUsers.length === users.data.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.data.length;

  return (
    <AppLayout>
      <Head title="Users" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage system users, agents, and requesters</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = route('admin.users.export', filters);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {can('users.create') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button asChild>
                  <Link href={route('admin.users.create')}>+ New User</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Inactive Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.with_department}</div>
              <p className="text-xs text-muted-foreground">With Department</p>
            </CardContent>
          </Card>
        </div>


        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.department as string) ?? '__all'}
              onValueChange={(value) => handleFilter('department', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.is_active as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_active', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All statuses</SelectItem>
                <SelectItem value="1">Active only</SelectItem>
                <SelectItem value="0">Inactive only</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Users ({users.total})</CardTitle>
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {selectedUsers.length} selected
                  </span>
                  {can('users.edit') && (
                    <div className="flex items-center gap-2">
                      <Select value={bulkAction} onValueChange={handleBulkAction}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Bulk Actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activate">Activate</SelectItem>
                          <SelectItem value="deactivate">Deactivate</SelectItem>
                          <SelectItem value="assign_department">Assign Department</SelectItem>
                          <SelectItem value="assign_role">Assign Role</SelectItem>
                          <SelectItem value="remove_role">Remove Role</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {can('users.delete') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                    >
                      Delete Selected
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {users.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          ref={(el) => {
                            if (el) {
                              (el as any).indeterminate = someSelected;
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Employee ID</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Roles</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-muted/50 transition">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.employee_id ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.department?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role.id} variant="outline" className="text-xs">
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.phone ?? '—'}</td>
                        <td className="px-4 py-3">
                          {can('users.edit') ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              className="h-auto p-1"
                            >
                              <Badge
                                variant={user.is_active ? 'default' : 'secondary'}
                                className={user.is_active ? 'bg-emerald-100 text-emerald-800 cursor-pointer hover:bg-emerald-200' : 'cursor-pointer'}
                              >
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </Button>
                          ) : (
                            <Badge
                              variant={user.is_active ? 'default' : 'secondary'}
                              className={user.is_active ? 'bg-emerald-100 text-emerald-800' : ''}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {can('users.edit') && (
                              <Button asChild variant="outline" size="sm">
                                <Link href={route('admin.users.edit', { user: user.id })}>Edit</Link>
                              </Button>
                            )}
                            {can('users.delete') && (
                              <AlertDialog
                                open={deleteDialogOpen === user.id}
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setDeleteDialogOpen(null);
                                  }
                                }}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteDialogOpen(user.id)}
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{user.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        router.delete(route('admin.users.destroy', { user: user.id }), {
                                          onSuccess: () => {
                                            toast.success(`User ${user.name} has been deleted.`);
                                            setDeleteDialogOpen(null);
                                          },
                                          onError: () => {
                                            toast.error('Failed to delete user.');
                                          },
                                        });
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {users.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {users.links.map((link) => (
                  <Button
                    key={link.label}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Action Dialog */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bulkDialogAction === 'activate' && 'Activate Users'}
                {bulkDialogAction === 'deactivate' && 'Deactivate Users'}
                {bulkDialogAction === 'assign_department' && 'Assign Department'}
                {bulkDialogAction === 'assign_role' && 'Assign Role'}
                {bulkDialogAction === 'remove_role' && 'Remove Role'}
                {bulkDialogAction === 'delete' && 'Delete Users'}
              </DialogTitle>
              <DialogDescription>
                This will affect {selectedUsers.length} user(s).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {bulkDialogAction === 'assign_department' && (
                <Select value={bulkDialogValue} onValueChange={setBulkDialogValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {bulkDialogAction === 'assign_role' && (
                <Select value={bulkDialogValue} onValueChange={setBulkDialogValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {bulkDialogAction === 'remove_role' && (
                <Select value={bulkDialogValue} onValueChange={setBulkDialogValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role to Remove" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(bulkDialogAction === 'activate' || bulkDialogAction === 'deactivate') && (
                <p className="text-sm text-muted-foreground">
                  {bulkDialogAction === 'activate'
                    ? 'Selected users will be activated and can log in to the system.'
                    : 'Selected users will be deactivated and cannot log in to the system.'}
                </p>
              )}

              {bulkDialogAction === 'delete' && (
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete {selectedUsers.length} user(s)? This action cannot be undone.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={
                  bulkDialogAction !== 'delete' &&
                  bulkDialogAction !== 'activate' &&
                  bulkDialogAction !== 'deactivate' &&
                  !bulkDialogValue
                }
                variant={bulkDialogAction === 'delete' ? 'destructive' : 'default'}
              >
                {bulkDialogAction === 'delete' ? 'Delete' : 'Apply'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Users from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import users. The file should have the following columns:
                Name, Email, Employee ID, Phone, Department, Roles, Status
                <br />
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs mt-2"
                  onClick={() => {
                    const csvContent = 'Name,Email,Employee ID,Phone,Department,Roles,Status\nJohn Doe,john@example.com,EMP-001,+855 12 345 678,IT,Agent,Active\nJane Smith,jane@example.com,EMP-002,+855 12 345 679,HR,Requester,Active';
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'users_template.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  Download CSV Template
                </Button>
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (importData.file) {
                  importPost(route('admin.users.import'), {
                    forceFormData: true,
                    onSuccess: () => {
                      toast.success('Users imported successfully!');
                      setImportDialogOpen(false);
                      setImportData('file', null);
                    },
                    onError: () => {
                      toast.error('Failed to import users. Please check the file format.');
                    },
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="file" className="text-sm font-medium">
                  CSV File
                </label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImportData('file', file);
                  }}
                  required
                />
                {importErrors.file && (
                  <p className="text-xs text-red-500">{importErrors.file}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 2MB. Format: CSV with headers: Name, Email, Employee ID, Phone, Department, Roles, Status
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setImportDialogOpen(false);
                    setImportData('file', null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={importProcessing || !importData.file}>
                  {importProcessing ? 'Importing...' : 'Import Users'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

