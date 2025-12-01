<?php

namespace App\Services;

use App\Models\Ticket;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SearchService
{
    /**
     * Optimized ticket search with caching
     * Applies visibility filters based on user role and permissions
     */
    public function searchTickets(array $filters, int $perPage = 15, ?\App\Models\User $user = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $user = $user ?? \Illuminate\Support\Facades\Auth::user();
        
        // Create cache key from filters and user ID for proper visibility caching
        $cacheKey = 'ticket_search_' . md5(json_encode($filters) . $perPage . ($user ? $user->id : 'guest'));
        
        // Cache for 1 minute for better real-time feel
        return Cache::remember($cacheKey, 60, function () use ($filters, $perPage, $user) {
            $query = Ticket::query()
                ->with([
                    'requester:id,name,email',
                    'assignedTeam:id,name',
                    'assignedAgent:id,name',
                    'category:id,name',
                    'project:id,name,code',
                    'slaPolicy:id,name',
                    'tags:id,name,color',
                    'approvals' => function ($q) {
                        $q->whereIn('status', ['pending', 'rejected'])
                            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
                            ->orderBy('rejected_at', 'desc')
                            ->limit(2)
                            ->with('approver:id,name');
                    },
                ])
                ->select('tickets.*');
            
            // Apply visibility filters based on user role and permissions
            if ($user) {
                $this->applyVisibilityFilters($query, $user);
            }

            // Optimized full-text search
            if (!empty($filters['q'])) {
                $searchTerm = $filters['q'];
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('ticket_number', 'like', "%{$searchTerm}%")
                        ->orWhere('subject', 'like', "%{$searchTerm}%")
                        ->orWhere('description', 'like', "%{$searchTerm}%")
                        ->orWhereHas('requester', function ($reqQuery) use ($searchTerm) {
                            $reqQuery->where('name', 'like', "%{$searchTerm}%")
                                ->orWhere('email', 'like', "%{$searchTerm}%");
                        });
                });
            }

            // Optimized status filter
            if (!empty($filters['status'])) {
                if (is_array($filters['status'])) {
                    $query->whereIn('status', $filters['status']);
                } else {
                    $query->where('status', $filters['status']);
                }
            }

            // Optimized priority filter
            if (!empty($filters['priority'])) {
                if (is_array($filters['priority'])) {
                    $query->whereIn('priority', $filters['priority']);
                } else {
                    $query->where('priority', $filters['priority']);
                }
            }

            // Optimized team filter
            if (!empty($filters['team'])) {
                $query->where('assigned_team_id', $filters['team']);
            }

            // Optimized agent filter (supports __none for unassigned)
            if (isset($filters['agent'])) {
                if ($filters['agent'] === '__none') {
                    $query->whereNull('assigned_agent_id');
                } elseif (!empty($filters['agent'])) {
                    $query->where('assigned_agent_id', $filters['agent']);
                }
            }

            // Optimized category filter
            if (!empty($filters['category'])) {
                $query->where('category_id', $filters['category']);
            }

            // Optimized project filter
            if (!empty($filters['project'])) {
                $query->where('project_id', $filters['project']);
            }

            // Optimized requester filter
            if (!empty($filters['requester'])) {
                $query->where('requester_id', $filters['requester']);
            }

            // Date range filters
            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            // SLA breach filter
            if (isset($filters['sla_breached'])) {
                $query->where(function ($q) use ($filters) {
                    if ($filters['sla_breached'] === 'response') {
                        $q->where('response_sla_breached', true);
                    } elseif ($filters['sla_breached'] === 'resolution') {
                        $q->where('resolution_sla_breached', true);
                    } elseif ($filters['sla_breached'] === 'any') {
                        $q->where(function ($sq) {
                            $sq->where('response_sla_breached', true)
                                ->orWhere('resolution_sla_breached', true);
                        });
                    }
                });
            }

            // Tag filter
            if (!empty($filters['tags'])) {
                $tagIds = is_array($filters['tags']) ? $filters['tags'] : [$filters['tags']];
                $query->whereHas('tags', function ($tagQuery) use ($tagIds) {
                    $tagQuery->whereIn('tags.id', $tagIds);
                });
            }

            // Approval status filter
            if (isset($filters['approval_status'])) {
                if ($filters['approval_status'] === 'pending') {
                    $query->whereHas('approvals', function ($approvalQuery) {
                        $approvalQuery->where('status', 'pending');
                    });
                } elseif ($filters['approval_status'] === 'approved') {
                    $query->whereHas('approvals', function ($approvalQuery) {
                        $approvalQuery->where('status', 'approved');
                    })->whereDoesntHave('approvals', function ($approvalQuery) {
                        $approvalQuery->where('status', 'pending');
                    });
                } elseif ($filters['approval_status'] === 'rejected') {
                    $query->whereHas('approvals', function ($approvalQuery) {
                        $approvalQuery->where('status', 'rejected');
                    });
                } elseif ($filters['approval_status'] === 'none') {
                    $query->whereDoesntHave('approvals');
                }
            }
            
            // Note: Rejected tickets (status: cancelled) remain visible in the main list
            // They can be filtered using approval_status='rejected' or status='cancelled'
            // Visibility is controlled at the controller level based on user permissions

            // Ordering
            $orderBy = $filters['order_by'] ?? 'created_at';
            $orderDir = $filters['order_dir'] ?? 'desc';
            
            // Validate order_by field
            $allowedOrderFields = ['created_at', 'updated_at', 'status', 'priority', 'ticket_number', 'subject'];
            if (!in_array($orderBy, $allowedOrderFields)) {
                $orderBy = 'created_at';
            }
            
            // Validate order direction
            $orderDir = strtolower($orderDir) === 'asc' ? 'asc' : 'desc';
            
            $query->orderBy($orderBy, $orderDir);

            return $query->paginate($perPage);
        });
    }
    
    /**
     * Apply visibility filters based on user role and permissions
     * 
     * Visibility Rules:
     * - Admin/Manager with tickets.assign: See ALL tickets
     * - Manager without tickets.assign: See tickets in their department
     * - Agent: See tickets assigned to them or their team (NO tickets.assign permission)
     * - Requester: See tickets they created or are watching
     */
    protected function applyVisibilityFilters($query, \App\Models\User $user): void
    {
        // Admins and Managers with assign permission can see all tickets
        // Note: Agents should NOT have tickets.assign permission
        if ($user->can('tickets.assign')) {
            // No filter needed - see all tickets
            return;
        }
        
        // Apply role-based visibility filters
        $query->where(function ($q) use ($user) {
            // 1. Tickets created by the user (requester)
            $q->where('requester_id', $user->id);
            
            // 2. Tickets assigned to the user (agent)
            $q->orWhere('assigned_agent_id', $user->id);
            
            // 3. Tickets assigned to user's team/department
            if ($user->department_id) {
                $q->orWhere('assigned_team_id', $user->department_id);
            }
            
            // 4. Tickets the user is watching
            $q->orWhereHas('watchers', function ($watcherQuery) use ($user) {
                $watcherQuery->where('users.id', $user->id);
            });
            
            // 5. For managers: tickets in their department (even if not assigned)
            // Check if user has Manager role using Spatie's HasRoles trait
            if ($user->hasRole('Manager')) {
                if ($user->department_id) {
                    $q->orWhereHas('assignedTeam', function ($teamQuery) use ($user) {
                        $teamQuery->where('id', $user->department_id);
                    });
                }
            }
        });
    }

    /**
     * Clear search cache
     */
    public function clearCache(): void
    {
        // Clear all ticket search caches
        Cache::flush(); // Or use a more specific cache tag system
    }

    /**
     * Get search suggestions based on query
     */
    public function getSuggestions(string $query, int $limit = 5): array
    {
        $suggestions = [];

        // Ticket number suggestions
        $ticketNumbers = Ticket::where('ticket_number', 'like', "%{$query}%")
            ->limit($limit)
            ->pluck('ticket_number')
            ->toArray();
        $suggestions['tickets'] = $ticketNumbers;

        // Subject suggestions
        $subjects = Ticket::where('subject', 'like', "%{$query}%")
            ->distinct()
            ->limit($limit)
            ->pluck('subject')
            ->toArray();
        $suggestions['subjects'] = $subjects;

        return $suggestions;
    }
}

