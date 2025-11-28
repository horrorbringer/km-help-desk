import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Download } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  useToast(); // Handle flash messages
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogAction, setBulkDialogAction] = useState<string>('');
  const [bulkDialogValue, setBulkDialogValue] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            asChild
          >
            <a
              href={route('admin.tickets.export', filters)}
              download
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </a>
          </Button>
          {can('tickets.create') && (
            <Button asChild>
              <Link href={route('admin.tickets.create')}>New Ticket</Link>
            </Button>
          )}
        </div>
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
            <div className="text-center py-12">
              <p className="text-lg font-medium text-muted-foreground mb-2">No tickets found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first ticket.'}
              </p>
              {can('tickets.create') && Object.keys(filters).length === 0 && (
                <Button asChild>
                  <Link href={route('admin.tickets.create')}>Create Ticket</Link>
                </Button>
              )}
            </div>
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

              <div className="space-y-3">
                {tickets.data.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all duration-200 bg-card"
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={route('admin.tickets.show', { ticket: ticket.id })}
                              className="font-semibold text-base text-primary hover:underline block mb-1"
                            >
                              {ticket.ticket_number} &mdash; {ticket.subject}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {ticket.category && (
                                <span className="inline-flex items-center">
                                  <span className="mr-1">📁</span>
                                  {ticket.category.name}
                                </span>
                              )}
                              {ticket.project && (
                                <span className="inline-flex items-center">
                                  <span className="mx-1">·</span>
                                  <span className="mr-1">📂</span>
                                  {ticket.project.name}
                                </span>
                              )}
                              {!ticket.project && ticket.category && (
                                <span className="text-muted-foreground/60">· No project</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={cn(
                                'capitalize font-medium',
                                statusColorMap[ticket.status] ?? 'bg-gray-100 text-gray-800'
                              )}
                            >
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge
                              className={cn(
                                'capitalize font-medium',
                                priorityColorMap[ticket.priority] ?? 'bg-gray-100 text-gray-800'
                              )}
                            >
                              {ticket.priority}
                            </Badge>
                            {ticket.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {ticket.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    style={{ backgroundColor: tag.color, color: '#fff' }}
                                    className="text-xs font-medium"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {ticket.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{ticket.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              Requester
                            </div>
                            <div className="text-sm font-medium">{ticket.requester?.name ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              Assigned To
                            </div>
                            <div className="text-sm font-medium">
                              {ticket.assigned_agent?.name ?? ticket.assigned_team?.name ?? (
                                <span className="text-muted-foreground italic">Unassigned</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              Created
                            </div>
                            <div className="text-sm font-medium">
                              {new Date(ticket.created_at).toLocaleDateString()}
                              <span className="text-muted-foreground ml-1">
                                {new Date(ticket.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(can('tickets.edit') || can('tickets.delete')) && (
                          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                            {can('tickets.edit') && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={route('admin.tickets.edit', { ticket: ticket.id })}>Edit</Link>
                              </Button>
                            )}
                            {can('tickets.delete') && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialogOpen(ticket.id);
                                  }}
                                >
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
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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


