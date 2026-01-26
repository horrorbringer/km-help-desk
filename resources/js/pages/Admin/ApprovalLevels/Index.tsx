import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Edit, Trash2, Power, PowerOff, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PageProps } from '@/types';

interface ApprovalLevel {
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
  created_at: string;
}

interface ApprovalLevelsIndexProps extends PageProps {
  approvalLevels: ApprovalLevel[];
  filters: {
    q?: string;
    is_active?: string;
    is_system_level?: string;
  };
  formOptions: {
    roles: string[];
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function ApprovalLevelsIndex() {
  const { approvalLevels, filters, flash } = usePage<ApprovalLevelsIndexProps>().props;
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(filters.q || '');

  React.useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash, toast]);

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.approval-levels.index'), newFilters, { preserveState: true, replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilter('q', searchQuery);
  };

  const handleDelete = (id: number) => {
    router.delete(route('admin.approval-levels.destroy', id), {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(null);
        toast.success('Approval level deleted successfully.');
      },
    });
  };

  const handleToggleStatus = (id: number) => {
    router.post(route('admin.approval-levels.toggle-status', id), {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Approval level status updated.');
      },
    });
  };

  return (
    <AppLayout>
      <Head title="Approval Levels" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approval Levels</h1>
            <p className="text-muted-foreground mt-1">
              Manage approval levels and their role mappings
            </p>
          </div>
          <Link href={route('admin.approval-levels.create')}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Approval Level
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <form onSubmit={handleSearch} className="md:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search approval levels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              <Select
                value={filters.is_active || '__all'}
                onValueChange={(value) => handleFilter('is_active', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Statuses</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.is_system_level || '__all'}
                onValueChange={(value) => handleFilter('is_system_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Types</SelectItem>
                  <SelectItem value="1">System Levels</SelectItem>
                  <SelectItem value="0">Custom Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Approval Levels Table */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Levels ({approvalLevels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {approvalLevels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No approval levels found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Hierarchy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvalLevels.map((level) => (
                      <TableRow key={level.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {level.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{level.label}</p>
                            {level.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {level.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {level.role_names.slice(0, 2).map((role, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                            {level.role_names.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{level.role_names.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{level.hierarchy_order}</span>
                        </TableCell>
                        <TableCell>
                          {level.is_active ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {level.is_system_level ? (
                            <Badge variant="outline">System</Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(level.id)}
                              title={level.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {level.is_active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={route('admin.approval-levels.edit', level.id)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            {level.can_delete && (
                              <AlertDialog
                                open={deleteDialogOpen === level.id}
                                onOpenChange={(open) => setDeleteDialogOpen(open ? level.id : null)}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Approval Level</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{level.label}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(level.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

