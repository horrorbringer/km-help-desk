<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TimeEntry;
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
                // [
                //     'id' => 'time-entries',
                //     'name' => 'Time Entries & Billing',
                //     'description' => 'Time tracking and billing reports',
                //     'icon' => 'clock',
                // ],
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
            'total' => Ticket::when(isset($filters['date_from']), fn ($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                ->when(isset($filters['date_to']), fn ($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
                ->count(),
            'by_status' => Ticket::when(isset($filters['date_from']), fn ($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                ->when(isset($filters['date_to']), fn ($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
                ->groupBy('status')
                ->selectRaw('status, count(*) as count')
                ->pluck('count', 'status'),
            'by_priority' => Ticket::when(isset($filters['date_from']), fn ($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                ->when(isset($filters['date_to']), fn ($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
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
            ->when(isset($filters['date_from']), fn ($q) => $q->whereDate('tickets.created_at', '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn ($q) => $q->whereDate('tickets.created_at', '<=', $filters['date_to']))
            ->select(
                'sla_policies.id',
                'sla_policies.name',
                'sla_policies.priority',
                DB::raw('COUNT(tickets.id) as total_tickets'),
                DB::raw('SUM(CASE WHEN tickets.response_sla_breached = 1 THEN 1 ELSE 0 END) as response_breaches'),
                DB::raw('SUM(CASE WHEN tickets.resolution_sla_breached = 1 THEN 1 ELSE 0 END) as resolution_breaches')
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

    public function timeEntries(Request $request): Response
    {
        $filters = $request->only([
            'date_from',
            'date_to',
            'user_id',
            'ticket_id',
            'activity_type',
            'is_billable',
            'is_approved',
            'project_id',
        ]);

        $query = TimeEntry::query()
            ->with(['ticket:id,ticket_number,subject,project_id', 'user:id,name,email', 'ticket.project:id,name']);

        // Apply filters
        if (isset($filters['date_from'])) {
            $query->whereDate('date', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->whereDate('date', '<=', $filters['date_to']);
        }
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        if (isset($filters['ticket_id'])) {
            $query->where('ticket_id', $filters['ticket_id']);
        }
        if (isset($filters['activity_type'])) {
            $query->where('activity_type', $filters['activity_type']);
        }
        if (isset($filters['is_billable'])) {
            $query->where('is_billable', $filters['is_billable'] === '1');
        }
        if (isset($filters['is_approved'])) {
            $query->where('is_approved', $filters['is_approved'] === '1');
        }
        if (isset($filters['project_id'])) {
            $query->whereHas('ticket', function ($q) use ($filters) {
                $q->where('project_id', $filters['project_id']);
            });
        }

        $timeEntries = $query->latest('date')
            ->latest('created_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn ($entry) => [
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'duration_minutes' => $entry->duration_minutes,
                'formatted_duration' => $entry->formatted_duration,
                'activity_type' => $entry->activity_type,
                'description' => $entry->description,
                'is_billable' => $entry->is_billable,
                'hourly_rate' => $entry->hourly_rate,
                'amount' => $entry->amount,
                'is_approved' => $entry->is_approved,
                'ticket' => $entry->ticket ? [
                    'id' => $entry->ticket->id,
                    'ticket_number' => $entry->ticket->ticket_number,
                    'subject' => $entry->ticket->subject,
                    'project' => $entry->ticket->project ? [
                        'id' => $entry->ticket->project->id,
                        'name' => $entry->ticket->project->name,
                    ] : null,
                ] : null,
                'user' => $entry->user ? [
                    'id' => $entry->user->id,
                    'name' => $entry->user->name,
                    'email' => $entry->user->email,
                ] : null,
            ]);

        // Summary statistics
        $baseQuery = TimeEntry::query()
            ->when(isset($filters['date_from']), fn ($q) => $q->whereDate('date', '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn ($q) => $q->whereDate('date', '<=', $filters['date_to']))
            ->when(isset($filters['user_id']), fn ($q) => $q->where('user_id', $filters['user_id']))
            ->when(isset($filters['ticket_id']), fn ($q) => $q->where('ticket_id', $filters['ticket_id']))
            ->when(isset($filters['activity_type']), fn ($q) => $q->where('activity_type', $filters['activity_type']))
            ->when(isset($filters['is_billable']), fn ($q) => $q->where('is_billable', $filters['is_billable'] === '1'))
            ->when(isset($filters['is_approved']), fn ($q) => $q->where('is_approved', $filters['is_approved'] === '1'))
            ->when(isset($filters['project_id']), fn ($q) => $q->whereHas('ticket', function ($tq) use ($filters) {
                $tq->where('project_id', $filters['project_id']);
            }));

        $summary = [
            'total_entries' => (clone $baseQuery)->count(),
            'total_minutes' => (clone $baseQuery)->sum('duration_minutes'),
            'total_hours' => round((clone $baseQuery)->sum('duration_minutes') / 60, 2),
            'billable_minutes' => (clone $baseQuery)->where('is_billable', true)->sum('duration_minutes'),
            'billable_hours' => round((clone $baseQuery)->where('is_billable', true)->sum('duration_minutes') / 60, 2),
            'total_amount' => (clone $baseQuery)->sum('amount') ?? 0,
            'billable_amount' => (clone $baseQuery)->where('is_billable', true)->sum('amount') ?? 0,
            'approved_amount' => (clone $baseQuery)->where('is_approved', true)->sum('amount') ?? 0,
            'by_activity' => (clone $baseQuery)
                ->whereNotNull('activity_type')
                ->groupBy('activity_type')
                ->selectRaw('activity_type, SUM(duration_minutes) as total_minutes, SUM(amount) as total_amount')
                ->get()
                ->mapWithKeys(fn ($item) => [
                    $item->activity_type => [
                        'minutes' => $item->total_minutes,
                        'hours' => round($item->total_minutes / 60, 2),
                        'amount' => $item->total_amount ?? 0,
                    ],
                ]),
            'by_user' => User::whereIn('id', (clone $baseQuery)->distinct()->pluck('user_id'))
                ->get(['id', 'name'])
                ->map(function ($user) use ($baseQuery) {
                    $userEntries = (clone $baseQuery)->where('user_id', $user->id);

                    return [
                        'user' => ['id' => $user->id, 'name' => $user->name],
                        'minutes' => $userEntries->sum('duration_minutes'),
                        'hours' => round($userEntries->sum('duration_minutes') / 60, 2),
                        'amount' => $userEntries->sum('amount') ?? 0,
                    ];
                })
                ->sortByDesc('minutes')
                ->take(10)
                ->values(),
        ];

        return Inertia::render('Admin/Reports/TimeEntries', [
            'timeEntries' => $timeEntries,
            'filters' => $filters,
            'summary' => $summary,
            'filterOptions' => [
                'users' => User::where('is_active', true)->orderBy('name')->get(['id', 'name']),
                'activity_types' => TimeEntry::ACTIVITY_TYPES,
                'projects' => Project::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            ],
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
