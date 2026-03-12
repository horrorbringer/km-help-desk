import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { X, CheckCircle2, XCircle, Loader2, Sparkles, Pause } from 'lucide-react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

interface Department {
  id: number;
  name: string;
  code: string;
  is_support_team: boolean;
  is_active: boolean;
  description?: string | null;
  telegram_chat_id?: string | null;
  users_count: number;
  tickets_count: number;
  created_at: string;
}

interface DepartmentsIndexProps extends PageProps {
  departments: {
    data: Department[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    is_support_team?: string;
    is_active?: string;
  };
}

export default function DepartmentsIndex() {
  const { departments, filters } = usePage<DepartmentsIndexProps>().props;
  const { can } = usePermissions();
  useToast();
  
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogAction, setBulkDialogAction] = useState<string>('');
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.departments.index'), newFilters, { preserveState: true, replace: true });
    setSelectedDepartments([]); // Clear selection when filters change
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDepartments(departments.data.map((dept) => dept.id));
    } else {
      setSelectedDepartments([]);
    }
  };

  const handleSelectDepartment = (departmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedDepartments([...selectedDepartments, departmentId]);
    } else {
      setSelectedDepartments(selectedDepartments.filter((id) => id !== departmentId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedDepartments.length === 0) {
      return;
    }
    setBulkDialogAction(action);
    setBulkDialogOpen(true);
  };

  const handleBulkSubmit = () => {
    if (selectedDepartments.length === 0) {
      return;
    }

    const count = selectedDepartments.length;
    const actionLabels: Record<string, { loading: string; success: string; error: string }> = {
      activate: {
        loading: `Activating ${count} department${count === 1 ? '' : 's'}...`,
        success: `Successfully activated ${count} department${count === 1 ? '' : 's'}`,
        error: 'Failed to activate departments',
      },
      deactivate: {
        loading: `Deactivating ${count} department${count === 1 ? '' : 's'}...`,
        success: `Successfully deactivated ${count} department${count === 1 ? '' : 's'}`,
        error: 'Failed to deactivate departments',
      },
    };

    const labels = actionLabels[bulkDialogAction] || {
      loading: 'Processing...',
      success: 'Operation completed successfully',
      error: 'Operation failed',
    };

    const toastId = toast.loading(labels.loading, {
      description: `Processing ${count} department${count === 1 ? '' : 's'}`,
      duration: Infinity,
      icon: <Loader2 className="size-5 text-blue-600 animate-spin" />,
    });

    router.post(
      route('admin.departments.bulk-update'),
      {
        department_ids: selectedDepartments,
        action: bulkDialogAction,
      },
      {
        preserveScroll: true,
        onSuccess: (page) => {
          toast.dismiss(toastId);
          const icon = bulkDialogAction === 'activate' ? <Sparkles className="size-5 text-white" /> : <Pause className="size-5 text-white" />;
          
          const description = bulkDialogAction === 'activate'
            ? `${count} department${count === 1 ? '' : 's'} ${count === 1 ? 'is' : 'are'} now active and can receive new tickets.`
            : `${count} department${count === 1 ? '' : 's'} ${count === 1 ? 'is' : 'are'} now inactive. Users remain active but departments won't receive new tickets.`;
          
          toast.success(labels.success, {
            description: description,
            duration: 5000,
            icon: icon,
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
            },
          });
          setSelectedDepartments([]);
          setBulkDialogOpen(false);
        },
        onError: (errors) => {
          toast.dismiss(toastId);
          const errorMessage = errors?.message || labels.error;
          toast.error(labels.error, {
            description: errorMessage,
            duration: 5000,
            icon: <XCircle className="size-5 text-white" />,
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
            },
          });
        },
      }
    );
  };

  const handleToggleStatus = (department: Department) => {
    if (togglingStatus === department.id) return;
    
    const newStatus = !department.is_active;
    const action = newStatus ? 'activated' : 'deactivated';
    
    setTogglingStatus(department.id);
    
    const toastId = toast.loading(
      `${newStatus ? 'Activating' : 'Deactivating'} department...`,
      {
        description: `Updating "${department.name}" status`,
        duration: Infinity,
        icon: newStatus ? <Sparkles className="size-5 text-blue-600" /> : <Pause className="size-5 text-amber-600" />,
      }
    );
    
    router.post(
      route('admin.departments.toggle-status', department.id),
      {},
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setTogglingStatus(null);
          toast.dismiss(toastId);
          
          // Get user count from response if available
          const usersCount = department.users_count || 0;
          const description = newStatus 
            ? `"${department.name}" is now active and can receive new tickets.`
            : usersCount > 0
              ? `"${department.name}" is now inactive. ${usersCount} user${usersCount > 1 ? 's remain' : ' remains'} assigned and will stay active.`
              : `"${department.name}" is now inactive and will not receive new tickets.`;
          
          toast.success(
            `Department ${action} successfully!`,
            {
              description: description,
              duration: 5000,
              icon: <CheckCircle2 className="size-5 text-white" />,
              style: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
              },
            }
          );
        },
        onError: (errors) => {
          setTogglingStatus(null);
          toast.dismiss(toastId);
          const errorMessage = errors?.message || 'Failed to update department status';
          toast.error(
            'Failed to update status',
            {
              description: errorMessage,
              duration: 5000,
              icon: <XCircle className="size-5 text-white" />,
              style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
              },
            }
          );
        },
      }
    );
  };

  const isITTeam = (dept: Department) => {
    const name = dept.name.toLowerCase();
    const code = dept.code?.toLowerCase() || '';
    return name.includes('it') || code.includes('it') || code.includes('it-sd');
  };

  const allSelected = departments.data.length > 0 && selectedDepartments.length === departments.data.length;
  const someSelected = selectedDepartments.length > 0 && selectedDepartments.length < departments.data.length;

  return (
    <AppLayout>
      <Head title="Departments" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground">Manage departments and support teams</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-muted rounded-md mr-2">
              <Button 
                variant={viewType === 'grid' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8 px-3"
                onClick={() => setViewType('grid')}
              >
                Grid
              </Button>
              <Button 
                variant={viewType === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8 px-3"
                onClick={() => setViewType('list')}
              >
                List
              </Button>
            </div>
            {can('departments.create') && (
              <Button asChild>
                <Link href={route('admin.departments.create')}>+ New Department</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name, code, or description..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilter('q', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFilter('q', e.currentTarget.value);
                }
              }}
            />
            <Select
              value={(filters.is_support_team as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_support_team', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All types</SelectItem>
                <SelectItem value="1">Support teams only</SelectItem>
                <SelectItem value="0">Regular departments only</SelectItem>
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

        {/* Bulk Actions Bar */}
        {selectedDepartments.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedDepartments.length} department{selectedDepartments.length === 1 ? '' : 's'} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDepartments([])}
                    className="h-7 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="text-xs"
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="text-xs"
                  >
                    Deactivate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Departments View */}
        {departments.data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No departments found.
            </CardContent>
          </Card>
        ) : viewType === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.data.map((department) => {
              const isIT = isITTeam(department);
              return (
                <Card 
                  key={department.id} 
                  className={cn(
                    "hover:shadow-md transition-shadow relative",
                    isIT && "ring-2 ring-primary/30 bg-primary/5",
                    !department.is_active && "opacity-60"
                  )}
                >
                  <div className="absolute top-2 right-2 flex gap-1">
                    {department.telegram_chat_id && (
                      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] h-5 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        TG
                      </Badge>
                    )}
                    {isIT && (
                      <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                        IT Team
                      </Badge>
                    )}
                  </div>
                  {can('departments.edit') && (
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedDepartments.includes(department.id)}
                        onCheckedChange={(checked) => handleSelectDepartment(department.id, checked as boolean)}
                        aria-label={`Select ${department.name}`}
                      />
                    </div>
                  )}
                  <CardHeader className={cn("pt-10", (isIT || department.telegram_chat_id) && "pt-12")}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className={cn("text-lg", isIT && "text-primary font-bold")}>
                          {department.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Code: {department.code}</p>
                      </div>
                      <div className="flex gap-1">
                        {department.is_support_team && (
                          <Badge variant="default" className="text-xs">
                            Support
                          </Badge>
                        )}
                        <Badge
                          variant={department.is_active ? 'default' : 'secondary'}
                          className={cn(
                            department.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
                            can('departments.edit') && 'cursor-pointer hover:opacity-80 transition-opacity',
                            togglingStatus === department.id && 'opacity-50 cursor-wait'
                          )}
                          onClick={() => can('departments.edit') && handleToggleStatus(department)}
                        >
                          {togglingStatus === department.id ? '...' : department.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {department.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {department.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-muted-foreground">Users:</span>{' '}
                          <span className="font-medium">{department.users_count}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tickets:</span>{' '}
                          <span className="font-medium">{department.tickets_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {can('departments.view') && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.departments.show', department.id)}>View</Link>
                          </Button>
                        )}
                        {can('departments.edit') && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.departments.edit', department.id)}>Edit</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 w-10">
                      <Checkbox 
                        checked={allSelected} 
                        onCheckedChange={handleSelectAll} 
                        className={cn(someSelected && "opacity-50")}
                      />
                    </th>
                    <th className="px-6 py-3">Department Name</th>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Telegram</th>
                    <th className="px-6 py-3">Users</th>
                    <th className="px-6 py-3 text-right">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {departments.data.map((department) => (
                    <tr 
                      key={department.id} 
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        !department.is_active && "opacity-60"
                      )}
                    >
                      <td className="px-6 py-4">
                        <Checkbox 
                          checked={selectedDepartments.includes(department.id)}
                          onCheckedChange={(checked) => handleSelectDepartment(department.id, checked as boolean)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={route('admin.departments.show', department.id)}
                            className="font-medium hover:underline text-primary"
                          >
                            {department.name}
                          </Link>
                          {isITTeam(department) && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">
                              IT
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{department.code}</td>
                      <td className="px-6 py-4">
                        {department.is_support_team ? (
                          <Badge variant="outline" className="font-normal">Support Team</Badge>
                        ) : (
                          <span className="text-muted-foreground">Regular</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {department.telegram_chat_id ? (
                          <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 px-2 py-1 rounded-full border border-sky-100 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            Connected
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not Configured</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">{department.users_count}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge
                          variant={department.is_active ? 'default' : 'secondary'}
                          className={cn(
                            department.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600',
                            can('departments.edit') && 'cursor-pointer hover:opacity-80 transition-opacity',
                            togglingStatus === department.id && 'opacity-50 cursor-wait'
                          )}
                          onClick={() => can('departments.edit') && handleToggleStatus(department)}
                        >
                          {department.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {can('departments.edit') && (
                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Link href={route('admin.departments.edit', department.id)}>
                                <Sparkles className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Bulk Action Dialog */}
        {bulkDialogOpen && (
          <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {bulkDialogAction === 'activate' ? 'Activate Departments' : 'Deactivate Departments'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {bulkDialogAction === 'activate' ? (
                    <>
                      Are you sure you want to activate {selectedDepartments.length} department{selectedDepartments.length === 1 ? '' : 's'}?
                      Active departments can receive tickets.
                    </>
                  ) : (
                    <>
                      Are you sure you want to deactivate {selectedDepartments.length} department{selectedDepartments.length === 1 ? '' : 's'}?
                      Inactive departments will not receive new tickets.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBulkDialogOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkSubmit}>
                  {bulkDialogAction === 'activate' ? 'Activate' : 'Deactivate'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Pagination */}
        {departments.links.length > 3 && (
          <div className="flex justify-end gap-2">
            {departments.links.map((link) => (
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
      </div>
    </AppLayout>
  );
}

