import { Head, Link, router, usePage } from '@inertiajs/react';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

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

interface NotificationTemplate {
    id: number;
    name: string;
    type: string;
    subject_template: string;
    message_template: string;
    variables: string[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface NotificationTemplatesIndexProps extends PageProps {
    templates: {
        data: NotificationTemplate[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        type?: string;
        is_active?: string;
    };
    types: string[];
}

const typeColorMap: Record<string, string> = {
    ticket_created: 'bg-blue-100 text-blue-800',
    ticket_assigned: 'bg-indigo-100 text-indigo-800',
    ticket_updated: 'bg-amber-100 text-amber-800',
    ticket_resolved: 'bg-emerald-100 text-emerald-800',
    ticket_closed: 'bg-slate-200 text-slate-800',
    ticket_commented: 'bg-purple-100 text-purple-800',
    ticket_mentioned: 'bg-pink-100 text-pink-800',
    sla_breached: 'bg-red-100 text-red-800',
    sla_warning: 'bg-orange-100 text-orange-800',
};

export default function NotificationTemplatesIndex() {
    const { templates, filters, types } =
        usePage<NotificationTemplatesIndexProps>().props;

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters };
        if (value === '' || value === '__all') {
            delete newFilters[key as keyof typeof filters];
        } else {
            newFilters[key as keyof typeof filters] = value;
        }
        router.get(route('admin.notification-templates.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (templateId: number) => {
        router.delete(
            route('admin.notification-templates.destroy', templateId),
            {
                preserveState: true,
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Notification Templates" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Notification Templates
                        </h1>
                        <p className="text-muted-foreground">
                            Customize notification messages and subjects
                        </p>
                    </div>
                    <Button asChild>
                        <Link
                            href={route('admin.notification-templates.create')}
                        >
                            <IconPlus className="mr-2 h-4 w-4" />
                            Create Template
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Select
                            value={(filters.type as string) ?? '__all'}
                            onValueChange={(value) =>
                                handleFilter('type', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">All types</SelectItem>
                                {types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type
                                            .replace(/_/g, ' ')
                                            .replace(/\b\w/g, (l) =>
                                                l.toUpperCase(),
                                            )}
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
                                <SelectValue placeholder="All templates" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">
                                    All templates
                                </SelectItem>
                                <SelectItem value="1">Active only</SelectItem>
                                <SelectItem value="0">Inactive only</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Templates Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Templates ({templates.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {templates.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No notification templates found.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Subject Template</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.data.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {template.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Variables:{' '}
                                                        {template.variables?.join(
                                                            ', ',
                                                        ) || 'None'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${typeColorMap[template.type] ?? ''}`}
                                                >
                                                    {template.type.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {template.subject_template}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        template.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {template.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.notification-templates.edit',
                                                                template.id,
                                                            )}
                                                        >
                                                            <IconEdit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <IconTrash className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete
                                                                    Template
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete the "
                                                                    {
                                                                        template.name
                                                                    }
                                                                    " template?
                                                                    This action
                                                                    cannot be
                                                                    undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            template.id,
                                                                        )
                                                                    }
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
            </div>
        </AppLayout>
    );
}
