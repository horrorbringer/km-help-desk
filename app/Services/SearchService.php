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
     */
    public function searchTickets(array $filters, int $perPage = 15): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        // Create cache key from filters
        $cacheKey = 'ticket_search_' . md5(json_encode($filters) . $perPage);
        
        // Cache for 1 minute for better real-time feel
        return Cache::remember($cacheKey, 60, function () use ($filters, $perPage) {
            $query = Ticket::query()
                ->with([
                    'requester:id,name,email',
                    'assignedTeam:id,name',
                    'assignedAgent:id,name',
                    'category:id,name',
                    'project:id,name,code',
                    'slaPolicy:id,name',
                    'tags:id,name,color',
                ])
                ->select('tickets.*');

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

            // Optimized agent filter
            if (!empty($filters['agent'])) {
                $query->where('assigned_agent_id', $filters['agent']);
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

            // Optimized ordering
            $query->orderBy('created_at', 'desc');

            return $query->paginate($perPage);
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

