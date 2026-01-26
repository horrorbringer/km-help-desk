<?php

namespace App\Http\Controllers\Admin;

use App\Constants\RoleConstants;
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
        abort_unless($request->user()->can('departments.view'), 403, 'You do not have permission to view departments.');
        
        $user = $request->user();
        $filters = $request->only(['q', 'is_support_team', 'is_active']);

        $query = Department::query()
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
            });

        // Apply department-based visibility
        // Executives (Super Admin, CEO, Director) can see all departments
        // All other users can only see their own department
        if (!$user->hasAnyRole(RoleConstants::getExecutiveRoles())) {
            if ($user->department_id) {
                // User has a department - show only their department
                $query->where('id', $user->department_id);
            } else {
                // User has no department - show nothing (or empty result)
                $query->whereRaw('1 = 0'); // Always false condition
            }
        }

        $departments = $query->latest()
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
        abort_unless(auth()->user()->can('departments.create'), 403, 'You do not have permission to create departments.');
        
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
        abort_unless(auth()->user()->can('departments.view'), 403, 'You do not have permission to view departments.');
        
        $user = request()->user();
        
        // Check if user can view this department
        // Executives can view all, others can only view their own
        if (!$user->hasAnyRole(RoleConstants::getExecutiveRoles())) {
            if ($user->department_id !== $department->id) {
                abort(403, 'You can only view your own department.');
            }
        }
        
        $department->load(['users.roles', 'tickets' => function ($query) {
            $query->latest()->take(10);
        }]);
        
        $usersCount = $department->users()->count();
        $ticketsCount = $department->tickets()->count();

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
                    'roles' => $user->roles->map(fn ($role) => [
                        'id' => $role->id,
                        'name' => $role->name,
                    ]),
                ]),
                'users_count' => $usersCount,
                'recent_tickets' => $department->tickets->map(fn ($ticket) => [
                    'id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at->toDateTimeString(),
                ]),
                'tickets_count' => $ticketsCount,
                'created_at' => $department->created_at->toDateTimeString(),
            ],
        ]);
    }

    public function edit(Department $department): Response
    {
        abort_unless(auth()->user()->can('departments.edit'), 403, 'You do not have permission to edit departments.');
        
        $user = auth()->user();
        
        // Check if user can edit this department
        // Executives can edit all, others can only edit their own
        if (!$user->hasAnyRole(RoleConstants::getExecutiveRoles())) {
            if ($user->department_id !== $department->id) {
                abort(403, 'You can only edit your own department.');
            }
        }
        
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
        abort_unless($request->user()->can('departments.edit'), 403, 'You do not have permission to edit departments.');
        
        $user = $request->user();
        
        // Check if user can edit this department
        // Executives can edit all, others can only edit their own
        if (!$user->hasAnyRole(RoleConstants::getExecutiveRoles())) {
            if ($user->department_id !== $department->id) {
                abort(403, 'You can only edit your own department.');
            }
        }
        
        $department->update($request->validated());

        return redirect()
            ->route('admin.departments.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        abort_unless(auth()->user()->can('departments.delete'), 403, 'You do not have permission to delete departments.');
        
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

    public function toggleStatus(Department $department): RedirectResponse
    {
        abort_unless(auth()->user()->can('departments.edit'), 403, 'You do not have permission to edit departments.');
        
        $user = auth()->user();
        
        // Check if user can edit this department
        if (!$user->hasAnyRole(RoleConstants::getExecutiveRoles())) {
            if ($user->department_id !== $department->id) {
                abort(403, 'You can only edit your own department.');
            }
        }
        
        $newStatus = !$department->is_active;
        $department->update(['is_active' => $newStatus]);
        
        // When disabling, users remain active but department won't receive new tickets
        // When enabling, department can receive tickets again
        $usersCount = $department->users()->count();
        $message = $newStatus 
            ? "Department activated successfully. It can now receive new tickets."
            : "Department deactivated successfully. It will not receive new tickets.";
        
        if ($usersCount > 0) {
            $message .= " Note: {$usersCount} user" . ($usersCount > 1 ? 's remain' : ' remains') . " assigned to this department and will stay active.";
        }

        return redirect()
            ->route('admin.departments.index')
            ->with('success', $message);
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->can('departments.edit'), 403, 'You do not have permission to edit departments.');
        
        $request->validate([
            'department_ids' => ['required', 'array', 'min:1'],
            'department_ids.*' => ['exists:departments,id'],
            'action' => ['required', 'string', 'in:activate,deactivate'],
        ]);

        $departmentIds = $request->input('department_ids');
        $action = $request->input('action');

        $departments = Department::whereIn('id', $departmentIds)->get();

        $updated = 0;
        $skipped = 0;

        $totalUsers = 0;
        foreach ($departments as $department) {
            if ($action === 'activate') {
                $department->update(['is_active' => true]);
                $updated++;
            } elseif ($action === 'deactivate') {
                $department->update(['is_active' => false]);
                $totalUsers += $department->users()->count();
                $updated++;
            }
        }

        $departmentWord = $updated === 1 ? 'department' : 'departments';
        $message = "Successfully {$action}d {$updated} {$departmentWord}.";
        
        if ($action === 'deactivate' && $totalUsers > 0) {
            $message .= " Note: {$totalUsers} user" . ($totalUsers > 1 ? 's remain' : ' remains') . " assigned to these departments and will stay active.";
        }
        
        if ($skipped > 0) {
            $skippedWord = $skipped === 1 ? 'department was' : 'departments were';
            $message .= " {$skipped} {$skippedWord} skipped.";
        }

        return redirect()
            ->route('admin.departments.index')
            ->with('success', $message);
    }
}

