import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Edit,
    List,
    Plus,
    Radio,
    Search,
    Tag,
    Ticket,
    Trash2,
    User,
    UserCircle,
    UserPlus,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

import { AdvancedSearch } from '@/components/advanced-search';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/user-avatar';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Option = {
    id: number;
    name: string;
    email?: string;
    avatar?: string | null;
};

type Ticket = {
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    status_label?: string;
    approval_status?: 'none' | 'pending' | 'approved' | 'rejected';
    priority: string;
    source: string;
    requester?: Option;
    assigned_team?: Option;
    assigned_agent?: Option;
    category?: Option;
    project?: { id: number; name: string; code: string };
    sla_policy?: Option;
    tags: { id: number; name: string; color: string }[];
    created_at: string;
    current_approval?: {
        id: number;
        approval_level: string;
        status: string;
        approver?: Option | null;
    } | null;
    rejected_approval?: {
        id: number;
        approval_level: string;
        status: string;
        comments?: string | null;
        rejected_at?: string | null;
        approver?: Option | null;
    } | null;
};

type Filters = {
    q?: string;
    status?: string;
    priority?: string;
    team?: number | string;
    agent?: number | string;
    category?: number | string;
    project?: number | string;
    requester?: number | string;
    date_from?: string;
    date_to?: string;
    sla_breached?: string;
    tags?: string[] | string;
};

