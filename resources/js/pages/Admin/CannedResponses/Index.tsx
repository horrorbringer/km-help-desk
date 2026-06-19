import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Edit,
    LayoutGrid,
    List,
    MoreVertical,
    Trash2,
    XCircle,
} from 'lucide-react';
import React from 'react';

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useModulePermissions } from '@/hooks/use-module-permissions';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

type ViewMode = 'cards' | 'list';
type BulkAction = 'activate' | 'deactivate' | 'delete';

interface CannedResponse {
    id: number;
    title: string;
    content: string;
    category?: { id: number; name: string } | null;
    author?: { id: number; name: string } | null;
    is_active: boolean;
    usage_count: number;
    created_at: string;
}

interface CannedResponsesIndexProps extends PageProps {
    responses: {
        data: CannedResponse[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        q?: string;
        category?: string;
        is_active?: string;
    };
    categories: Array<{ id: number; name: string }>;
}

export default function CannedResponsesIndex() {
    const { responses, filters, categories, flash } =
        usePage<CannedResponsesIndexProps>().props;
    const { canCreate, canEdit, canDelete } =
        useModulePermissions('canned-responses');
    const [viewMode, setViewMode] = React.useState<ViewMode>('cards');
    const [selectedResponses, setSelectedResponses] = React.useState<number[]>(
        [],
    );
    const [responseToDelete, setResponseToDelete] =
        React.useState<CannedResponse | null>(null);
    const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false);
    const [bulkDialogAction, setBulkDialogAction] =
        React.useState<BulkAction | null>(null);

