import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUPER_ADMIN } from '@/constants/roles';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface Permission {
    id: number;
    name: string;
    label: string;
}

interface PermissionGroup {
    group: string;
    permissions: Permission[];
}

interface RoleFormProps {
    role?: { id: number; name: string; permission_ids: number[] };
    permissions: PermissionGroup[];
}

export default function RoleForm({ role, permissions }: RoleFormProps) {
    const isEdit = Boolean(role);
    const { errors } = usePage<PageProps>().props;
    const [search, setSearch] = useState('');
    const { data, setData, post, put, processing } = useForm({
        name: role?.name ?? '',
        permissions: role?.permission_ids ?? [],
    });

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase();

        return permissions
            .map((group) => ({
                ...group,
                permissions: group.permissions.filter(
                    (permission) =>
                        !query ||
                        group.group.toLowerCase().includes(query) ||
                        permission.name.toLowerCase().includes(query) ||
                        permission.label.toLowerCase().includes(query),
                ),
            }))
            .filter((group) => group.permissions.length > 0);
    }, [permissions, search]);

    const totalPermissions = permissions.reduce(
        (total, group) => total + group.permissions.length,
        0,
    );

    const togglePermission = (permissionId: number) => {
        setData(
            'permissions',
            data.permissions.includes(permissionId)
                ? data.permissions.filter((id) => id !== permissionId)
                : [...data.permissions, permissionId],
        );
    };

    const toggleGroup = (groupPermissions: Permission[]) => {
        const groupIds = groupPermissions.map((permission) => permission.id);
        const allSelected = groupIds.every((id) =>
            data.permissions.includes(id),
        );

        setData(
            'permissions',
            allSelected
                ? data.permissions.filter((id) => !groupIds.includes(id))
                : [...new Set([...data.permissions, ...groupIds])],
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isEdit && role) {
            put(route('admin.roles.update', role.id));
            return;
        }

        post(route('admin.roles.store'));
    };

    return (
        <AppLayout>
            <Head title={isEdit ? 'Edit Role' : 'New Role'} />

            <form onSubmit={submit} className="min-w-0 space-y-4">
                <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {isEdit ? 'Edit role' : 'New role'}
                            </h1>
                            <Badge variant="secondary">
                                {data.permissions.length} / {totalPermissions}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {isEdit
                                ? 'Review the role name and access grants.'
                                : 'Create a role, then grant only the access it needs.'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                        >
                            <Link href={route('admin.roles.index')}>
                                Cancel
                            </Link>
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={processing || role?.name === SUPER_ADMIN}
                        >
                            {processing
                                ? 'Saving...'
                                : isEdit
                                  ? 'Save changes'
                                  : 'Create role'}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                        <div className="min-w-0 space-y-2">
                            <Label htmlFor="name">Role name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="e.g. Support Agent"
                                disabled={role?.name === SUPER_ADMIN}
                                required
                            />
                            {role?.name === SUPER_ADMIN && (
                                <p className="text-xs text-muted-foreground">
                                    The Super Admin role name is protected.
                                </p>
                            )}
                            {errors.name && (
                                <p className="text-xs text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground md:pb-2">
                            {data.permissions.length} permissions selected
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <CardTitle className="text-base">
                                Permissions
                            </CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Select by capability group or grant an
                                individual action.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                    setData(
                                        'permissions',
                                        permissions.flatMap((group) =>
                                            group.permissions.map(
                                                (permission) => permission.id,
                                            ),
                                        ),
                                    )
                                }
                            >
                                Select all
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="w-full sm:w-auto"
                                disabled={data.permissions.length === 0}
                                onClick={() => setData('permissions', [])}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        <div className="flex h-10 min-w-0 items-center gap-2 border-b">
                            <Search className="size-4 text-muted-foreground" />
                            <Input
                                className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Filter permissions"
                            />
                            {search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => setSearch('')}
                                >
                                    <X className="size-4" />
                                    <span className="sr-only">
                                        Clear filter
                                    </span>
                                </Button>
                            )}
                        </div>

                        {filteredGroups.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                No permissions match this filter.
                            </p>
                        ) : (
                            <div className="grid gap-3 lg:grid-cols-2">
                                {filteredGroups.map((group) => {
                                    const fullGroup = permissions.find(
                                        (permissionGroup) =>
                                            permissionGroup.group ===
                                            group.group,
                                    )!;
                                    const groupIds = fullGroup.permissions.map(
                                        (permission) => permission.id,
                                    );
                                    const selected = groupIds.filter((id) =>
                                        data.permissions.includes(id),
                                    );
                                    const allSelected =
                                        selected.length === groupIds.length;
                                    const someSelected =
                                        selected.length > 0 && !allSelected;

                                    return (
                                        <section
                                            key={group.group}
                                            className="min-w-0 border"
                                        >
                                            <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3 py-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <Checkbox
                                                        id={`group-${group.group}`}
                                                        checked={
                                                            someSelected
                                                                ? 'indeterminate'
                                                                : allSelected
                                                        }
                                                        onCheckedChange={() =>
                                                            toggleGroup(
                                                                fullGroup.permissions,
                                                            )
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`group-${group.group}`}
                                                        className="cursor-pointer truncate font-medium capitalize"
                                                    >
                                                        {group.group.replace(
                                                            /-/g,
                                                            ' ',
                                                        )}
                                                    </Label>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 font-normal"
                                                >
                                                    {selected.length}/
                                                    {group.permissions.length}
                                                </Badge>
                                            </div>
                                            <div className="divide-y">
                                                {group.permissions.map(
                                                    (permission) => (
                                                        <div
                                                            key={permission.id}
                                                            className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/30"
                                                        >
                                                            <Checkbox
                                                                id={`permission-${permission.id}`}
                                                                checked={data.permissions.includes(
                                                                    permission.id,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        permission.id,
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`permission-${permission.id}`}
                                                                className="min-w-0 cursor-pointer"
                                                            >
                                                                <span className="block text-sm font-medium">
                                                                    {
                                                                        permission.label
                                                                    }
                                                                </span>
                                                                <span className="block truncate text-xs text-muted-foreground">
                                                                    {
                                                                        permission.name
                                                                    }
                                                                </span>
                                                            </Label>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>
        </AppLayout>
    );
}
