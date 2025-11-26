import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdvancedSearch } from '@/components/advanced-search';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

type Option = { id: number; name: string };

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

export default function TicketIndex({ tickets, filters, options }: Props) {
  const { can } = usePermissions();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogAction, setBulkDialogAction] = useState<string>('');
  const [bulkDialogValue, setBulkDialogValue] = useState<string>('');

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
      if (confirm(`Are you sure you want to delete ${selectedTickets.length} ticket(s)?`)) {
        router.post(
          route('admin.tickets.bulk-delete'),
          { ticket_ids: selectedTickets },
          {
            onSuccess: () => {
              setSelectedTickets([]);
              setBulkDialogOpen(false);
            },
          }
        );
      }
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
          onSuccess: () => {
            setSelectedTickets([]);
            setBulkDialogOpen(false);
            setBulkDialogValue('');
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

      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer issues across projects and departments.
          </p>
        </div>

        {can('tickets.create') && (
          <Button asChild>
            <Link href={route('admin.tickets.create')}>New Ticket</Link>
          </Button>
        )}
      </div>

      {/* Advanced Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <AdvancedSearch
            filters={filters}
            options={options}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Tickets ({tickets.total})</CardTitle>
            {selectedTickets.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedTickets.length} selected
                </span>
                {can('tickets.edit') && (
                  <div className="flex items-center gap-2">
                    <Select value={bulkAction} onValueChange={handleBulkAction}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Bulk Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Change Status</SelectItem>
                        <SelectItem value="priority">Change Priority</SelectItem>
                        <SelectItem value="assign_agent">Assign Agent</SelectItem>
                        <SelectItem value="assign_team">Assign Team</SelectItem>
                        <SelectItem value="add_tags">Add Tags</SelectItem>
                        <SelectItem value="remove_tags">Remove Tags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {can('tickets.delete') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete Selected
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTickets([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets found.</p>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({tickets.data.length})
                </span>
              </div>

              {tickets.data.map((ticket) => (
                <div key={ticket.id} className="p-4 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTickets.includes(ticket.id)}
                      onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={route('admin.tickets.show', { ticket: ticket.id })} className="font-medium text-primary">
                      {ticket.ticket_number} &mdash; {ticket.subject}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {ticket.category?.name} · {ticket.project?.name ?? 'No project'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn('capitalize', statusColorMap[ticket.status] ?? '')}>{ticket.status.replace('_', ' ')}</Badge>
                    <Badge className={cn('capitalize', priorityColorMap[ticket.priority] ?? '')}>{ticket.priority}</Badge>
                    {ticket.tags.map((tag) => (
                      <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                    <div>
                      <div className="text-xs uppercase tracking-wider">Requester</div>
                      <div>{ticket.requester?.name ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider">Assigned</div>
                      <div>{ticket.assigned_agent?.name ?? ticket.assigned_team?.name ?? 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider">Opened</div>
                      <div>{new Date(ticket.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  {(can('tickets.edit') || can('tickets.delete')) && (
                    <div className="flex gap-2 ml-4">
                      {can('tickets.edit') && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={route('admin.tickets.edit', { ticket: ticket.id })}>Edit</Link>
                        </Button>
                      )}
                      {can('tickets.delete') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this ticket?')) {
                              router.delete(route('admin.tickets.destroy', { ticket: ticket.id }));
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {tickets.links.map((link) => (
              <Button
                key={link.label}
                variant={link.active ? 'default' : 'outline'}
                size="sm"
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url)}
              >
                <span dangerouslySetInnerHTML={{ __html: link.label }} />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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


