<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Reports/Index', [
            'reportTypes' => [
                [
                    'id' => 'tickets',
                    'name' => 'Ticket Reports',
                    'description' => 'Detailed ticket analysis and statistics',
                    'icon' => 'ticket',
                ],
                [
                    'id' => 'agents',
                    'name' => 'Agent Performance',
                    'description' => 'Individual agent workload and performance metrics',
                    'icon' => 'users',
                ],
                [
                    'id' => 'teams',
                    'name' => 'Team Performance',
                    'description' => 'Department and team statistics',
                    'icon' => 'folder',
                ],
                [
                    'id' => 'sla',
                    'name' => 'SLA Compliance',
                    'description' => 'Service level agreement compliance reports',
                    'icon' => 'report',
                ],
                [
                    'id' => 'categories',
                    'name' => 'Category Analysis',
                    'description' => 'Ticket distribution by category',
                    'icon' => 'file-description',
                ],
                [
                    'id' => 'projects',
                    'name' => 'Project Reports',
                    'description' => 'Project-related ticket statistics',
                    'icon' => 'folder',
                ],
            ],
        ]);
    }

    public function tickets(Request $request): Response
    {
        $filters = $request->only([
            'date_from',
            'date_to',
            'status',
            'priority',
            'team',
            'agent',
            'category',
            'project',
        ]);

        $query = Ticket::query()
            ->with(['requester:id,name', 'assignedTeam:id,name', 'assignedAgent:id,name', 'category:id,name', 'project:id,name']);

        // Apply filters
        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (isset($filters['team'])) {
            $query->where('assigned_team_id', $filters['team']);
        }
        if (isset($filters['agent'])) {
            $query->where('assigned_agent_id', $filters['agent']);
        }
        if (isset($filters['category'])) {
            $query->where('category_id', $filters['category']);
        }
        if (isset($filters['project'])) {
            $query->where('project_id', $filters['project']);
        }

        $tickets = $query->latest()->paginate(50)->withQueryString();

        // Summary statistics
        $summary = [
            'total' => Ticket::when(isset($filters['date_from']), fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                ->when(isset($filters['date_to']), fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
                ->count(),
            'by_status' => Ticket::when(isset($filters['date_from']), fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                ->when(isset($filters['date_to']), fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
                ->groupBy('status')
                ->selectRaw('status, count(*) as count')
                ->pluck('count', 'status'),
            'by_priority' => Ticket::when(isset($filters['date_from']), fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                ->when(isset($filters['date_to']), fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
                ->groupBy('priority')
                ->selectRaw('priority, count(*) as count')
                ->pluck('count', 'priority'),
        ];

        return Inertia::render('Admin/Reports/Tickets', [
            'tickets' => $tickets,
            'filters' => $filters,
            'summary' => $summary,
            'filterOptions' => $this->getFilterOptions(),
        ]);
    }

    public function agents(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to']);

        $agents = User::whereHas('assignedTickets')
            ->withCount([
                'assignedTickets as total_tickets' => function ($query) use ($filters) {
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
                'assignedTickets as resolved_tickets' => function ($query) use ($filters) {
                    $query->where('status', 'resolved');
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
                'assignedTickets as open_tickets' => function ($query) use ($filters) {
                    $query->whereIn('status', ['open', 'assigned', 'in_progress']);
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
            ])
            ->orderBy('total_tickets', 'desc')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Reports/Agents', [
            'agents' => $agents,
            'filters' => $filters,
        ]);
    }

    public function teams(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to']);

        $teams = Department::where('is_support_team', true)
            ->withCount([
                'tickets as total_tickets' => function ($query) use ($filters) {
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
                'tickets as resolved_tickets' => function ($query) use ($filters) {
                    $query->where('status', 'resolved');
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
            ])
            ->orderBy('total_tickets', 'desc')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Reports/Teams', [
            'teams' => $teams,
            'filters' => $filters,
        ]);
    }

    public function sla(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to']);

        $slaStats = DB::table('tickets')
            ->join('sla_policies', 'tickets.sla_policy_id', '=', 'sla_policies.id')
            ->when(isset($filters['date_from']), fn($q) => $q->whereDate('tickets.created_at', '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn($q) => $q->whereDate('tickets.created_at', '<=', $filters['date_to']))
            ->select(
                'sla_policies.id',
                'sla_policies.name',
                'sla_policies.priority',
                DB::raw('COUNT(tickets.id) as total_tickets'),
                DB::raw('SUM(CASE WHEN tickets.first_response_breached = 1 THEN 1 ELSE 0 END) as response_breaches'),
                DB::raw('SUM(CASE WHEN tickets.resolution_breached = 1 THEN 1 ELSE 0 END) as resolution_breaches')
            )
            ->groupBy('sla_policies.id', 'sla_policies.name', 'sla_policies.priority')
            ->get()
            ->map(function ($stat) {
                $total = $stat->total_tickets;
                $responseCompliance = $total > 0 
                    ? round((($total - $stat->response_breaches) / $total) * 100, 2)
                    : 100;
                $resolutionCompliance = $total > 0
                    ? round((($total - $stat->resolution_breaches) / $total) * 100, 2)
                    : 100;

                return [
                    'id' => $stat->id,
                    'name' => $stat->name,
                    'priority' => $stat->priority,
                    'total_tickets' => $total,
                    'response_breaches' => $stat->response_breaches,
                    'resolution_breaches' => $stat->resolution_breaches,
                    'response_compliance' => $responseCompliance,
                    'resolution_compliance' => $resolutionCompliance,
                ];
            });

        return Inertia::render('Admin/Reports/Sla', [
            'slaStats' => $slaStats,
            'filters' => $filters,
        ]);
    }

    public function categories(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to']);

        $categoryStats = TicketCategory::where('is_active', true)
            ->withCount([
                'tickets as total_tickets' => function ($query) use ($filters) {
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
                'tickets as resolved_tickets' => function ($query) use ($filters) {
                    $query->where('status', 'resolved');
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
            ])
            ->orderBy('total_tickets', 'desc')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Reports/Categories', [
            'categories' => $categoryStats,
            'filters' => $filters,
        ]);
    }

    public function projects(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to']);

        $projectStats = Project::where('is_active', true)
            ->withCount([
                'tickets as total_tickets' => function ($query) use ($filters) {
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
                'tickets as resolved_tickets' => function ($query) use ($filters) {
                    $query->where('status', 'resolved');
                    if (isset($filters['date_from'])) {
                        $query->whereDate('created_at', '>=', $filters['date_from']);
                    }
                    if (isset($filters['date_to'])) {
                        $query->whereDate('created_at', '<=', $filters['date_to']);
                    }
                },
            ])
            ->orderBy('total_tickets', 'desc')
            ->get(['id', 'name', 'code', 'status']);

        return Inertia::render('Admin/Reports/Projects', [
            'projects' => $projectStats,
            'filters' => $filters,
        ]);
    }

    protected function getFilterOptions(): array
    {
        return [
            'statuses' => Ticket::STATUSES,
            'priorities' => Ticket::PRIORITIES,
            'teams' => Department::where('is_support_team', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'agents' => User::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'categories' => TicketCategory::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'projects' => Project::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }
}

