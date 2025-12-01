import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { IconBookmark, IconBookmarkFilled, IconX, IconSearch } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface AdvancedSearchProps {
  filters: Record<string, any>;
  options: {
    statuses: string[];
    priorities: string[];
    teams: Array<{ id: number; name: string }>;
    agents: Array<{ id: number; name: string }>;
    categories: Array<{ id: number; name: string }>;
    projects: Array<{ id: number; name: string }>;
    requesters: Array<{ id: number; name: string }>;
    tags: Array<{ id: number; name: string; color: string }>;
  };
  onFiltersChange: (filters: Record<string, any>) => void;
}

interface SavedSearch {
  id: number;
  name: string;
  filters: Record<string, any>;
  usage_count: number;
  is_shared: boolean;
}

export function AdvancedSearch({ filters, options, onFiltersChange }: AdvancedSearchProps) {
  const page = usePage();
  const pageProps = page.props as { auth?: { user?: { id: number } | null } | null };
  const currentUserId = pageProps.auth?.user?.id;
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const response = await fetch(route('admin.saved-searches.index', { type: 'tickets' }));
      const data = await response.json();
      setSavedSearches(data.searches || []);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const handleFilter = (key: string, value: any) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all' || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const applySavedSearch = async (search: SavedSearch) => {
    try {
      const response = await fetch(route('admin.saved-searches.apply', search.id));
      const data = await response.json();
      if (data.success) {
        onFiltersChange(data.filters);
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to apply saved search:', error);
    }
  };

  const saveCurrentSearch = async () => {
    if (!searchName.trim()) return;

    setSavingSearch(true);
    try {
      const response = await fetch(route('admin.saved-searches.store'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          name: searchName,
          type: 'tickets',
          filters: filters,
          is_shared: false,
        }),
      });

      if (response.ok) {
        setSearchName('');
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    } finally {
      setSavingSearch(false);
    }
  };

  const activeFiltersCount = Object.keys(filters).filter((key) => {
    const value = filters[key];
    if (!value || value === '__all') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    // Exclude sort fields from active filter count
    if (key === 'order_by' || key === 'order_dir') return false;
    return true;
  }).length;

  return (
    <div className="space-y-4">
      {/* Quick Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by number, subject, description, or requester..."
            value={filters.q ?? ''}
            onChange={(e) => handleFilter('q', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                router.get(route('admin.tickets.index'), filters, {
                  preserveState: true,
                  replace: true,
                });
              }
            }}
            className="pl-10"
          />
        </div>
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Advanced {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0" align="start">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-4">
                {/* Saved Searches */}
                {savedSearches.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Saved Searches</Label>
                    <div className="space-y-1">
                      {savedSearches.map((search) => (
                        <div
                          key={search.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => {
                            applySavedSearch(search);
                            setShowAdvanced(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <IconBookmarkFilled className="h-4 w-4 text-primary" />
                            <span className="text-sm">{search.name}</span>
                            {search.is_shared && (
                              <Badge variant="outline" className="text-xs">
                                Shared
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {search.usage_count} uses
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                )}

                {/* Save Current Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Save Current Search</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search name..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveCurrentSearch();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={saveCurrentSearch}
                      disabled={!searchName.trim() || savingSearch}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Quick Filter Presets */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Quick Filters</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (currentUserId) {
                          handleFilter('agent', String(currentUserId));
                        }
                        setShowAdvanced(false);
                      }}
                      className="text-xs"
                      disabled={!currentUserId}
                    >
                      My Tickets
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilter('agent', '__none');
                        setShowAdvanced(false);
                      }}
                      className="text-xs"
                    >
                      Unassigned
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilter('sla_breached', 'any');
                        setShowAdvanced(false);
                      }}
                      className="text-xs"
                    >
                      SLA Breached
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilter('status', ['open', 'assigned', 'in_progress']);
                        setShowAdvanced(false);
                      }}
                      className="text-xs"
                    >
                      Active Tickets
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Sort Options */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Sort By</Label>
                    <Select
                      value={(filters.order_by as string) ?? 'created_at'}
                      onValueChange={(value) => handleFilter('order_by', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Created Date</SelectItem>
                        <SelectItem value="updated_at">Updated Date</SelectItem>
                        <SelectItem value="ticket_number">Ticket Number</SelectItem>
                        <SelectItem value="subject">Subject</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Order</Label>
                    <Select
                      value={(filters.order_dir as string) ?? 'desc'}
                      onValueChange={(value) => handleFilter('order_dir', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Filters</Label>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Status - Multi-select */}
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                      {options.statuses.map((status) => {
                        const statusArray = Array.isArray(filters.status) 
                          ? filters.status 
                          : filters.status 
                            ? [String(filters.status)] 
                            : [];
                        const isSelected = statusArray.includes(status);
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              const newStatuses = isSelected
                                ? statusArray.filter((s) => s !== status)
                                : [...statusArray, status];
                              handleFilter('status', newStatuses.length > 0 ? newStatuses : undefined);
                            }}
                            className={`px-2 py-1 rounded text-xs transition ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        );
                      })}
                      {Array.isArray(filters.status) && filters.status.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleFilter('status', undefined)}
                          className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Priority - Multi-select */}
                  <div className="space-y-2">
                    <Label className="text-xs">Priority</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                      {options.priorities.map((priority) => {
                        const priorityArray = Array.isArray(filters.priority) 
                          ? filters.priority 
                          : filters.priority 
                            ? [String(filters.priority)] 
                            : [];
                        const isSelected = priorityArray.includes(priority);
                        return (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => {
                              const newPriorities = isSelected
                                ? priorityArray.filter((p) => p !== priority)
                                : [...priorityArray, priority];
                              handleFilter('priority', newPriorities.length > 0 ? newPriorities : undefined);
                            }}
                            className={`px-2 py-1 rounded text-xs transition capitalize ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {priority}
                          </button>
                        );
                      })}
                      {Array.isArray(filters.priority) && filters.priority.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleFilter('priority', undefined)}
                          className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Team */}
                  <div className="space-y-2">
                    <Label className="text-xs">Team</Label>
                    <Select
                      value={(filters.team as string) ?? '__all'}
                      onValueChange={(value) => handleFilter('team', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All teams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">All teams</SelectItem>
                        {options.teams.map((team) => (
                          <SelectItem key={team.id} value={String(team.id)}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Agent */}
                  <div className="space-y-2">
                    <Label className="text-xs">Agent</Label>
                    <Select
                      value={(filters.agent as string) ?? '__all'}
                      onValueChange={(value) => handleFilter('agent', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All agents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">All agents</SelectItem>
                        {options.agents.map((agent) => (
                          <SelectItem key={agent.id} value={String(agent.id)}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={(filters.category as string) ?? '__all'}
                      onValueChange={(value) => handleFilter('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">All categories</SelectItem>
                        {options.categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project */}
                  <div className="space-y-2">
                    <Label className="text-xs">Project</Label>
                    <Select
                      value={(filters.project as string) ?? '__all'}
                      onValueChange={(value) => handleFilter('project', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">All projects</SelectItem>
                        {options.projects.map((project) => (
                          <SelectItem key={project.id} value={String(project.id)}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-xs">From Date</Label>
                      <Input
                        type="date"
                        value={filters.date_from ?? ''}
                        onChange={(e) => handleFilter('date_from', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">To Date</Label>
                      <Input
                        type="date"
                        value={filters.date_to ?? ''}
                        onChange={(e) => handleFilter('date_to', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* SLA Breached */}
                  <div className="space-y-2">
                    <Label className="text-xs">SLA Status</Label>
                    <Select
                      value={(filters.sla_breached as string) ?? '__all'}
                      onValueChange={(value) => handleFilter('sla_breached', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All SLA statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">All</SelectItem>
                        <SelectItem value="response">Response SLA Breached</SelectItem>
                        <SelectItem value="resolution">Resolution SLA Breached</SelectItem>
                        <SelectItem value="any">Any SLA Breached</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Approval Status */}
                  <div className="space-y-2">
                    <Label className="text-xs">Approval Status</Label>
                    <Select
                      value={(filters.approval_status as string) ?? '__all'}
                      onValueChange={(value) => handleFilter('approval_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All approval statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">All</SelectItem>
                        <SelectItem value="pending">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="none">No Approval Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                      {options.tags.map((tag) => {
                        const isSelected = filters.tags?.includes(String(tag.id));
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              const currentTags = Array.isArray(filters.tags)
                                ? filters.tags
                                : filters.tags
                                  ? [String(filters.tags)]
                                  : [];
                              const newTags = isSelected
                                ? currentTags.filter((t) => t !== String(tag.id))
                                : [...currentTags, String(tag.id)];
                              handleFilter('tags', newTags.length > 0 ? newTags : undefined);
                            }}
                            className={`px-2 py-1 rounded text-xs transition ${
                              isSelected ? 'ring-2 ring-offset-1' : 'opacity-70'
                            }`}
                            style={{
                              backgroundColor: tag.color || '#gray',
                              color: '#fff',
                            }}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === '__all') return null;
            if (Array.isArray(value) && value.length === 0) return null;
            // Exclude sort fields from display
            if (key === 'order_by' || key === 'order_dir') return null;

            let label = key;
            let displayValue = String(value);

            // Format display value
            if (key === 'status') {
              if (Array.isArray(value)) {
                displayValue = value.map((s: string) => String(s).replace('_', ' ')).join(', ');
              } else {
                displayValue = String(value).replace('_', ' ');
              }
            } else if (key === 'priority') {
              if (Array.isArray(value)) {
                displayValue = value.map((p: string) => String(p).charAt(0).toUpperCase() + String(p).slice(1)).join(', ');
              } else {
                displayValue = String(value).charAt(0).toUpperCase() + String(value).slice(1);
              }
            } else if (key === 'agent') {
              if (value === '__none') {
                displayValue = 'Unassigned';
              } else {
                const agent = options.agents.find((a) => a.id === Number(value));
                displayValue = agent?.name || value;
              }
            } else if (key === 'team') {
              const team = options.teams.find((t) => t.id === Number(value));
              displayValue = team?.name || value;
            } else if (key === 'category') {
              const category = options.categories.find((c) => c.id === Number(value));
              displayValue = category?.name || value;
            } else if (key === 'project') {
              const project = options.projects.find((p) => p.id === Number(value));
              displayValue = project?.name || value;
            } else if (key === 'tags' && Array.isArray(value)) {
              displayValue = value
                .map((tagId) => {
                  const tag = options.tags.find((t) => t.id === Number(tagId));
                  return tag?.name;
                })
                .filter(Boolean)
                .join(', ');
            } else if (key === 'approval_status') {
              const statusMap: Record<string, string> = {
                pending: 'Pending Approval',
                approved: 'Approved',
                rejected: 'Rejected',
                none: 'No Approval Required',
              };
              displayValue = statusMap[String(value)] || String(value);
            }

            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span className="text-xs capitalize">{label.replace('_', ' ')}:</span>
                <span className="text-xs">{displayValue}</span>
                <button
                  type="button"
                  onClick={() => {
                    // Clear the filter - handle arrays properly
                    if (Array.isArray(filters[key])) {
                      handleFilter(key, undefined);
                    } else {
                      handleFilter(key, '');
                    }
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

