<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'status', 'project_manager_id', 'is_active']);

        $projects = Project::query()
            ->with(['manager:id,name'])
            ->withCount('tickets')
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('code', 'like', "%{$q}%")
                        ->orWhere('location', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['status']), function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->when(isset($filters['project_manager_id']), function ($query) use ($filters) {
                $query->where('project_manager_id', $filters['project_manager_id']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($project) => [
                'id' => $project->id,
                'name' => $project->name,
                'code' => $project->code,
                'description' => $project->description,
                'location' => $project->location,
                'project_manager' => $project->manager ? [
                    'id' => $project->manager->id,
                    'name' => $project->manager->name,
                ] : null,
                'status' => $project->status,
                'start_date' => $project->start_date?->toDateString(),
                'end_date' => $project->end_date?->toDateString(),
                'is_active' => $project->is_active,
                'tickets_count' => $project->tickets_count,
                'created_at' => $project->created_at->toDateTimeString(),
            ]);

        $projectManagers = User::whereHas('managedProjects')
            ->orWhere('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects,
            'filters' => $filters,
            'projectManagers' => $projectManagers,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Projects/Form', [
            'project' => null,
            'projectManagers' => User::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(ProjectRequest $request): RedirectResponse
    {
        Project::create($request->validated());

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    public function show(Project $project): Response
    {
        $project->load(['manager:id,name,email', 'tickets' => function ($query) {
            $query->latest()->take(10);
        }]);

        return Inertia::render('Admin/Projects/Show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'code' => $project->code,
                'description' => $project->description,
                'location' => $project->location,
                'project_manager' => $project->manager ? [
                    'id' => $project->manager->id,
                    'name' => $project->manager->name,
                    'email' => $project->manager->email,
                ] : null,
                'status' => $project->status,
                'start_date' => $project->start_date?->toDateString(),
                'end_date' => $project->end_date?->toDateString(),
                'is_active' => $project->is_active,
                'tickets_count' => $project->tickets()->count(),
                'recent_tickets' => $project->tickets->map(fn ($ticket) => [
                    'id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at->toDateTimeString(),
                ]),
                'created_at' => $project->created_at->toDateTimeString(),
            ],
        ]);
    }

    public function edit(Project $project): Response
    {
        return Inertia::render('Admin/Projects/Form', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'code' => $project->code,
                'description' => $project->description,
                'location' => $project->location,
                'project_manager_id' => $project->project_manager_id ? $project->project_manager_id : '__none',
                'status' => $project->status,
                'start_date' => $project->start_date?->toDateString(),
                'end_date' => $project->end_date?->toDateString(),
                'is_active' => $project->is_active,
            ],
            'projectManagers' => User::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(ProjectRequest $request, Project $project): RedirectResponse
    {
        $data = $request->validated();
        
        // Handle project_manager_id conversion
        if (isset($data['project_manager_id']) && $data['project_manager_id'] === '__none') {
            $data['project_manager_id'] = null;
        } elseif (isset($data['project_manager_id'])) {
            $data['project_manager_id'] = (int) $data['project_manager_id'];
        }

        $project->update($data);

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        // Check if project has tickets
        if ($project->tickets()->count() > 0) {
            return redirect()
                ->route('admin.projects.index')
                ->with('error', 'Cannot delete project with assigned tickets.');
        }

        $project->delete();

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project deleted successfully.');
    }
}
