import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Search, Trash2, Users2 } from 'lucide-react';
import { useState } from 'react';

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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SUPER_ADMIN, getProtectedRoles } from '@/constants/roles';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface Role {
    id: number;
    name: string;
    users_count: number;
    permissions_count: number;
    created_at: string;
}

interface RolesIndexProps extends PageProps {
    roles: Role[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function RolesIndex() {
    const { roles, flash } = usePage<RolesIndexProps>().props;
    const { can } = usePermissions();
    useToast(); // Initialize toast notifications
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedRoles(roles.map((role) => role.id));
        } else {
            setSelectedRoles([]);
        }
    };

    const handleSelectRole = (roleId: number, checked: boolean) => {
        if (checked) {
            setSelectedRoles((prev) => [...prev, roleId]);
        } else {
            setSelectedRoles((prev) => prev.filter((id) => id !== roleId));
        }
    };

    const handleDelete = (roleId: number) => {
        router.delete(route('admin.roles.destroy', { role: roleId }), {
            onStart: () => setIsDeleting(true),
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                // Remove from selected list if it was selected
                setSelectedRoles((prev) => prev.filter((id) => id !== roleId));
            },
            onError: (errors) => {
                console.error('Failed to delete role:', errors);
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedRoles.length === 0) return;

        selectedRoles.forEach((roleId) => {
            router.delete(route('admin.roles.destroy', { role: roleId }), {
                onSuccess: () => {
                    // Remove from selected list after successful deletion
                    setSelectedRoles((prev) =>
                        prev.filter((id) => id !== roleId),
                    );
                },
                onError: (errors) => {
                    console.error('Failed to delete role:', errors);
                },
            });
        });
    };

    const canDeleteRole = (roleName: string) => {
        return can('roles.delete') && !getProtectedRoles().includes(roleName);
    };

    const isAllSelected =
        roles.length > 0 && selectedRoles.length === roles.length;
    const isSomeSelected =
        selectedRoles.length > 0 && selectedRoles.length < roles.length;
    const roleCount = roles.length;

    return (
        <AppLayout>
            <Head title="Roles & Permissions" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Users2 className="h-5 w-5 text-muted-foreground" />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Roles & Permissions
                            </h1>
                            <Badge variant="secondary" className="ml-1">
                                {roleCount}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Assign roles, review access, and keep protected system
                            roles intact.
                        </p>
                    </div>
                    {can('roles.create') && (
                        <Button asChild size="sm" className="self-start">
                            <Link href={route('admin.roles.create')}>
                                New Role
                            </Link>
                        </Button>
                    )}
                </div>

                {flash?.success && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {selectedRoles.length > 0 && can('roles.delete') && (
                    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
                        <span className="text-sm text-muted-foreground">
                            {selectedRoles.length}{' '}
                            {selectedRoles.length === 1 ? 'role' : 'roles'} selected
                        </span>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Delete Selected Roles
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete the{' '}
                                        {selectedRoles.length} selected role(s)?
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleBulkDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRoles([])}
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}

                <Card className="overflow-hidden">
                    <CardHeader className="border-b py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="text-base">
                                    Roles
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {roleCount} roles in the current workspace.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Search className="h-4 w-4" />
                                <span>Compact access matrix</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {roles.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                No roles found.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {can('roles.delete') && (
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    aria-checked={
                                                        isSomeSelected
                                                            ? 'mixed'
                                                            : isAllSelected
                                                              ? true
                                                              : false
                                                    }
                                                    onCheckedChange={
                                                        handleSelectAll
                                                    }
                                                    aria-label="Select all"
                                                />
                                            </TableHead>
                                        )}
                                        <TableHead>Role</TableHead>
                                        <TableHead className="w-28">Users</TableHead>
                                        <TableHead className="w-32">Permissions</TableHead>
                                        <TableHead className="w-32">Created</TableHead>
                                        <TableHead className="w-24 text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.map((role) => (
                                        <TableRow key={role.id} className="h-12">
                                            {can('roles.delete') && (
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedRoles.includes(
                                                            role.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleSelectRole(
                                                                role.id,
                                                                checked as boolean,
                                                            )
                                                        }
                                                        aria-label={`Select ${role.name}`}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="font-medium leading-none">
                                                        {role.name}
                                                    </p>
                                                    {role.name ===
                                                        SUPER_ADMIN && (
                                                        <Badge
                                                            variant="default"
                                                            className="text-[10px] uppercase tracking-wide"
                                                        >
                                                            System Role
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {role.users_count} users
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-normal"
                                                >
                                                    {role.permissions_count}{' '}
                                                    permissions
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(
                                                        role.created_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {can('roles.edit') && (
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="icon"
                                                        >
                                                            <Link
                                                                href={route(
                                                                    'admin.roles.edit',
                                                                    role.id,
                                                                )}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                <span className="sr-only">
                                                                    Edit role
                                                                </span>
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {canDeleteRole(
                                                        role.name,
                                                    ) && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">
                                                                        Delete role
                                                                    </span>
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Delete
                                                                        Role
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you
                                                                        sure you
                                                                        want to
                                                                        delete
                                                                        the role
                                                                        "
                                                                        {
                                                                            role.name
                                                                        }
                                                                        "? This
                                                                        action
                                                                        cannot
                                                                        be
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
                                                                                role.id,
                                                                            )
                                                                        }
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
