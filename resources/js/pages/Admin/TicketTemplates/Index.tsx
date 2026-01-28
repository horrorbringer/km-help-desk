import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';

interface TicketTemplate {
    id: number;
    name: string;
    slug: string;
    description?: string;
    usage_count: number;
    is_active: boolean;
    is_public: boolean;
    creator?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

interface TicketTemplatesIndexProps extends PageProps {
    templates: {
        data: TicketTemplate[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        q?: string;
        is_active?: string;
    };
    flash?: {
        success?: string;
    };
}

export default function TicketTemplatesIndex() {
    const { templates, filters, flash } =
        usePage<TicketTemplatesIndexProps>().props;
    const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] =
        useState<TicketTemplate | null>(null);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkDialogAction, setBulkDialogAction] = useState<string>('');

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters };
        if (value === '' || value === '__all') {
            delete newFilters[key as keyof typeof filters];
        } else {
            newFilters[key as keyof typeof filters] = value;
        }
        router.get(route('admin.ticket-templates.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
        setSelectedTemplates([]); // Clear selection when filters change
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTemplates(templates.data.map((template) => template.id));
        } else {
            setSelectedTemplates([]);
        }
    };

    const handleSelectTemplate = (templateId: number, checked: boolean) => {
        if (checked) {
            setSelectedTemplates([...selectedTemplates, templateId]);
        } else {
            setSelectedTemplates(
                selectedTemplates.filter((id) => id !== templateId),
            );
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedTemplates.length === 0) {
            return;
        }

        setBulkDialogAction(action);
        setBulkDialogOpen(true);
    };

    const handleBulkSubmit = () => {
        if (selectedTemplates.length === 0) {
            return;
        }

        if (bulkDialogAction === 'delete') {
            router.post(
                route('admin.ticket-templates.bulk-delete'),
                { template_ids: selectedTemplates },
                {
                    onSuccess: () => {
                        setSelectedTemplates([]);
                        setBulkDialogOpen(false);
                        toast.success(
                            `Successfully deleted ${selectedTemplates.length} template(s).`,
                        );
                    },
                    onError: () => {
                        toast.error(
                            'Failed to delete templates. Please try again.',
                        );
                    },
                },
            );
        } else {
            router.post(
                route('admin.ticket-templates.bulk-update'),
                {
                    template_ids: selectedTemplates,
                    action: bulkDialogAction,
                },
                {
                    onSuccess: () => {
                        setSelectedTemplates([]);
                        setBulkDialogOpen(false);
                        toast.success(
                            `Successfully ${bulkDialogAction}d ${selectedTemplates.length} template(s).`,
                        );
                    },
                    onError: () => {
                        toast.error(
                            `Failed to ${bulkDialogAction} templates. Please try again.`,
                        );
                    },
                },
            );
        }
    };

    const allSelected =
        templates.data.length > 0 &&
        selectedTemplates.length === templates.data.length;
    const someSelected =
        selectedTemplates.length > 0 &&
        selectedTemplates.length < templates.data.length;

    return (
        <AppLayout>
            <Head title="Ticket Templates" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Ticket Templates</h1>
                        <p className="text-muted-foreground">
                            Create reusable templates to quickly create tickets
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.ticket-templates.create')}>
                            + New Template
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                            placeholder="Search templates..."
                            value={filters.q ?? ''}
                            onChange={(e) => handleFilter('q', e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFilter('q', e.currentTarget.value);
                                }
                            }}
                        />
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
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedTemplates.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {selectedTemplates.length} template(s)
                                    selected
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleBulkAction('activate')
                                        }
                                    >
                                        <CheckCircle2 className="mr-1 h-4 w-4" />
                                        Activate
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleBulkAction('deactivate')
                                        }
                                    >
                                        <XCircle className="mr-1 h-4 w-4" />
                                        Deactivate
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleBulkAction('delete')
                                        }
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="mr-1 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Templates Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Ticket Templates ({templates.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {templates.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No ticket templates found.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={
                                                    handleSelectAll
                                                }
                                                aria-label="Select all templates"
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Usage</TableHead>
                                        <TableHead>Visibility</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Creator</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.data.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedTemplates.includes(
                                                        template.id,
                                                    )}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        handleSelectTemplate(
                                                            template.id,
                                                            Boolean(checked),
                                                        )
                                                    }
                                                    aria-label={`Select ${template.name}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">
                                                    {template.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {template.slug}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-muted-foreground">
                                                    {template.description ||
                                                        '—'}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {template.usage_count} times
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        template.is_public
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                >
                                                    {template.is_public
                                                        ? 'Public'
                                                        : 'Private'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        template.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={
                                                        template.is_active
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : ''
                                                    }
                                                >
                                                    {template.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">
                                                    {template.creator?.name ??
                                                        'System'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.ticket-templates.edit',
                                                                template.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <AlertDialog
                                                        open={
                                                            deleteDialogOpen &&
                                                            templateToDelete?.id ===
                                                                template.id
                                                        }
                                                        onOpenChange={(
                                                            open,
                                                        ) => {
                                                            if (!open) {
                                                                setDeleteDialogOpen(
                                                                    false,
                                                                );
                                                                setTemplateToDelete(
                                                                    null,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <AlertDialogTrigger
                                                            asChild
                                                        ></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete
                                                                    Ticket
                                                                    Template
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete "
                                                                    {
                                                                        template.name
                                                                    }
                                                                    "? This
                                                                    action
                                                                    cannot be
                                                                    undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => {
                                                                        router.delete(
                                                                            route(
                                                                                'admin.ticket-templates.destroy',
                                                                                template.id,
                                                                            ),
                                                                            {
                                                                                preserveScroll: true,
                                                                                onSuccess:
                                                                                    () => {
                                                                                        setDeleteDialogOpen(
                                                                                            false,
                                                                                        );
                                                                                        setTemplateToDelete(
                                                                                            null,
                                                                                        );
                                                                                        toast.success(
                                                                                            'Ticket template deleted successfully.',
                                                                                        );
                                                                                    },
                                                                                onError:
                                                                                    () => {
                                                                                        toast.error(
                                                                                            'Failed to delete ticket template.',
                                                                                        );
                                                                                    },
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Pagination */}
                        {templates.links.length > 3 && (
                            <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                {templates.links.map((link) => (
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

                {/* Bulk Action Dialog */}
                <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {bulkDialogAction === 'delete' &&
                                    'Delete Templates'}

                                {bulkDialogAction === 'activate' &&
                                    'Activate Templates'}
                                {bulkDialogAction === 'deactivate' &&
                                    'Deactivate Templates'}
                            </DialogTitle>
                            <DialogDescription>
                                {bulkDialogAction === 'delete' &&
                                    `Are you sure you want to delete ${selectedTemplates.length} template(s)? This action cannot be undone.`}

                                {bulkDialogAction === 'activate' &&
                                    `Are you sure you want to activate ${selectedTemplates.length} template(s)?`}
                                {bulkDialogAction === 'deactivate' &&
                                    `Are you sure you want to deactivate ${selectedTemplates.length} template(s)?`}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setBulkDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBulkSubmit}
                                variant={
                                    bulkDialogAction === 'delete'
                                        ? 'destructive'
                                        : 'default'
                                }
                            >
                                {bulkDialogAction === 'delete' && 'Delete'}

                                {bulkDialogAction === 'activate' && 'Activate'}
                                {bulkDialogAction === 'deactivate' &&
                                    'Deactivate'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
