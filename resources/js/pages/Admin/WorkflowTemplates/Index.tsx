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
import type { PageProps } from '@/types';

interface WorkflowTemplate {
  id: number;
  name: string;
  description?: string | null;
  category?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  priority: number;
  is_active: boolean;
  workflow_steps_count: number;
  created_at: string;
}

interface WorkflowTemplatesIndexProps extends PageProps {
  templates: {
    data: WorkflowTemplate[];
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    q?: string;
    category_id?: string;
    department_id?: string;
    is_active?: string;
  };
  formOptions: {
    categories: Array<{ value: number; label: string }>;
    departments: Array<{ value: number; label: string }>;
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function WorkflowTemplatesIndex() {
  const { templates, filters, formOptions, flash } = usePage<WorkflowTemplatesIndexProps>().props;
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
    router.get(route('admin.workflow-templates.index'), newFilters, { preserveState: true, replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilter('q', searchQuery);
  };

  const handleDelete = (id: number) => {
    router.delete(route('admin.workflow-templates.destroy', id), {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(null);
        toast.success('Workflow template deleted successfully.');
      },
    });
  };

  const handleToggleStatus = (id: number) => {
    router.post(route('admin.workflow-templates.toggle-status', id), {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Workflow template status updated.');
      },
    });
  };

  return (
    <AppLayout>
      <Head title="Workflow Templates" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflow Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage approval workflows and customize approval order
            </p>
          </div>
          <Link href={route('admin.workflow-templates.create')}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow Template
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
                    placeholder="Search workflows..."
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
                value={filters.category_id || '__all'}
                onValueChange={(value) => handleFilter('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Categories</SelectItem>
                  {formOptions.categories.map((cat) => (
                    <SelectItem key={cat.value} value={String(cat.value)}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.department_id || '__all'}
                onValueChange={(value) => handleFilter('department_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Departments</SelectItem>
                  {formOptions.departments.map((dept) => (
                    <SelectItem key={dept.value} value={String(dept.value)}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle>Templates ({templates.data.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {templates.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No workflow templates found.</p>
                <Link href={route('admin.workflow-templates.create')}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.data.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {template.priority > 0 && (
                          <Badge variant="outline">Priority: {template.priority}</Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {template.category && (
                          <span>Category: {template.category.name}</span>
                        )}
                        {template.department && (
                          <span>Department: {template.department.name}</span>
                        )}
                        <span>{template.workflow_steps_count} step(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(template.id)}
                        title={template.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {template.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={route('admin.workflow-templates.edit', template.id)}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog open={deleteDialogOpen === template.id} onOpenChange={(open) => setDeleteDialogOpen(open ? template.id : null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Workflow Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{template.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(template.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
