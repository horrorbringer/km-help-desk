import { useModulePermissions } from '@/hooks/use-module-permissions';
import { useToast } from '@/hooks/use-toast';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Loader2,
    Pause,
    Sparkles,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    parent?: { id: number; name: string } | null;
    default_team?: { id: number; name: string } | null;
    workflow_template?: { id: number; name: string } | null;
    is_active: boolean;
    sort_order: number;
    children_count: number;
    tickets_count: number;
    created_at: string;
}

interface CategoriesIndexProps extends PageProps {
    categories: {
        data: Category[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        q?: string;
        parent_id?: string;
        is_active?: string;
        default_team_id?: string;
    };
    rootCategories: Array<{ id: number; name: string }>;
    departments: Array<{ id: number; name: string }>;
    workflowTemplates: Array<{ id: number; name: string }>;
    flash?: {
        success?: string;
        error?: string;
        bulk_errors?: string[];
    };
}

export default function CategoriesIndex() {
    const { categories, filters, rootCategories, departments, flash } =
        usePage<CategoriesIndexProps>().props;
    useToast(); // Handle flash messages
    const { canCreate, canEdit, canDelete } =
        useModulePermissions('categories');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(
        null,
    );
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkDialogAction, setBulkDialogAction] = useState<string>('');
    const [bulkDefaultTeamId, setBulkDefaultTeamId] = useState<string>('');
    const [togglingStatus, setTogglingStatus] = useState<number | null>(null);

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters };
        if (value === '' || value === '__all') {
            delete newFilters[key as keyof typeof filters];
        } else {
            newFilters[key as keyof typeof filters] = value;
        }
        router.get(route('admin.categories.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
        setSelectedCategories([]); // Clear selection when filters change
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCategories(
                categories.data.map((category) => category.id),
            );
        } else {
            setSelectedCategories([]);
        }
    };

    const handleSelectCategory = (categoryId: number, checked: boolean) => {
        if (checked) {
            setSelectedCategories([...selectedCategories, categoryId]);
        } else {
            setSelectedCategories(
                selectedCategories.filter((id) => id !== categoryId),
            );
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedCategories.length === 0) {
            return;
        }

        setBulkDialogAction(action);
        setBulkDefaultTeamId(''); // Reset team selection
        setBulkDialogOpen(true);
    };

    const handleBulkSubmit = () => {
        if (selectedCategories.length === 0) {
            return;
        }

        const count = selectedCategories.length;
        const actionLabels: Record<
            string,
            { loading: string; success: string; error: string }
        > = {
            delete: {
                loading: `Deleting ${count} categor${count === 1 ? 'y' : 'ies'}...`,
                success: `Successfully deleted ${count} categor${count === 1 ? 'y' : 'ies'}`,
                error: 'Failed to delete categories',
            },
            activate: {
                loading: `Activating ${count} categor${count === 1 ? 'y' : 'ies'}...`,
                success: `Successfully activated ${count} categor${count === 1 ? 'y' : 'ies'}`,
                error: 'Failed to activate categories',
            },
            deactivate: {
                loading: `Deactivating ${count} categor${count === 1 ? 'y' : 'ies'}...`,
                success: `Successfully deactivated ${count} categor${count === 1 ? 'y' : 'ies'}`,
                error: 'Failed to deactivate categories',
            },
        };

        const labels = actionLabels[bulkDialogAction] || {
            loading: 'Processing...',
            success: 'Operation completed successfully',
            error: 'Operation failed',
        };

        // Show loading toast with beautiful styling
        const toastId = toast.loading(labels.loading, {
            description: `Processing ${count} categor${count === 1 ? 'y' : 'ies'}`,
            duration: Infinity,
            icon: <Loader2 className="size-5 animate-spin text-blue-600" />,
        });

        if (bulkDialogAction === 'delete') {
            router.post(
                route('admin.categories.bulk-delete'),
                { category_ids: selectedCategories },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.dismiss(toastId);
                        toast.success(labels.success, {
                            description: `${count} categor${count === 1 ? 'y' : 'ies'} removed from the system`,
                            duration: 4000,
                            icon: (
                                <CheckCircle2 className="size-5 text-white" />
                            ),
                            style: {
                                background:
                                    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow:
                                    '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
                            },
                        });
                        setSelectedCategories([]);
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
                                background:
                                    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow:
                                    '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
                            },
                        });
                    },
                },
            );
        } else {
            const payload: {
                category_ids: number[];
                action: string;
                default_team_id?: string | null;
            } = {
                category_ids: selectedCategories,
                action: bulkDialogAction,
            };

            if (bulkDialogAction === 'update_default_team') {
                payload.default_team_id =
                    bulkDefaultTeamId && bulkDefaultTeamId !== '__none'
                        ? bulkDefaultTeamId
                        : null;
            }

            router.post(route('admin.categories.bulk-update'), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.dismiss(toastId);
                    const icon =
                        bulkDialogAction === 'activate' ? (
                            <Sparkles className="size-5 text-white" />
                        ) : (
                            <Pause className="size-5 text-white" />
                        );
                    toast.success(labels.success, {
                        description: `${count} categor${count === 1 ? 'y' : 'ies'} ${bulkDialogAction === 'activate' ? 'are now active and ready to use' : 'are now inactive'}`,
                        duration: 4000,
                        icon: icon,
                        style: {
                            background:
                                'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow:
                                '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
                        },
                    });
                    setSelectedCategories([]);
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
                            background:
                                'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow:
                                '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
                        },
                    });
                },
            });
        }
    };

    const allSelected =
        categories.data.length > 0 &&
        selectedCategories.length === categories.data.length;
    return (
        <AppLayout>
            <Head title="Categories" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Ticket Categories
                        </h1>
                        <p className="text-muted-foreground">
                            Organize and classify tickets by category
                        </p>
                    </div>
                    {canCreate && (
                        <Button asChild>
                            <Link href={route('admin.categories.create')}>
                                + New Category
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Flash Message */}
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Input
                            placeholder="Search by name, slug, or description..."
                            value={filters.q ?? ''}
                            onChange={(e) => handleFilter('q', e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFilter('q', e.currentTarget.value);
                                }
                            }}
                        />
                        <Select
                            value={(filters.parent_id as string) ?? '__all'}
                            onValueChange={(value) =>
                                handleFilter('parent_id', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">
                                    All categories
                                </SelectItem>
                                <SelectItem value="root">
                                    Root categories only
                                </SelectItem>
                                {rootCategories.map((cat) => (
                                    <SelectItem
                                        key={cat.id}
                                        value={cat.id.toString()}
                                    >
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={(filters.is_active as string) ?? '__all'}
                            onValueChange={(value) =>
                                handleFilter('is_active', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">
                                    All statuses
                                </SelectItem>
                                <SelectItem value="1">Active only</SelectItem>
                                <SelectItem value="0">Inactive only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={
                                (filters.default_team_id as string) ?? '__all'
                            }
                            onValueChange={(value) =>
                                handleFilter('default_team_id', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All teams" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">All teams</SelectItem>
                                <SelectItem value="__none">
                                    No team assigned
                                </SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem
                                        key={dept.id}
                                        value={dept.id.toString()}
                                    >
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Bulk Actions Bar */}
                {selectedCategories.length > 0 && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-4">
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {selectedCategories.length} categor
                                        {selectedCategories.length === 1
                                            ? 'y'
                                            : 'ies'}{' '}
                                        selected
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setSelectedCategories([])
                                        }
                                        className="h-7 px-2"
                                    >
                                        <X className="mr-1 h-3 w-3" />
                                        Clear
                                    </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {canEdit && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleBulkAction('activate')
                                                }
                                                className="text-xs"
                                            >
                                                Activate
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleBulkAction(
                                                        'deactivate',
                                                    )
                                                }
                                                className="text-xs"
                                            >
                                                Deactivate
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleBulkAction(
                                                        'update_default_team',
                                                    )
                                                }
                                                className="text-xs"
                                            >
                                                Update Team
                                            </Button>
                                        </>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                handleBulkAction('delete')
                                            }
                                            className="text-xs"
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Categories Table */}
                <Card>
                    <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <CardTitle>Categories ({categories.total})</CardTitle>
                        {selectedCategories.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                    {selectedCategories.length} selected
                                </span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {categories.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No categories found.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted text-xs text-muted-foreground uppercase">
                                        <tr>
                                            <th className="w-12 px-2 py-3 text-left sm:px-4">
                                                <Checkbox
                                                    checked={allSelected}
                                                    onCheckedChange={
                                                        handleSelectAll
                                                    }
                                                    aria-label="Select all categories"
                                                />
                                            </th>
                                            <th className="px-2 py-3 text-left sm:px-4">
                                                Name
                                            </th>
                                            <th className="hidden px-4 py-3 text-left md:table-cell">
                                                Parent
                                            </th>
                                            <th className="hidden px-4 py-3 text-left lg:table-cell">
                                                Default Team
                                            </th>
                                            <th className="hidden px-4 py-3 text-left lg:table-cell">
                                                Approval
                                            </th>
                                            <th className="px-2 py-3 text-left sm:px-4">
                                                Subcategories
                                            </th>
                                            <th className="px-2 py-3 text-left sm:px-4">
                                                Tickets
                                            </th>
                                            <th className="px-2 py-3 text-left sm:px-4">
                                                Status
                                            </th>
                                            <th className="px-2 py-3 text-right sm:px-4">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.data.map((category) => (
                                            <tr
                                                key={category.id}
                                                className="border-t transition hover:bg-muted/50"
                                            >
                                                <td className="px-2 py-3 sm:px-4">
                                                    <Checkbox
                                                        checked={selectedCategories.includes(
                                                            category.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleSelectCategory(
                                                                category.id,
                                                                checked as boolean,
                                                            )
                                                        }
                                                        aria-label={`Select ${category.name}`}
                                                    />
                                                </td>
                                                <td className="px-2 py-3 sm:px-4">
                                                    <div>
                                                        <p className="font-medium">
                                                            {category.name}
                                                        </p>
                                                        {category.description && (
                                                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                                                {
                                                                    category.description
                                                                }
                                                            </p>
                                                        )}
                                                        {/* Mobile: Show parent and team info */}
                                                        <div className="mt-1 space-y-1 md:hidden">
                                                            {category.parent && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Parent:{' '}
                                                                    {
                                                                        category
                                                                            .parent
                                                                            .name
                                                                    }
                                                                </p>
                                                            )}
                                                            {category.default_team && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Team:{' '}
                                                                    {
                                                                        category
                                                                            .default_team
                                                                            .name
                                                                    }
                                                                </p>
                                                            )}
                                                            {/* Mobile: Show approval badges */}
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {category.workflow_template && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-violet-200 bg-violet-50 text-xs text-violet-800"
                                                                    >
                                                                        {
                                                                            category
                                                                                .workflow_template
                                                                                .name
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                                    {category.parent ? (
                                                        <span className="text-sm">
                                                            {
                                                                category.parent
                                                                    .name
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                                                    {category.default_team ? (
                                                        <span className="text-sm">
                                                            {
                                                                category
                                                                    .default_team
                                                                    .name
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-3 lg:table-cell">
                                                    <div className="flex flex-col gap-1">
                                                        {category.workflow_template && (
                                                            <Badge
                                                                variant="outline"
                                                                className="w-fit border-violet-200 bg-violet-50 text-xs text-violet-800"
                                                            >
                                                                Template:{' '}
                                                                {
                                                                    category
                                                                        .workflow_template
                                                                        .name
                                                                }
                                                            </Badge>
                                                        )}
                                                        {!category.workflow_template && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Automatic
                                                                matching
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 sm:px-4">
                                                    <Badge variant="outline">
                                                        {
                                                            category.children_count
                                                        }
                                                    </Badge>
                                                </td>
                                                <td className="px-2 py-3 sm:px-4">
                                                    <Badge variant="outline">
                                                        {category.tickets_count}
                                                    </Badge>
                                                </td>
                                                <td className="px-2 py-3 sm:px-4">
                                                    <Badge
                                                        variant={
                                                            category.is_active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className={`cursor-pointer transition-opacity hover:opacity-80 ${
                                                            category.is_active
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : ''
                                                        } ${togglingStatus === category.id ? 'cursor-wait opacity-50' : ''}`}
                                                        onClick={() => {
                                                            if (
                                                                togglingStatus ===
                                                                category.id
                                                            )
                                                                return;

                                                            const newStatus =
                                                                !category.is_active;
                                                            const action =
                                                                newStatus
                                                                    ? 'activated'
                                                                    : 'deactivated';

                                                            setTogglingStatus(
                                                                category.id,
                                                            );

                                                            // Show loading toast with beautiful styling
                                                            const toastId =
                                                                toast.loading(
                                                                    `${newStatus ? 'Activating' : 'Deactivating'} category...`,
                                                                    {
                                                                        description: `Updating "${category.name}" status`,
                                                                        duration:
                                                                            Infinity,
                                                                        icon: newStatus ? (
                                                                            <Sparkles className="size-5 text-blue-600" />
                                                                        ) : (
                                                                            <Pause className="size-5 text-amber-600" />
                                                                        ),
                                                                    },
                                                                );

                                                            router.post(
                                                                route(
                                                                    'admin.categories.toggle-status',
                                                                    category.id,
                                                                ),
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () => {
                                                                            setTogglingStatus(
                                                                                null,
                                                                            );
                                                                            toast.dismiss(
                                                                                toastId,
                                                                            );
                                                                            toast.success(
                                                                                `Category ${action} successfully!`,
                                                                                {
                                                                                    description: `"${category.name}" is now ${newStatus ? 'active and ready to use' : 'inactive'}`,
                                                                                    duration: 4000,
                                                                                    icon: (
                                                                                        <CheckCircle2 className="size-5 text-white" />
                                                                                    ),
                                                                                    style: {
                                                                                        background:
                                                                                            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius:
                                                                                            '12px',
                                                                                        boxShadow:
                                                                                            '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
                                                                                    },
                                                                                },
                                                                            );
                                                                        },
                                                                    onError: (
                                                                        errors,
                                                                    ) => {
                                                                        setTogglingStatus(
                                                                            null,
                                                                        );
                                                                        toast.dismiss(
                                                                            toastId,
                                                                        );
                                                                        const errorMessage =
                                                                            errors?.message ||
                                                                            'Failed to update category status';
                                                                        toast.error(
                                                                            'Failed to update status',
                                                                            {
                                                                                description:
                                                                                    errorMessage,
                                                                                duration: 5000,
                                                                                icon: (
                                                                                    <XCircle className="size-5 text-white" />
                                                                                ),
                                                                                style: {
                                                                                    background:
                                                                                        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius:
                                                                                        '12px',
                                                                                    boxShadow:
                                                                                        '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
                                                                                },
                                                                            },
                                                                        );
                                                                    },
                                                                },
                                                            );
                                                        }}
                                                        title={`Click to ${category.is_active ? 'deactivate' : 'activate'}`}
                                                    >
                                                        {togglingStatus ===
                                                        category.id
                                                            ? '...'
                                                            : category.is_active
                                                              ? 'Active'
                                                              : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-2 py-3 text-right sm:px-4">
                                                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                        {canEdit && (
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-xs sm:text-sm"
                                                            >
                                                                <Link
                                                                    href={route(
                                                                        'admin.categories.edit',
                                                                        category.id,
                                                                    )}
                                                                >
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {canDelete &&
                                                            (deleteDialogOpen ===
                                                            category.id ? (
                                                                <AlertDialog
                                                                    open={true}
                                                                    onOpenChange={(
                                                                        open,
                                                                    ) =>
                                                                        !open &&
                                                                        setDeleteDialogOpen(
                                                                            null,
                                                                        )
                                                                    }
                                                                >
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Delete
                                                                                Category
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                {category.children_count >
                                                                                0 ? (
                                                                                    <>
                                                                                        Cannot
                                                                                        delete
                                                                                        category
                                                                                        "
                                                                                        {
                                                                                            category.name
                                                                                        }

                                                                                        "
                                                                                        because
                                                                                        it
                                                                                        has{' '}
                                                                                        {
                                                                                            category.children_count
                                                                                        }{' '}
                                                                                        subcategor
                                                                                        {category.children_count ===
                                                                                        1
                                                                                            ? 'y'
                                                                                            : 'ies'}

                                                                                        .
                                                                                        Please
                                                                                        delete
                                                                                        or
                                                                                        move
                                                                                        subcategories
                                                                                        first.
                                                                                    </>
                                                                                ) : category.tickets_count >
                                                                                  0 ? (
                                                                                    <>
                                                                                        Cannot
                                                                                        delete
                                                                                        category
                                                                                        "
                                                                                        {
                                                                                            category.name
                                                                                        }

                                                                                        "
                                                                                        because
                                                                                        it
                                                                                        has{' '}
                                                                                        {
                                                                                            category.tickets_count
                                                                                        }{' '}
                                                                                        ticket
                                                                                        {category.tickets_count ===
                                                                                        1
                                                                                            ? ''
                                                                                            : 's'}{' '}
                                                                                        assigned
                                                                                        to
                                                                                        it.
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        Are
                                                                                        you
                                                                                        sure
                                                                                        you
                                                                                        want
                                                                                        to
                                                                                        delete
                                                                                        "
                                                                                        {
                                                                                            category.name
                                                                                        }
                                                                                        "?
                                                                                        This
                                                                                        action
                                                                                        cannot
                                                                                        be
                                                                                        undone.
                                                                                    </>
                                                                                )}
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel
                                                                                onClick={() =>
                                                                                    setDeleteDialogOpen(
                                                                                        null,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Cancel
                                                                            </AlertDialogCancel>
                                                                            {category.children_count ===
                                                                                0 &&
                                                                                category.tickets_count ===
                                                                                    0 && (
                                                                                    <AlertDialogAction
                                                                                        onClick={() => {
                                                                                            const toastId =
                                                                                                toast.loading(
                                                                                                    'Deleting category...',
                                                                                                    {
                                                                                                        description: `Removing "${category.name}" from the system`,
                                                                                                        duration:
                                                                                                            Infinity,
                                                                                                        icon: (
                                                                                                            <Trash2 className="size-5 text-red-600" />
                                                                                                        ),
                                                                                                    },
                                                                                                );

                                                                                            router.delete(
                                                                                                route(
                                                                                                    'admin.categories.destroy',
                                                                                                    category.id,
                                                                                                ),
                                                                                                {
                                                                                                    preserveScroll: true,
                                                                                                    onSuccess:
                                                                                                        () => {
                                                                                                            toast.dismiss(
                                                                                                                toastId,
                                                                                                            );
                                                                                                            toast.success(
                                                                                                                'Category deleted successfully!',
                                                                                                                {
                                                                                                                    description: `"${category.name}" has been removed from the system`,
                                                                                                                    duration: 4000,
                                                                                                                    icon: (
                                                                                                                        <CheckCircle2 className="size-5 text-white" />
                                                                                                                    ),
                                                                                                                    style: {
                                                                                                                        background:
                                                                                                                            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                                                                        color: 'white',
                                                                                                                        border: 'none',
                                                                                                                        borderRadius:
                                                                                                                            '12px',
                                                                                                                        boxShadow:
                                                                                                                            '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
                                                                                                                    },
                                                                                                                },
                                                                                                            );
                                                                                                            setDeleteDialogOpen(
                                                                                                                null,
                                                                                                            );
                                                                                                        },
                                                                                                    onError:
                                                                                                        (
                                                                                                            errors,
                                                                                                        ) => {
                                                                                                            toast.dismiss(
                                                                                                                toastId,
                                                                                                            );
                                                                                                            const errorMessage =
                                                                                                                errors?.message ||
                                                                                                                'Failed to delete category';
                                                                                                            toast.error(
                                                                                                                'Failed to delete category',
                                                                                                                {
                                                                                                                    description:
                                                                                                                        errorMessage,
                                                                                                                    duration: 5000,
                                                                                                                    icon: (
                                                                                                                        <XCircle className="size-5 text-white" />
                                                                                                                    ),
                                                                                                                    style: {
                                                                                                                        background:
                                                                                                                            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                                                                        color: 'white',
                                                                                                                        border: 'none',
                                                                                                                        borderRadius:
                                                                                                                            '12px',
                                                                                                                        boxShadow:
                                                                                                                            '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
                                                                                                                    },
                                                                                                                },
                                                                                                            );
                                                                                                        },
                                                                                                },
                                                                                            );
                                                                                        }}
                                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                    >
                                                                                        Delete
                                                                                    </AlertDialogAction>
                                                                                )}
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setDeleteDialogOpen(
                                                                            category.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        category.children_count >
                                                                            0 ||
                                                                        category.tickets_count >
                                                                            0
                                                                    }
                                                                    className={
                                                                        category.children_count >
                                                                            0 ||
                                                                        category.tickets_count >
                                                                            0
                                                                            ? 'cursor-not-allowed opacity-50'
                                                                            : ''
                                                                    }
                                                                    title={
                                                                        category.children_count >
                                                                        0
                                                                            ? `Cannot delete: has ${category.children_count} subcategor${category.children_count === 1 ? 'y' : 'ies'}`
                                                                            : category.tickets_count >
                                                                                0
                                                                              ? `Cannot delete: has ${category.tickets_count} ticket${category.tickets_count === 1 ? '' : 's'}`
                                                                              : 'Delete category'
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Bulk Action Dialog */}
                        {bulkDialogOpen && (
                            <AlertDialog
                                open={bulkDialogOpen}
                                onOpenChange={setBulkDialogOpen}
                            >
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            {bulkDialogAction === 'delete'
                                                ? 'Delete Categories'
                                                : bulkDialogAction ===
                                                    'activate'
                                                  ? 'Activate Categories'
                                                  : bulkDialogAction ===
                                                      'deactivate'
                                                    ? 'Deactivate Categories'
                                                    : 'Update Default Team'}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {bulkDialogAction === 'delete' ? (
                                                <>
                                                    Are you sure you want to
                                                    delete{' '}
                                                    {selectedCategories.length}{' '}
                                                    categor
                                                    {selectedCategories.length ===
                                                    1
                                                        ? 'y'
                                                        : 'ies'}
                                                    ? Categories with
                                                    subcategories or tickets
                                                    cannot be deleted. This
                                                    action cannot be undone.
                                                </>
                                            ) : bulkDialogAction ===
                                              'activate' ? (
                                                <>
                                                    Are you sure you want to
                                                    activate{' '}
                                                    {selectedCategories.length}{' '}
                                                    categor
                                                    {selectedCategories.length ===
                                                    1
                                                        ? 'y'
                                                        : 'ies'}
                                                    ?
                                                </>
                                            ) : bulkDialogAction ===
                                              'deactivate' ? (
                                                <>
                                                    Are you sure you want to
                                                    deactivate{' '}
                                                    {selectedCategories.length}{' '}
                                                    categor
                                                    {selectedCategories.length ===
                                                    1
                                                        ? 'y'
                                                        : 'ies'}
                                                    ?
                                                </>
                                            ) : bulkDialogAction ===
                                              'update_default_team' ? (
                                                <div className="space-y-3">
                                                    <p>
                                                        Select the default team
                                                        for{' '}
                                                        {
                                                            selectedCategories.length
                                                        }{' '}
                                                        categor
                                                        {selectedCategories.length ===
                                                        1
                                                            ? 'y'
                                                            : 'ies'}
                                                        . Tickets in these
                                                        categories will be
                                                        routed to the selected
                                                        team.
                                                    </p>
                                                    <Select
                                                        value={
                                                            bulkDefaultTeamId
                                                        }
                                                        onValueChange={
                                                            setBulkDefaultTeamId
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select team..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__none">
                                                                No team
                                                                (unassign)
                                                            </SelectItem>
                                                            {departments.map(
                                                                (dept) => (
                                                                    <SelectItem
                                                                        key={
                                                                            dept.id
                                                                        }
                                                                        value={dept.id.toString()}
                                                                    >
                                                                        {
                                                                            dept.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : null}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel
                                            onClick={() =>
                                                setBulkDialogOpen(false)
                                            }
                                        >
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleBulkSubmit}
                                            disabled={
                                                bulkDialogAction ===
                                                    'update_default_team' &&
                                                !bulkDefaultTeamId
                                            }
                                            className={
                                                bulkDialogAction === 'delete'
                                                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                                    : ''
                                            }
                                        >
                                            {bulkDialogAction === 'delete'
                                                ? 'Delete'
                                                : bulkDialogAction ===
                                                    'activate'
                                                  ? 'Activate'
                                                  : bulkDialogAction ===
                                                      'deactivate'
                                                    ? 'Deactivate'
                                                    : 'Update Team'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        {/* Pagination */}
                        {categories.links.length > 3 && (
                            <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                {categories.links.map((link) => (
                                    <Button
                                        key={link.label}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url)
                                        }
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
