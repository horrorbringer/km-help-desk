import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import React from 'react';
import { Download, Clock, CheckCircle2, XCircle, Plus, Ticket, User, Users, Calendar, Tag, Edit, Trash2, MoreVertical, UserPlus, Search, UserCircle, List, FolderKanban, Radio, ArrowUpDown, X } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { AdvancedSearch } from '@/components/advanced-search';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/user-avatar';

type Option = { id: number; name: string; email?: string; avatar?: string | null };

type Ticket = {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
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

export default function TicketIndex({ tickets, filters, options, counts, flash }: Props) {
  const { can } = usePermissions();
  const { toast } = useToast(); // Handle flash messages
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogAction, setBulkDialogAction] = useState<string>('');
  const [bulkDialogValue, setBulkDialogValue] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(filters.q || '');
  
  // Get current user info for pick ticket functionality
  const page = usePage();
  const pageProps = page.props as any;
  const currentUserId = pageProps.auth?.user?.id;
  const currentUserDepartmentId = pageProps.auth?.user?.department_id;

  // Tab state - determine active tab based on filters
  const getActiveViewTab = () => {
    // Check if "My Tickets" is active by looking for requester filter or agent filter matching current user
    if (filters.requester === String(currentUserId) || filters.agent === String(currentUserId)) {
      return 'my-tickets';
    }
    return 'all-tickets';
  };

  const getActiveStatusTab = () => {
    return filters.status || 'all';
  };

  const handleViewTabChange = (value: string) => {
    const newFilters = { ...filters };
    
    if (value === 'my-tickets') {
      // Filter by requester to show tickets the user created
      // This allows requesters to see their own tickets
      newFilters.requester = String(currentUserId);
      // Also include agent filter in case user wants to see tickets assigned to them
      // But prioritize requester filter
      delete newFilters.agent;
    } else {
      // Clear both filters when switching to "All Tickets"
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

  // Sync search query with filters when filters change from other sources
  React.useEffect(() => {
    setSearchQuery(filters.q || '');
  }, [filters.q]);

  // Debounce search - only search after user stops typing for 500ms
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

  const handleFiltersChange = (newFilters: Filters) => {
    router.get(route('admin.tickets.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
    // Clear selection when filters change
    setSelectedTickets([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(tickets.data.map((ticket) => ticket.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: number, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId]);
    } else {
      setSelectedTickets(selectedTickets.filter((id) => id !== ticketId));
    }
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
        }
      );
    } else {
      router.post(
        route('admin.tickets.bulk-update'),
        {
          ticket_ids: selectedTickets,
          action: bulkDialogAction,
          value: bulkDialogAction === 'add_tags' || bulkDialogAction === 'remove_tags' 
            ? bulkDialogValue.split(',').map((id) => parseInt(id.trim())).filter((id) => !isNaN(id))
            : bulkDialogValue,
        },
        {
          onSuccess: (page) => {
            setSelectedTickets([]);
            setBulkDialogOpen(false);
            setBulkDialogValue('');
            // Flash messages (success/error/warning) are handled by useToast hook
            // Error details are automatically displayed in toast notifications
          },
          onError: (errors) => {
            console.error('Bulk update errors:', errors);
            // Show error toast if validation errors occur
            if (errors.message) {
              toast.error('Failed to update tickets', {
                description: errors.message,
                duration: 5000,
              });
            } else {
              toast.error('Failed to update tickets', {
                description: 'An error occurred while updating tickets. Please try again.',
                duration: 5000,
              });
            }
          },
        }
      );
    }
  };

  const allSelected = tickets.data.length > 0 && selectedTickets.length === tickets.data.length;
  const someSelected = selectedTickets.length > 0 && selectedTickets.length < tickets.data.length;

  return (
    <AppLayout>
      <Head title="Tickets" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage customer issues across projects and departments
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="relative"
            >
              <Link href={route('admin.ticket-approvals.pending')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pending Approvals
                {counts && counts.pending_approvals > 0 && (
                  <Badge 
                    variant="default" 
                    className="ml-2 bg-blue-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center"
                  >
                    {counts.pending_approvals > 99 ? '99+' : counts.pending_approvals}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="relative"
            >
              <Link href={route('admin.tickets.rejected')}>
                <XCircle className="h-4 w-4 mr-2" />
                Rejected
                {counts && counts.rejected_tickets > 0 && (
                  <Badge 
                    variant="default" 
                    className="ml-2 bg-red-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center"
                  >
                    {counts.rejected_tickets > 99 ? '99+' : counts.rejected_tickets}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={route('admin.tickets.export', filters)}
                download
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </a>
            </Button>
            {can('tickets.create') && (
              <Button asChild>
                <Link href={route('admin.tickets.create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Link>
              </Button>
            )}
          </div>
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

        {/* Tabs for View and Status */}
        <Card className="border-2 shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="space-y-4">
              {/* View Tabs (My Tickets / All Tickets) */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  View
                </label>
                <Tabs value={getActiveViewTab()} onValueChange={handleViewTabChange} className="w-full">
                  <TabsList className="w-full sm:w-auto h-auto p-1 bg-muted/50 border">
                    <TabsTrigger 
                      value="my-tickets" 
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span className="font-medium">My Tickets</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="all-tickets" 
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <List className="h-4 w-4" />
                      <span className="font-medium">All Tickets</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Status Tabs */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Status
                </label>
                <Tabs value={getActiveStatusTab()} onValueChange={handleStatusTabChange} className="w-full">
                  <TabsList className="w-full h-auto p-1 bg-muted/30 border flex-wrap gap-1">
                    <TabsTrigger 
                      value="all" 
                      className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger 
                      value="open" 
                      className="text-xs sm:text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
                    >
                      Open
                    </TabsTrigger>
                    <TabsTrigger 
                      value="assigned" 
                      className="text-xs sm:text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-200 dark:data-[state=active]:bg-indigo-950 dark:data-[state=active]:text-indigo-300"
                    >
                      Assigned
                    </TabsTrigger>
                    <TabsTrigger 
                      value="in_progress" 
                      className="text-xs sm:text-sm data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border-amber-200 dark:data-[state=active]:bg-amber-950 dark:data-[state=active]:text-amber-300"
                    >
                      In Progress
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pending" 
                      className="text-xs sm:text-sm data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:border-yellow-200 dark:data-[state=active]:bg-yellow-950 dark:data-[state=active]:text-yellow-300"
                    >
                      Pending
                    </TabsTrigger>
                    <TabsTrigger 
                      value="resolved" 
                      className="text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 dark:data-[state=active]:bg-emerald-950 dark:data-[state=active]:text-emerald-300"
                    >
                      Resolved
                    </TabsTrigger>
                    <TabsTrigger 
                      value="closed" 
                      className="text-xs sm:text-sm data-[state=active]:bg-slate-50 data-[state=active]:text-slate-700 data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-300"
                    >
                      Closed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Advanced Filters - Combined */}
        <Card className="border-2 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by number, subject, description, or requester..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newFilters = { ...filters };
                      if (searchQuery === '') {
                        delete newFilters.q;
                      } else {
                        newFilters.q = searchQuery;
                      }
                      handleFiltersChange(newFilters);
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <AdvancedSearch
                filters={filters}
                options={options}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </CardContent>
        </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">
                {getActiveViewTab() === 'my-tickets' ? 'My Tickets' : 'All Tickets'}
              </CardTitle>
              <Badge variant="secondary" className="font-normal">
                {tickets.total} {tickets.total === 1 ? 'ticket' : 'tickets'}
              </Badge>
              {filters.status && (
                <Badge variant="outline" className="capitalize">
                  {filters.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
            {selectedTickets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-primary/5 border-2 border-primary/30 shadow-sm">
                <div className="flex items-center gap-2 mr-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-primary">
                    {selectedTickets.length} {selectedTickets.length === 1 ? 'ticket' : 'tickets'} selected
                  </span>
                </div>
                
                <div className="h-5 w-px bg-border mx-1" />
                
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Status & Priority Actions */}
                  {can('tickets.edit') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('status')}
                        className="h-8 text-xs"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                        Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('priority')}
                        className="h-8 text-xs"
                      >
                        <Radio className="h-3.5 w-3.5 mr-1.5" />
                        Priority
                      </Button>
                    </>
                  )}
                  
                  {/* Assignment Actions */}
                  {can('tickets.assign') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('assign_agent')}
                        className="h-8 text-xs"
                      >
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        Agent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('assign_team')}
                        className="h-8 text-xs"
                      >
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Team
                      </Button>
                    </>
                  )}
                  
                  {/* Tag Actions */}
                  {can('tickets.edit') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('add_tags')}
                        className="h-8 text-xs"
                      >
                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                        Add Tags
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('remove_tags')}
                        className="h-8 text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Remove Tags
                      </Button>
                    </>
                  )}
                  
                  {/* Destructive Action */}
                  {can('tickets.delete') && (
                    <>
                      <div className="h-5 w-px bg-border mx-1" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBulkAction('delete')}
                        className="h-8 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </>
                  )}
                  
                  {/* Clear Selection */}
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTickets([])}
                      className="h-8 text-xs"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.data.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters to see more results, or clear all filters to view all tickets.'
                  : 'Get started by creating your first ticket to track and manage customer issues.'}
              </p>
              {can('tickets.create') && Object.keys(filters).length === 0 && (
                <Button asChild>
                  <Link href={route('admin.tickets.create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ticket
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="flex items-center gap-3 pb-3 border-b bg-muted/30 px-4 py-2 rounded-t-lg">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Select all {tickets.data.length} tickets
                </span>
              </div>

              <div className="divide-y">
                {tickets.data.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group p-4 hover:bg-muted/30 transition-colors duration-150"
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0 space-y-2">
                            <Link
                              href={route('admin.tickets.show', { ticket: ticket.id })}
                              className="font-semibold text-base text-foreground hover:text-primary transition-colors block group-hover:underline"
                            >
                              <span className="text-muted-foreground font-mono text-sm mr-2">{ticket.ticket_number}</span>
                              {ticket.subject}
                            </Link>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              {ticket.category && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="text-xs">📁</span>
                                  <span>{ticket.category.name}</span>
                                </span>
                              )}
                              {ticket.project && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="text-xs">📂</span>
                                  <span>{ticket.project.name}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={cn(
                                'capitalize font-medium text-xs px-2 py-0.5',
                                statusColorMap[ticket.status] ?? 'bg-gray-100 text-gray-800'
                              )}
                            >
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge
                              className={cn(
                                'capitalize font-medium text-xs px-2 py-0.5',
                                priorityColorMap[ticket.priority] ?? 'bg-gray-100 text-gray-800'
                              )}
                            >
                              {ticket.priority}
                            </Badge>
                            {ticket.current_approval && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1 text-xs px-2 py-0.5"
                              >
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                            {ticket.rejected_approval && (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 text-xs px-2 py-0.5"
                              >
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </Badge>
                            )}
                            {ticket.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {ticket.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    style={{ backgroundColor: tag.color, color: '#fff' }}
                                    className="text-xs font-medium px-2 py-0.5"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {ticket.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    +{ticket.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t">
                          <div className="flex items-start gap-2.5">
                            {ticket.requester ? (
                              <UserAvatar user={ticket.requester} size="sm" className="shrink-0 mt-0.5" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Requester
                              </div>
                              <div className="text-sm font-medium truncate">{ticket.requester?.name ?? '—'}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            {ticket.assigned_agent ? (
                              <UserAvatar user={ticket.assigned_agent} size="sm" className="shrink-0 mt-0.5" />
                            ) : ticket.assigned_team ? (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                            ) : (
                              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Assigned To
                              </div>
                              <div className="text-sm font-medium truncate">
                                {ticket.assigned_agent?.name ?? ticket.assigned_team?.name ?? (
                                  <span className="text-muted-foreground italic">Unassigned</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Created
                              </div>
                              <div className="text-sm font-medium">
                                {new Date(ticket.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                                <span className="text-muted-foreground ml-1.5 text-xs">
                                  {new Date(ticket.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Check if current user can pick this ticket */}
                        {(() => {
                          const canPickTicket = !can('tickets.assign') && // Agent without assign permission
                            !ticket.assigned_agent && // No agent assigned
                            ticket.assigned_team && // Ticket has a team assigned (always true)
                            ticket.assigned_team.id === currentUserDepartmentId; // Assigned to their team
                          
                          return (canPickTicket || can('tickets.edit') || can('tickets.delete')) && (
                            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                              {canPickTicket && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.put(route('admin.tickets.update', { ticket: ticket.id }), {
                                      assigned_agent_id: currentUserId,
                                    }, {
                                      preserveScroll: true,
                                      onSuccess: () => {
                                        toast.success('Ticket picked successfully!');
                                      },
                                      onError: (errors) => {
                                        const errorMessage = errors.assigned_agent_id 
                                          || errors.message 
                                          || Object.values(errors).flat().join(', ') 
                                          || 'Failed to pick ticket.';
                                        toast.error(errorMessage);
                                      },
                                    });
                                  }}
                                  className="h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                >
                                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                  Pick
                                </Button>
                              )}
                              {can('tickets.edit') && (
                                <Button variant="ghost" size="sm" asChild className="h-8">
                                  <Link href={route('admin.tickets.edit', { ticket: ticket.id })}>
                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                    Edit
                                  </Link>
                                </Button>
                              )}
                              {can('tickets.delete') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialogOpen(ticket.id);
                                  }}
                                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  Delete
                                </Button>
                                <AlertDialog
                                  open={deleteDialogOpen === ticket.id}
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setDeleteDialogOpen(null);
                                    }
                                  }}
                                >
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete ticket "{ticket.ticket_number}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setDeleteDialogOpen(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const ticketId = ticket.id;
                                          setDeleteDialogOpen(null); // Close dialog immediately
                                          router.delete(route('admin.tickets.destroy', { ticket: ticketId }), {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                              // Success handled by flash message and redirect
                                            },
                                            onError: (errors) => {
                                              console.error('Delete errors:', errors);
                                              // Error handled by flash message
                                            },
                                          });
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
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {tickets.links.length > 3 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-6 border-t">
              {tickets.links.map((link, index) => {
                if (index === 0) {
                  return (
                    <Button
                      key={link.label}
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className="min-w-[2.5rem]"
                    >
                      Previous
                    </Button>
                  );
                }
                if (index === tickets.links.length - 1) {
                  return (
                    <Button
                      key={link.label}
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className="min-w-[2.5rem]"
                    >
                      Next
                    </Button>
                  );
                }
                if (link.label === '...') {
                  return (
                    <span key={index} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }
                return (
                  <Button
                    key={link.label}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => link.url && router.visit(link.url)}
                    className="min-w-[2.5rem]"
                  >
                    {link.label}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkDialogAction === 'status' && 'Change Status'}
              {bulkDialogAction === 'priority' && 'Change Priority'}
              {bulkDialogAction === 'assign_agent' && 'Assign Agent'}
              {bulkDialogAction === 'assign_team' && 'Assign Team'}
              {bulkDialogAction === 'add_tags' && 'Add Tags'}
              {bulkDialogAction === 'remove_tags' && 'Remove Tags'}
              {bulkDialogAction === 'delete' && 'Delete Tickets'}
            </DialogTitle>
            <DialogDescription>
              This will affect {selectedTickets.length} ticket(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {bulkDialogAction === 'status' && (
              <Select value={bulkDialogValue} onValueChange={setBulkDialogValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {options.statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {bulkDialogAction === 'priority' && (
              <Select value={bulkDialogValue} onValueChange={setBulkDialogValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  {options.priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {bulkDialogAction === 'assign_agent' && (
              <Select value={bulkDialogValue} onValueChange={setBulkDialogValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {options.agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {bulkDialogAction === 'assign_team' && (
              <Select value={bulkDialogValue} onValueChange={setBulkDialogValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {options.teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(bulkDialogAction === 'add_tags' || bulkDialogAction === 'remove_tags') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Tags</label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                  {options.tags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={bulkDialogValue.split(',').includes(tag.id.toString())}
                        onCheckedChange={(checked) => {
                          const tagIds = bulkDialogValue
                            ? bulkDialogValue.split(',').map((id) => id.trim())
                            : [];
                          if (checked) {
                            setBulkDialogValue([...tagIds, tag.id.toString()].join(','));
                          } else {
                            setBulkDialogValue(tagIds.filter((id) => id !== tag.id.toString()).join(','));
                          }
                        }}
                      />
                      <Badge style={{ backgroundColor: tag.color }} className="text-white">
                        {tag.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkDialogAction === 'delete' && (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete {selectedTickets.length} ticket(s)? This action cannot be undone.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkSubmit}
              disabled={
                bulkDialogAction !== 'delete' && !bulkDialogValue ||
                (bulkDialogAction === 'add_tags' || bulkDialogAction === 'remove_tags') && !bulkDialogValue
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