type Props = {
    tickets: {
        data: Ticket[];
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: Filters;
    options: {
        statuses: string[];
        priorities: string[];
        teams: Option[];
        agents: Option[];
        categories: Option[];
        projects: Option[];
        requesters: Option[];
        tags: Array<{ id: number; name: string; color: string }>;
    };
    counts?: {
        pending_approvals: number;
        rejected_tickets: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

type TicketPageProps = {
    [key: string]: unknown;
    auth?: {
        user?: {
            id?: number;
            department_id?: number;
        };
    };
};

const statusColorMap: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-amber-100 text-amber-800',
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-200 text-slate-800',
    cancelled: 'bg-gray-200 text-gray-700',
};

const priorityColorMap: Record<string, string> = {
    low: 'bg-slate-200 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const statusTabActiveClasses: Record<string, string> = {
    open: 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200',
    assigned:
        'data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-200',
    in_progress:
        'data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border-amber-200',
    pending:
        'data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:border-yellow-200',
    resolved:
        'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200',
    closed: 'data-[state=active]:bg-slate-50 data-[state=active]:text-slate-700 data-[state=active]:border-slate-200',
    cancelled:
        'data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 data-[state=active]:border-gray-200',
};

const formatStatus = (status: string) =>
    status === 'pending'
        ? 'Waiting'
        : status
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

export default function TicketIndex({
    tickets,
    filters,
    options,
    counts,
    flash,
}: Props) {
    const { can } = usePermissions();
    const { toast } = useToast();
    const { auth } = usePage<TicketPageProps>().props;
    const currentUserId = auth?.user?.id;
    const currentUserDepartmentId = auth?.user?.department_id;

    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkDialogAction, setBulkDialogAction] = useState<string>('');
    const [bulkDialogValue, setBulkDialogValue] = useState<string>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState(filters.q || '');

    const allSelected =
        tickets.data.length > 0 &&
        selectedTickets.length === tickets.data.length;
    const someSelected =
        selectedTickets.length > 0 &&
        selectedTickets.length < tickets.data.length;

    const getActiveViewTab = () => {
        if (
            filters.requester === String(currentUserId) ||
            filters.agent === String(currentUserId)
        ) {
            return 'my-tickets';
        }

        return 'all-tickets';
    };

    const getActiveStatusTab = () => filters.status || 'all';

    const handleFiltersChange = (newFilters: Filters) => {
        router.get(route('admin.tickets.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
        setSelectedTickets([]);
    };

    const handleViewTabChange = (value: string) => {
        const newFilters = { ...filters };

        if (value === 'my-tickets') {
            newFilters.requester = String(currentUserId);
            delete newFilters.agent;
        } else {
            delete newFilters.requester;
            delete newFilters.agent;
        }

        handleFiltersChange(newFilters);
    };

    const handleStatusTabChange = (value: string) => {
        const newFilters = { ...filters };

        if (value === 'all') {
            delete newFilters.status;
        } else {
            newFilters.status = value;
        }

        handleFiltersChange(newFilters);
    };

    React.useEffect(() => {
        setSearchQuery(filters.q || '');
    }, [filters.q]);

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== (filters.q || '')) {
                const newFilters = { ...filters };

                if (searchQuery === '') {
                    delete newFilters.q;
                } else {
                    newFilters.q = searchQuery;
                }

                handleFiltersChange(newFilters);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const handleSelectAll = (checked: boolean) => {
        setSelectedTickets(
            checked ? tickets.data.map((ticket) => ticket.id) : [],
        );
    };

    const handleSelectTicket = (ticketId: number, checked: boolean) => {
        setSelectedTickets((current) =>
            checked
                ? [...current, ticketId]
                : current.filter((id) => id !== ticketId),
        );
    };

    const handleBulkAction = (action: string) => {
        if (selectedTickets.length === 0) {
            return;
        }

        setBulkDialogAction(action);
        setBulkDialogValue('');
        setBulkDialogOpen(true);
    };

    const handleBulkSubmit = () => {
        if (selectedTickets.length === 0) {
            return;
        }

        if (bulkDialogAction === 'delete') {
            router.post(
                route('admin.tickets.bulk-delete'),
                { ticket_ids: selectedTickets },
                {
                    onSuccess: () => {
                        setSelectedTickets([]);
                        setBulkDialogOpen(false);
                    },
                    onError: (errors) => {
                        console.error('Bulk delete errors:', errors);
                    },
                },
            );
            return;
        }

        router.post(
            route('admin.tickets.bulk-update'),
            {
                ticket_ids: selectedTickets,
                action: bulkDialogAction,
                value:
                    bulkDialogAction === 'add_tags' ||
                    bulkDialogAction === 'remove_tags'
                        ? bulkDialogValue
                              .split(',')
                              .map((id) => parseInt(id.trim()))
                              .filter((id) => !isNaN(id))
                        : bulkDialogValue,
            },
            {
                onSuccess: () => {
                    setSelectedTickets([]);
                    setBulkDialogOpen(false);
                    setBulkDialogValue('');
                },
                onError: (errors) => {
                    console.error('Bulk update errors:', errors);
                    toast.error('Failed to update tickets', {
                        description:
                            errors.message ||
                            'An error occurred while updating tickets. Please try again.',
                        duration: 5000,
                    });
                },
            },
        );
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    const canPickTicket = (ticket: Ticket) =>
        !can('tickets.assign') &&
        !ticket.assigned_agent &&
        ticket.assigned_team &&
        ticket.assigned_team.id === currentUserDepartmentId;

    const handlePickTicket = (ticket: Ticket) => {
        router.put(
            route('admin.tickets.update', { ticket: ticket.id }),
            { assigned_agent_id: currentUserId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Ticket picked successfully!');
                },
                onError: (errors) => {
                    const errorMessage =
                        errors.assigned_agent_id ||
                        errors.message ||
                        Object.values(errors).flat().join(', ') ||
                        'Failed to pick ticket.';

                    toast.error(errorMessage);
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Tickets" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-muted-foreground" />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Tickets
                            </h1>
                            <Badge
                                variant="secondary"
                                className="h-6 px-2 text-xs font-normal"
                            >
                                {tickets.total}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Queue view for support work, approvals, and routing.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link
                                href={route('admin.ticket-approvals.pending')}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approvals
                                {!!counts?.pending_approvals && (
                                    <Badge className="ml-2 h-5 min-w-5 bg-blue-600 px-1.5 text-xs text-white">
                                        {counts.pending_approvals > 99
                                            ? '99+'
                                            : counts.pending_approvals}
                                    </Badge>
                                )}
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.tickets.rejected')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejected
                                {!!counts?.rejected_tickets && (
                                    <Badge className="ml-2 h-5 min-w-5 bg-red-600 px-1.5 text-xs text-white">
                                        {counts.rejected_tickets > 99
                                            ? '99+'
                                            : counts.rejected_tickets}
                                    </Badge>
                                )}
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={route('admin.tickets.export', filters)}
                                download
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </a>
                        </Button>
                        {can('tickets.create') && (
                            <Button size="sm" asChild>
                                <Link href={route('admin.tickets.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New
                                </Link>
                            </Button>
                        )}
                    </div>
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

                <div className="rounded-md border bg-background">
                    <div className="border-b p-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                                <Tabs
                                    value={getActiveViewTab()}
                                    onValueChange={handleViewTabChange}
                                >
                                    <TabsList className="h-8 rounded-md border bg-muted/40 p-0.5">
                                        <TabsTrigger
                                            value="my-tickets"
                                            className="h-7 gap-1.5 px-3 text-xs"
                                        >
                                            <UserCircle className="h-3.5 w-3.5" />
                                            My tickets
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="all-tickets"
                                            className="h-7 gap-1.5 px-3 text-xs"
                                        >
                                            <List className="h-3.5 w-3.5" />
                                            All
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <Tabs
                                    value={getActiveStatusTab()}
                                    onValueChange={handleStatusTabChange}
                                >
                                    <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                                        <TabsTrigger
                                            value="all"
                                            className="h-7 rounded-md border px-2.5 text-xs data-[state=active]:bg-muted"
                                        >
                                            All status
                                        </TabsTrigger>
                                        {options.statuses.map((status) => (
                                            <TabsTrigger
                                                key={status}
                                                value={status}
                                                className={cn(
                                                    'h-7 rounded-md border px-2.5 text-xs capitalize',
                                                    statusTabActiveClasses[
                                                        status
                                                    ] ??
                                                        'data-[state=active]:bg-muted',
                                                )}
                                            >
                                                {formatStatus(status)}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>

                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative min-w-0 sm:w-80">
                                    <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search tickets"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const newFilters = {
                                                    ...filters,
                                                };
                                                if (searchQuery === '') {
                                                    delete newFilters.q;
                                                } else {
                                                    newFilters.q = searchQuery;
                                                }
                                                handleFiltersChange(newFilters);
                                            }
                                        }}
                                        className="h-8 pl-8 text-sm"
                                    />
                                </div>
                                <AdvancedSearch
                                    filters={filters}
                                    options={options}
                                    onFiltersChange={handleFiltersChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex min-h-11 flex-col gap-2 border-b bg-muted/20 px-3 py-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium">
                                {getActiveViewTab() === 'my-tickets'
                                    ? 'My tickets'
                                    : 'All tickets'}
                            </span>
                            <span className="text-muted-foreground">
                                {tickets.total} total
                            </span>
                            {filters.status && (
                                <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 text-[11px] capitalize"
                                >
                                    {formatStatus(filters.status)}
                                </Badge>
                            )}
                        </div>
                        {selectedTickets.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="mr-1 text-xs font-medium text-primary">
                                    {selectedTickets.length} selected
                                </span>
                                {can('tickets.edit') && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleBulkAction('status')
                                            }
                                            className="h-7 px-2 text-xs"
                                        >
                                            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                                            Status
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleBulkAction('priority')
                                            }
                                            className="h-7 px-2 text-xs"
                                        >
                                            <Radio className="mr-1 h-3.5 w-3.5" />
                                            Priority
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleBulkAction('add_tags')
                                            }
                                            className="h-7 px-2 text-xs"
                                        >
                                            <Tag className="mr-1 h-3.5 w-3.5" />
                                            Add tags
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleBulkAction('remove_tags')
                                            }
                                            className="h-7 px-2 text-xs"
                                        >
                                            <X className="mr-1 h-3.5 w-3.5" />
                                            Remove tags
                                        </Button>
                                    </>
                                )}
                                {can('tickets.assign') && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleBulkAction('assign_agent')
                                            }
                                            className="h-7 px-2 text-xs"
                                        >
                                            <User className="mr-1 h-3.5 w-3.5" />
                                            Agent
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleBulkAction('assign_team')
                                            }
                                            className="h-7 px-2 text-xs"
                                        >
                                            <Users className="mr-1 h-3.5 w-3.5" />
                                            Team
                                        </Button>
                                    </>
                                )}
                                {can('tickets.delete') && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            handleBulkAction('delete')
                                        }
                                        className="h-7 px-2 text-xs"
                                    >
                                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTickets([])}
                                    className="h-7 px-2 text-xs"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>

                    {tickets.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                                <Ticket className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-semibold">
                                No tickets found
                            </h3>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                                {Object.keys(filters).length > 0
                                    ? 'Adjust filters or clear the search to see more tickets.'
                                    : 'Create a ticket to start tracking support work.'}
                            </p>
                            {can('tickets.create') &&
                                Object.keys(filters).length === 0 && (
                                    <Button asChild size="sm" className="mt-4">
                                        <Link
                                            href={route('admin.tickets.create')}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create ticket
                                        </Link>
                                    </Button>
                                )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={
                                                someSelected
                                                    ? 'indeterminate'
                                                    : allSelected
                                            }
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all tickets"
                                        />
                                    </TableHead>
                                    <TableHead className="min-w-[320px]">
                                        Ticket
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="min-w-[160px]">
                                        Requester
                                    </TableHead>
                                    <TableHead className="min-w-[160px]">
                                        Assigned
                                    </TableHead>
                                    <TableHead className="min-w-[140px]">
                                        Category
                                    </TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-28 text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.data.map((ticket) => (
                                    <TableRow key={ticket.id} className="h-14">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedTickets.includes(
                                                    ticket.id,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    handleSelectTicket(
                                                        ticket.id,
                                                        checked as boolean,
                                                    )
                                                }
                                                aria-label={`Select ticket ${ticket.ticket_number}`}
                                            />
                                        </TableCell>
                                        <TableCell className="max-w-[420px]">
                                            <div className="min-w-0">
                                                <Link
                                                    href={route(
                                                        'admin.tickets.show',
                                                        { ticket: ticket.id },
                                                    )}
                                                    className="block truncate text-sm font-medium hover:text-primary hover:underline"
                                                >
                                                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                                                        {ticket.ticket_number}
                                                    </span>
                                                    {ticket.subject}
                                                </Link>
                                                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                                                    {ticket.project && (
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            {ticket.project
                                                                .code ||
                                                                ticket.project
                                                                    .name}
                                                        </span>
                                                    )}
                                                    {ticket.current_approval && (
                                                        <Badge
                                                            variant="outline"
                                                            className="h-5 gap-1 border-amber-200 bg-amber-50 px-1.5 text-[11px] text-amber-800"
                                                        >
                                                            <Clock className="h-3 w-3" />
                                                            Approval
                                                        </Badge>
                                                    )}
                                                    {ticket.rejected_approval && (
                                                        <Badge
                                                            variant="outline"
                                                            className="h-5 gap-1 border-red-200 bg-red-50 px-1.5 text-[11px] text-red-700"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Rejected
                                                        </Badge>
                                                    )}
                                                    {ticket.tags
                                                        .slice(0, 2)
                                                        .map((tag) => (
                                                            <span
                                                                key={tag.id}
                                                                className="h-2 w-2 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        tag.color,
                                                                }}
                                                                title={tag.name}
                                                            />
                                                        ))}
                                                    {ticket.tags.length > 2 && (
                                                        <span className="text-[11px] text-muted-foreground">
                                                            +
                                                            {ticket.tags
                                                                .length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    'h-5 px-1.5 text-[11px] capitalize',
                                                    statusColorMap[
                                                        ticket.status
                                                    ] ??
                                                        'bg-gray-100 text-gray-800',
                                                )}
                                            >
                                                {ticket.status_label ??
                                                    formatStatus(ticket.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    'h-5 px-1.5 text-[11px] capitalize',
                                                    priorityColorMap[
                                                        ticket.priority
                                                    ] ??
                                                        'bg-gray-100 text-gray-800',
                                                )}
                                            >
                                                {ticket.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex min-w-0 items-center gap-2">
                                                {ticket.requester ? (
                                                    <UserAvatar
                                                        user={ticket.requester}
                                                        size="sm"
                                                        className="h-6 w-6 shrink-0"
                                                    />
                                                ) : (
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="truncate text-sm">
                                                    {ticket.requester?.name ??
                                                        '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex min-w-0 items-center gap-2">
                                                {ticket.assigned_agent ? (
                                                    <UserAvatar
                                                        user={
                                                            ticket.assigned_agent
                                                        }
                                                        size="sm"
                                                        className="h-6 w-6 shrink-0"
                                                    />
                                                ) : (
                                                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                )}
                                                <span className="truncate text-sm">
                                                    {ticket.assigned_agent
                                                        ?.name ??
                                                        ticket.assigned_team
                                                            ?.name ??
                                                        'Unassigned'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                                            {ticket.category?.name ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(ticket.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {canPickTicket(ticket) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handlePickTicket(
                                                                ticket,
                                                            )
                                                        }
                                                        className="h-7 px-2 text-xs text-emerald-700"
                                                    >
                                                        <UserPlus className="mr-1 h-3.5 w-3.5" />
                                                        Pick
                                                    </Button>
                                                )}
                                                {can('tickets.edit') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="h-7 w-7"
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.tickets.edit',
                                                                {
                                                                    ticket: ticket.id,
                                                                },
                                                            )}
                                                            aria-label={`Edit ${ticket.ticket_number}`}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                {can('tickets.delete') && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                setDeleteDialogOpen(
                                                                    ticket.id,
                                                                )
                                                            }
                                                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            aria-label={`Delete ${ticket.ticket_number}`}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <AlertDialog
                                                            open={
                                                                deleteDialogOpen ===
                                                                ticket.id
                                                            }
                                                            onOpenChange={(
                                                                open,
                                                            ) => {
                                                                if (!open) {
                                                                    setDeleteDialogOpen(
                                                                        null,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Delete
                                                                        Ticket
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you
                                                                        sure you
                                                                        want to
                                                                        delete
                                                                        ticket "
                                                                        {
                                                                            ticket.ticket_number
                                                                        }
                                                                        "? This
                                                                        action
                                                                        cannot
                                                                        be
                                                                        undone.
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
                                                                    <AlertDialogAction
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            setDeleteDialogOpen(
                                                                                null,
                                                                            );
                                                                            router.delete(
                                                                                route(
                                                                                    'admin.tickets.destroy',
                                                                                    {
                                                                                        ticket: ticket.id,
                                                                                    },
                                                                                ),
                                                                                {
                                                                                    preserveScroll: true,
                                                                                    onError:
                                                                                        (
                                                                                            errors,
                                                                                        ) => {
                                                                                            console.error(
                                                                                                'Delete errors:',
                                                                                                errors,
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
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {tickets.links.length > 3 && (
                        <div className="flex flex-wrap items-center justify-end gap-1 border-t px-3 py-2">
                            {tickets.links.map((link, index) => {
                                const label =
                                    index === 0
                                        ? 'Previous'
                                        : index === tickets.links.length - 1
                                          ? 'Next'
                                          : link.label;

                                if (link.label === '...') {
                                    return (
                                        <span
                                            key={index}
                                            className="px-2 text-sm text-muted-foreground"
                                        >
                                            ...
                                        </span>
                                    );
                                }

                                return (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url)
                                        }
                                        className="h-8 min-w-8 px-2 text-xs"
                                    >
                                        {label}
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {bulkDialogAction === 'status' && 'Change Status'}
                            {bulkDialogAction === 'priority' &&
                                'Change Priority'}
                            {bulkDialogAction === 'assign_agent' &&
                                'Assign Agent'}
                            {bulkDialogAction === 'assign_team' &&
                                'Assign Team'}
                            {bulkDialogAction === 'add_tags' && 'Add Tags'}
                            {bulkDialogAction === 'remove_tags' &&
                                'Remove Tags'}
                            {bulkDialogAction === 'delete' && 'Delete Tickets'}
                        </DialogTitle>
                        <DialogDescription>
                            This will affect {selectedTickets.length} ticket(s).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {bulkDialogAction === 'status' && (
                            <Select
                                value={bulkDialogValue}
                                onValueChange={setBulkDialogValue}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.statuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status
                                                .replace('_', ' ')
                                                .replace(/\b\w/g, (letter) =>
                                                    letter.toUpperCase(),
                                                )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {bulkDialogAction === 'priority' && (
                            <Select
                                value={bulkDialogValue}
                                onValueChange={setBulkDialogValue}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.priorities.map((priority) => (
                                        <SelectItem
                                            key={priority}
                                            value={priority}
                                        >
                                            {priority.charAt(0).toUpperCase() +
                                                priority.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {bulkDialogAction === 'assign_agent' && (
                            <Select
                                value={bulkDialogValue}
                                onValueChange={setBulkDialogValue}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.agents.map((agent) => (
                                        <SelectItem
                                            key={agent.id}
                                            value={agent.id.toString()}
                                        >
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {bulkDialogAction === 'assign_team' && (
                            <Select
                                value={bulkDialogValue}
                                onValueChange={setBulkDialogValue}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.teams.map((team) => (
                                        <SelectItem
                                            key={team.id}
                                            value={team.id.toString()}
                                        >
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(bulkDialogAction === 'add_tags' ||
                            bulkDialogAction === 'remove_tags') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Select Tags
                                </label>
                                <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-2">
                                    {options.tags.map((tag) => (
                                        <div
                                            key={tag.id}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={bulkDialogValue
                                                    .split(',')
                                                    .includes(
                                                        tag.id.toString(),
                                                    )}
                                                onCheckedChange={(checked) => {
                                                    const tagIds =
                                                        bulkDialogValue
                                                            ? bulkDialogValue
                                                                  .split(',')
                                                                  .map((id) =>
                                                                      id.trim(),
                                                                  )
                                                            : [];

                                                    setBulkDialogValue(
                                                        checked
                                                            ? [
                                                                  ...tagIds,
                                                                  tag.id.toString(),
                                                              ].join(',')
                                                            : tagIds
                                                                  .filter(
                                                                      (id) =>
                                                                          id !==
                                                                          tag.id.toString(),
                                                                  )
                                                                  .join(','),
                                                    );
                                                }}
                                            />
                                            <Badge
                                                style={{
                                                    backgroundColor: tag.color,
                                                }}
                                                className="text-white"
                                            >
                                                {tag.name}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {bulkDialogAction === 'delete' && (
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete{' '}
                                {selectedTickets.length} ticket(s)? This action
                                cannot be undone.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBulkDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkSubmit}
                            disabled={
                                (bulkDialogAction !== 'delete' &&
                                    !bulkDialogValue) ||
                                ((bulkDialogAction === 'add_tags' ||
                                    bulkDialogAction === 'remove_tags') &&
                                    !bulkDialogValue)
                            }
                        >
                            {bulkDialogAction === 'delete' ? 'Delete' : 'Apply'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