    const hasRowActions = canEdit || canDelete;
    const allSelected =
        responses.data.length > 0 &&
        selectedResponses.length === responses.data.length;
    const someSelected =
        selectedResponses.length > 0 &&
        selectedResponses.length < responses.data.length;

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters };
        if (value === '' || value === '__all') {
            delete newFilters[key as keyof typeof filters];
        } else {
            newFilters[key as keyof typeof filters] = value;
        }
        router.get(route('admin.canned-responses.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
        setSelectedResponses([]);
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedResponses(
            checked ? responses.data.map((response) => response.id) : [],
        );
    };

    const handleSelectResponse = (responseId: number, checked: boolean) => {
        setSelectedResponses((current) =>
            checked
                ? [...current, responseId]
                : current.filter((id) => id !== responseId),
        );
    };

    const openBulkDialog = (action: BulkAction) => {
        if (selectedResponses.length === 0) {
            return;
        }

        setBulkDialogAction(action);
        setBulkDialogOpen(true);
    };

    const handleBulkSubmit = () => {
        if (!bulkDialogAction || selectedResponses.length === 0) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedResponses([]);
                setBulkDialogOpen(false);
                setBulkDialogAction(null);
            },
        };

        if (bulkDialogAction === 'delete') {
            router.post(
                route('admin.canned-responses.bulk-delete'),
                { response_ids: selectedResponses },
                options,
            );
            return;
        }

        router.post(
            route('admin.canned-responses.bulk-update'),
            {
                response_ids: selectedResponses,
                action: bulkDialogAction,
            },
            options,
        );
    };

    const handleDelete = () => {
        if (!responseToDelete) {
            return;
        }

        router.delete(
            route('admin.canned-responses.destroy', responseToDelete.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedResponses((current) =>
                        current.filter((id) => id !== responseToDelete.id),
                    );
                    setResponseToDelete(null);
                },
            },
        );
    };

    const renderStatusBadge = (response: CannedResponse) => (
        <Badge
            variant={response.is_active ? 'default' : 'secondary'}
            className={
                response.is_active ? 'bg-emerald-100 text-emerald-800' : ''
            }
        >
            {response.is_active ? 'Active' : 'Inactive'}
        </Badge>
    );

    const renderActions = (response: CannedResponse) => {
        if (!hasRowActions) {
            return null;
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canEdit && (
                        <DropdownMenuItem asChild>
                            <Link
                                href={route(
                                    'admin.canned-responses.edit',
                                    response.id,
                                )}
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {canEdit && canDelete && <DropdownMenuSeparator />}
                    {canDelete && (
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setResponseToDelete(response)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <AppLayout>
            <Head title="Canned Responses" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Canned Responses</h1>
                        <p className="text-muted-foreground">
                            Pre-written responses for common ticket scenarios
                        </p>
                    </div>
                    {canCreate && (
                        <Button asChild>
                            <Link href={route('admin.canned-responses.create')}>
                                + New Response
                            </Link>
                        </Button>
                    )}
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Input
                            placeholder="Search by title or content..."
                            value={filters.q ?? ''}
                            onChange={(e) => handleFilter('q', e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFilter('q', e.currentTarget.value);
                                }
                            }}
                        />
                        <Select
                            value={(filters.category as string) ?? '__all'}
                            onValueChange={(value) =>
                                handleFilter('category', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">
                                    All categories
                                </SelectItem>
                                {categories.map((cat) => (
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
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Responses</h2>
                            <p className="text-sm text-muted-foreground">
                                Showing {responses.data.length} of{' '}
                                {responses.total} responses
                            </p>
                        </div>
                        <div className="flex w-fit items-center rounded-lg border bg-background p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                    viewMode === 'cards'
                                        ? 'bg-muted text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                                aria-pressed={viewMode === 'cards'}
                                title="Card view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                Cards
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                    viewMode === 'list'
                                        ? 'bg-muted text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                                aria-pressed={viewMode === 'list'}
                                title="List view"
                            >
                                <List className="h-4 w-4" />
                                List
                            </button>
                        </div>
                    </div>

                    {viewMode === 'list' && selectedResponses.length > 0 && (
                        <Card>
                            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {selectedResponses.length} response(s)
                                    selected
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    {canEdit && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    openBulkDialog('activate')
                                                }
                                            >
                                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                                Activate
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    openBulkDialog('deactivate')
                                                }
                                            >
                                                <XCircle className="mr-1 h-4 w-4" />
                                                Deactivate
                                            </Button>
                                        </>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                openBulkDialog('delete')
                                            }
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="mr-1 h-4 w-4" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {responses.data.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No canned responses found.
                            </CardContent>
                        </Card>
                    ) : viewMode === 'cards' ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {responses.data.map((response) => (
                                <Card
                                    key={response.id}
                                    className="transition-shadow hover:shadow-md"
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-lg">
                                                    {response.title}
                                                </CardTitle>
                                                {response.category && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {response.category.name}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-start gap-2">
                                                {renderStatusBadge(response)}
                                                {renderActions(response)}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                                            {response.content}
                                        </p>
                                        <div className="text-xs text-muted-foreground">
                                            <span>
                                                Used {response.usage_count}{' '}
                                                times
                                            </span>
                                            {response.author && (
                                                <span className="ml-2">
                                                    by {response.author.name}
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={
                                                        allSelected ||
                                                        (someSelected
                                                            ? 'indeterminate'
                                                            : false)
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        handleSelectAll(
                                                            checked === true,
                                                        )
                                                    }
                                                    aria-label="Select all responses"
                                                />
                                            </TableHead>
                                            <TableHead>Response</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Usage</TableHead>
                                            <TableHead>Author</TableHead>
                                            {hasRowActions && (
                                                <TableHead className="text-right">
                                                    Action
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {responses.data.map((response) => (
                                            <TableRow key={response.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedResponses.includes(
                                                            response.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleSelectResponse(
                                                                response.id,
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                        aria-label={`Select ${response.title}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="max-w-[420px] whitespace-normal">
                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            {response.title}
                                                        </p>
                                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                                            {response.content}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {response.category?.name ??
                                                        'Uncategorized'}
                                                </TableCell>
                                                <TableCell>
                                                    {renderStatusBadge(
                                                        response,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {response.usage_count}
                                                </TableCell>
                                                <TableCell>
                                                    {response.author?.name ??
                                                        '-'}
                                                </TableCell>
                                                {hasRowActions && (
                                                    <TableCell className="text-right">
                                                        {renderActions(
                                                            response,
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {responses.links.length > 3 && (
                    <div className="flex justify-end gap-2">
                        {responses.links.map((link) => (
                            <Button
                                key={link.label}
                                variant={link.active ? 'default' : 'outline'}
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
            </div>

            <AlertDialog
                open={!!responseToDelete}
                onOpenChange={(open) => !open && setResponseToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Canned Response
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "
                            {responseToDelete?.title}"? This action cannot be
                            undone.
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

            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {bulkDialogAction === 'activate' &&
                                'Activate Responses'}
                            {bulkDialogAction === 'deactivate' &&
                                'Deactivate Responses'}
                            {bulkDialogAction === 'delete' &&
                                'Delete Responses'}
                        </DialogTitle>
                        <DialogDescription>
                            {bulkDialogAction === 'delete'
                                ? `Are you sure you want to delete ${selectedResponses.length} response(s)? This action cannot be undone.`
                                : `This will ${bulkDialogAction} ${selectedResponses.length} response(s).`}
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
                            {bulkDialogAction === 'activate' && 'Activate'}
                            {bulkDialogAction === 'deactivate' && 'Deactivate'}
                            {bulkDialogAction === 'delete' && 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
