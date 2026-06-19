import { Head, Link, router, usePage } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { PageProps } from '@/types';

interface EscalationRule {
    id: number;
    name: string;
    description?: string;
    time_trigger_type?: string;
    time_trigger_minutes?: number;
    repeat_interval_minutes?: number | null;
    priority: number;
    is_active: boolean;
    execution_count: number;
    last_executed_at?: string;
    created_at: string;
}

interface EscalationRulesIndexProps extends PageProps {
    rules: {
        data: EscalationRule[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        q?: string;
        is_active?: string;
    };
    timeTriggerTypes: Record<string, string>;
}

export default function EscalationRulesIndex() {
    const { rules, filters, timeTriggerTypes, flash } =
        usePage<EscalationRulesIndexProps>().props;
    const { canCreate, canEdit } = useModulePermissions('escalation-rules');

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters };
        if (value === '' || value === '__all') {
            delete newFilters[key as keyof typeof filters];
        } else {
            newFilters[key as keyof typeof filters] = value;
        }
        router.get(route('admin.escalation-rules.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const formatTimeTrigger = (rule: EscalationRule) => {
        if (!rule.time_trigger_type || !rule.time_trigger_minutes) {
            return 'No time trigger';
        }

        const hours = Math.floor(rule.time_trigger_minutes / 60);
        const minutes = rule.time_trigger_minutes % 60;
        const timeStr =
            hours > 0 && minutes > 0
                ? `${hours}h ${minutes}m`
                : hours > 0
                  ? `${hours}h`
                  : `${minutes}m`;

        const triggerLabel =
            timeTriggerTypes[rule.time_trigger_type] || rule.time_trigger_type;

        const repeat = rule.repeat_interval_minutes
            ? `, repeats every ${rule.repeat_interval_minutes}m`
            : ', once per ticket';

        return `${timeStr} after ${triggerLabel}${repeat}`;
    };

    return (
        <AppLayout>
            <Head title="Escalation Rules" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Escalation Rules</h1>
                        <p className="text-muted-foreground">
                            Automatically escalate tickets based on time and
                            conditions
                        </p>
                    </div>
                    {canCreate && (
                        <Button asChild>
                            <Link href={route('admin.escalation-rules.create')}>
                                + New Rule
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

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                            placeholder="Search rules..."
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

                {/* Rules Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Escalation Rules ({rules.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rules.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No escalation rules found.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Time Trigger</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Executions</TableHead>
                                        <TableHead>Last Executed</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rules.data.map((rule) => (
                                        <TableRow key={rule.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {rule.name}
                                                    </p>
                                                    {rule.description && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {rule.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">
                                                    {formatTimeTrigger(rule)}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {rule.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        rule.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={
                                                        rule.is_active
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : ''
                                                    }
                                                >
                                                    {rule.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {rule.execution_count}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {rule.last_executed_at ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            rule.last_executed_at,
                                                        ).toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Never
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canEdit && (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.escalation-rules.edit',
                                                                rule.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Pagination */}
                        {rules.links.length > 3 && (
                            <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                {rules.links.map((link) => (
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
