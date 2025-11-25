<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartmentRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'is_support_team', 'is_active']);

        $departments = Department::query()
            ->withCount(['users', 'tickets'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('code', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['is_support_team']), function ($query) use ($filters) {
                $query->where('is_support_team', $filters['is_support_team'] === '1');
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($department) => [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'is_support_team' => $department->is_support_team,
                'is_active' => $department->is_active,
                'description' => $department->description,
                'users_count' => $department->users_count,
                'tickets_count' => $department->tickets_count,
                'created_at' => $department->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $departments,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Departments/Form', [
            'department' => null,
        ]);
    }

    public function store(DepartmentRequest $request): RedirectResponse
    {
        Department::create($request->validated());

        return redirect()
            ->route('admin.departments.index')
            ->with('success', 'Department created successfully.');
    }

    public function show(Department $department): Response
    {
        $department->load(['users', 'tickets' => function ($query) {
            $query->latest()->take(10);
        }]);

        return Inertia::render('Admin/Departments/Show', [
            'department' => [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'is_support_team' => $department->is_support_team,
                'is_active' => $department->is_active,
                'description' => $department->description,
                'users' => $department->users->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                ]),
                'recent_tickets' => $department->tickets->map(fn ($ticket) => [
                    'id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at->toDateTimeString(),
                ]),
                'created_at' => $department->created_at->toDateTimeString(),
            ],
        ]);
    }

    public function edit(Department $department): Response
    {
        return Inertia::render('Admin/Departments/Form', [
            'department' => [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'is_support_team' => $department->is_support_team,
                'is_active' => $department->is_active,
                'description' => $department->description,
            ],
        ]);
    }

    public function update(DepartmentRequest $request, Department $department): RedirectResponse
    {
        $department->update($request->validated());

        return redirect()
            ->route('admin.departments.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        // Check if department has users or tickets
        if ($department->users()->count() > 0) {
            return redirect()
                ->route('admin.departments.index')
                ->with('error', 'Cannot delete department with assigned users.');
        }

        if ($department->tickets()->count() > 0) {
            return redirect()
                ->route('admin.departments.index')
                ->with('error', 'Cannot delete department with assigned tickets.');
        }

        $department->delete();

        return redirect()
            ->route('admin.departments.index')
            ->with('success', 'Department deleted successfully.');
    }
}

