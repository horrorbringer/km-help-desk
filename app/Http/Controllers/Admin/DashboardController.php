<?php

namespace App\Http\Controllers\Admin;

use App\Constants\RoleConstants;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $period = $request->get('period', '7d'); // 7d, 30d, 90d, all
        $dateRange = $this->getDateRange($period);

        $stats = [
            'overview' => $this->getOverviewStats($dateRange, $user),
            'status_breakdown' => $this->getStatusBreakdown($user),
            'priority_breakdown' => $this->getPriorityBreakdown($user),
            'sla_compliance' => $this->getSlaCompliance($dateRange, $user),
            'team_performance' => $this->getTeamPerformance($dateRange, $user),
            'category_distribution' => $this->getCategoryDistribution($dateRange, $user),
            'recent_tickets' => $this->getRecentTickets($user),
            'agent_workload' => $this->getAgentWorkload($user),
            'ticket_trends' => $this->getTicketTrends($dateRange, $user),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'period' => $period,
        ]);
    }

    protected function getDateRange(string $period): array
    {
        return match ($period) {
            '7d' => [Carbon::now()->subDays(7), Carbon::now()],
            '30d' => [Carbon::now()->subDays(30), Carbon::now()],
            '90d' => [Carbon::now()->subDays(90), Carbon::now()],
            'all' => [null, null],
            default => [Carbon::now()->subDays(7), Carbon::now()],
        };
    }

    protected function visibleTicketQuery(User $user): Builder
    {
        $query = Ticket::query();

        if (! $user->can('tickets.assign')) {
            $query->where(function (Builder $q) use ($user) {
                $q->where('requester_id', $user->id)
                    ->orWhere('assigned_agent_id', $user->id)
                    ->orWhereHas('watchers', function (Builder $watcherQuery) use ($user) {
                        $watcherQuery->where('users.id', $user->id);
                    })
                    ->orWhereHas('approvals', function (Builder $approvalQuery) use ($user) {
                        $approvalQuery->where('approver_id', $user->id);
                    });

                if ($user->department_id && $user->hasAnyRole(array_merge(RoleConstants::getAgentRoles(), [RoleConstants::MANAGER]))) {
                    $q->orWhere('assigned_team_id', $user->department_id);
                }
            });

            $query->where(function (Builder $q) use ($user) {
                $q->whereDoesntHave('approvals', function (Builder $approvalQuery) {
                    $approvalQuery->where('status', 'pending');
                })
                    ->orWhere('requester_id', $user->id)
                    ->orWhereHas('approvals', function (Builder $approvalQuery) use ($user) {
                        $approvalQuery->where('status', 'pending')
                            ->where('approver_id', $user->id);
                    });
            });
        }

        return $query;
    }

    protected function getOverviewStats(array $dateRange, User $user): array
    {
        [$start, $end] = $dateRange;

        $query = $this->visibleTicketQuery($user);
        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $total = (clone $query)->count();
        $open = (clone $query)->whereIn('status', ['open', 'assigned', 'in_progress', 'pending'])->count();
        $resolved = (clone $query)->where('status', 'resolved')->count();
        $closed = (clone $query)->where('status', 'closed')->count();
        $cancelled = (clone $query)->where('status', 'cancelled')->count();

        $avgResolutionTime = (clone $query)
            ->whereNotNull('resolved_at')
            ->whereNotNull('created_at')
            ->get()
            ->map(fn ($ticket) => $ticket->created_at->diffInHours($ticket->resolved_at))
            ->average();

        return [
            'total' => $total,
            'open' => $open,
            'resolved' => $resolved,
            'closed' => $closed,
            'cancelled' => $cancelled,
            'avg_resolution_hours' => round($avgResolutionTime ?? 0, 1),
            'resolution_rate' => $total > 0 ? round(($resolved + $closed) / $total * 100, 1) : 0,
        ];
    }

    protected function getStatusBreakdown(User $user): array
    {
        return $this->visibleTicketQuery($user)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    protected function getPriorityBreakdown(User $user): array
    {
        return $this->visibleTicketQuery($user)
            ->selectRaw('priority, COUNT(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority')
            ->toArray();
    }

    protected function getSlaCompliance(array $dateRange, User $user): array
    {
        [$start, $end] = $dateRange;

        $query = $this->visibleTicketQuery($user)->whereNotNull('sla_policy_id');
        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $total = (clone $query)->count();
        $responseBreached = (clone $query)->where('response_sla_breached', true)->count();
        $resolutionBreached = (clone $query)->where('resolution_sla_breached', true)->count();

        return [
            'total_with_sla' => $total,
            'response_breached' => $responseBreached,
            'resolution_breached' => $resolutionBreached,
            'response_compliance_rate' => $total > 0 ? round(($total - $responseBreached) / $total * 100, 1) : 0,
            'resolution_compliance_rate' => $total > 0 ? round(($total - $resolutionBreached) / $total * 100, 1) : 0,
        ];
    }

    protected function getTeamPerformance(array $dateRange, User $user): array
    {
        [$start, $end] = $dateRange;

        $query = $this->visibleTicketQuery($user)
            ->selectRaw('assigned_team_id, COUNT(*) as total, 
                SUM(CASE WHEN status = "resolved" OR status = "closed" THEN 1 ELSE 0 END) as resolved')
            ->whereNotNull('assigned_team_id')
            ->groupBy('assigned_team_id');

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $teams = Department::whereIn('id', $query->pluck('assigned_team_id'))
            ->pluck('name', 'id');

        return $query->get()->map(function ($ticket) use ($teams) {
            return [
                'team_id' => $ticket->assigned_team_id,
                'team_name' => $teams[$ticket->assigned_team_id] ?? 'Unknown',
                'total_tickets' => $ticket->total,
                'resolved_tickets' => $ticket->resolved,
                'resolution_rate' => $ticket->total > 0 ? round($ticket->resolved / $ticket->total * 100, 1) : 0,
            ];
        })->toArray();
    }

    protected function getCategoryDistribution(array $dateRange, User $user): array
    {
        [$start, $end] = $dateRange;

        $query = $this->visibleTicketQuery($user)
            ->selectRaw('category_id, COUNT(*) as count')
            ->whereNotNull('category_id')
            ->groupBy('category_id');

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $categories = \App\Models\TicketCategory::whereIn('id', $query->pluck('category_id'))
            ->pluck('name', 'id');

        return $query->get()->map(function ($ticket) use ($categories) {
            return [
                'category_id' => $ticket->category_id,
                'category_name' => $categories[$ticket->category_id] ?? 'Unknown',
                'count' => $ticket->count,
            ];
        })->sortByDesc('count')->take(10)->values()->toArray();
    }

    protected function getRecentTickets(User $user): array
    {
        return $this->visibleTicketQuery($user)
            ->with(['requester:id,name', 'assignedTeam:id,name', 'category:id,name'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($ticket) => [
                'id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'subject' => $ticket->subject,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'requester' => $ticket->requester?->name,
                'team' => $ticket->assignedTeam?->name,
                'category' => $ticket->category?->name,
                'created_at' => $ticket->created_at->toDateTimeString(),
            ])
            ->toArray();
    }

    protected function getAgentWorkload(User $user): array
    {
        $visibleTicketIds = $this->visibleTicketQuery($user)->select('id');

        return User::whereHas('assignedTickets', function (Builder $query) use ($visibleTicketIds) {
            $query->whereIn('id', clone $visibleTicketIds);
        })
            ->withCount(['assignedTickets as open_tickets' => function ($query) use ($visibleTicketIds) {
                $query
                    ->whereIn('id', clone $visibleTicketIds)
                    ->whereIn('status', ['open', 'assigned', 'in_progress', 'pending']);
            }])
            ->withCount(['assignedTickets as total_tickets' => function ($query) use ($visibleTicketIds) {
                $query->whereIn('id', clone $visibleTicketIds);
            }])
            ->orderByDesc('open_tickets')
            ->take(10)
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'open_tickets' => $user->open_tickets,
                'total_tickets' => $user->total_tickets,
            ])
            ->toArray();
    }

    protected function getTicketTrends(array $dateRange, User $user): array
    {
        [$start, $end] = $dateRange;

        if (! $start || ! $end) {
            $start = Carbon::now()->subDays(30);
            $end = Carbon::now();
        }

        $days = $start->diffInDays($end);
        $interval = $days <= 7 ? 'day' : ($days <= 30 ? 'day' : 'week');

        $query = $this->visibleTicketQuery($user)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('date')
            ->orderBy('date');

        $data = $query->pluck('count', 'date')->toArray();

        // Fill in missing dates with 0
        $current = $start->copy();
        $trends = [];
        while ($current <= $end) {
            $dateKey = $current->format('Y-m-d');
            $trends[] = [
                'date' => $dateKey,
                'count' => $data[$dateKey] ?? 0,
            ];
            $current->addDay();
        }

        return $trends;
    }
}
