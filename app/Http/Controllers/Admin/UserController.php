<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Department;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $filters = $request->only(['q', 'department', 'is_active']);

        $query = User::query()
            ->with(['department:id,name'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('employee_id', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['department']), function ($query) use ($filters) {
                $query->where('department_id', $filters['department']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            });

        // Apply department-based visibility
        // Admins, CEO, Director, Super Admin can see all users
        // HODs, Line Managers, and Department Managers see only their department
        if (!$user->hasAnyRole(['Super Admin', 'Admin', 'CEO', 'Director', 'Project Manager'])) {
            // Check if user has a department
            if ($user->department_id) {
                $query->where('department_id', $user->department_id);
            } else {
                // Users without department can only see themselves
                $query->where('id', $user->id);
            }
        }

        $users = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'phone' => $user->phone,
                'employee_id' => $user->employee_id,
                'department' => $user->department ? [
                    'id' => $user->department->id,
                    'name' => $user->department->name,
                ] : null,
                'roles' => $user->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ]),
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->toDateTimeString(),
            ]);

        // Get departments based on visibility
        // Admins see all departments, others see only their department
        if ($user->hasAnyRole(['Super Admin', 'Admin', 'CEO', 'Director', 'Project Manager'])) {
            $departments = Department::select('id', 'name')->orderBy('name')->get();
        } else {
            $departments = $user->department_id 
                ? Department::where('id', $user->department_id)->select('id', 'name')->orderBy('name')->get()
                : collect([]);
        }

        // Get user statistics (respecting visibility)
        $statsQuery = User::query();
        if (!$user->hasAnyRole(['Super Admin', 'Admin', 'CEO', 'Director', 'Project Manager'])) {
            if ($user->department_id) {
                $statsQuery->where('department_id', $user->department_id);
            } else {
                $statsQuery->where('id', $user->id);
            }
        }
        
        $stats = [
            'total' => (clone $statsQuery)->count(),
            'active' => (clone $statsQuery)->where('is_active', true)->count(),
            'inactive' => (clone $statsQuery)->where('is_active', false)->count(),
            'with_department' => (clone $statsQuery)->whereNotNull('department_id')->count(),
        ];

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $filters,
            'departments' => $departments,
            'roles' => Role::orderBy('name')->get(['id', 'name']),
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Form', [
            'user' => null,
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $roleIds = $data['role_ids'] ?? [];
        unset($data['role_ids']);
        
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user = User::create($data);

        // Assign roles
        if (!empty($roleIds)) {
            $roles = Role::whereIn('id', $roleIds)->get();
            $user->syncRoles($roles);
        }

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user): Response
    {
        $user->load(['department:id,name', 'roles:id,name']);

        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'phone' => $user->phone,
                'employee_id' => $user->employee_id,
                'department' => $user->department ? [
                    'id' => $user->department->id,
                    'name' => $user->department->name,
                ] : null,
                'roles' => $user->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ]),
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->toDateTimeString(),
                'updated_at' => $user->updated_at->toDateTimeString(),
            ],
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load('department:id,name');

        return Inertia::render('Admin/Users/Form', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_id' => $user->employee_id,
                'department_id' => $user->department_id,
                'is_active' => $user->is_active,
                'role_ids' => $user->roles->pluck('id')->toArray(),
            ],
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $roleIds = $data['role_ids'] ?? [];
        unset($data['role_ids']);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        // Sync roles
        if (isset($roleIds)) {
            $roles = Role::whereIn('id', $roleIds)->get();
            $user->syncRoles($roles);
        }

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        $action = $request->input('action');
        
        $rules = [
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['exists:users,id'],
            'action' => ['required', 'string', 'in:activate,deactivate,assign_department,assign_role,remove_role'],
        ];

        // Value is only required for actions that need it
        if (in_array($action, ['assign_department', 'assign_role', 'remove_role'])) {
            $rules['value'] = ['required'];
        }

        $request->validate($rules);

        $userIds = $request->input('user_ids');
        $value = $request->input('value');

        $users = User::whereIn('id', $userIds)->get();
        $updatedCount = 0;

        foreach ($users as $user) {
            $changed = false;

            switch ($action) {
                case 'activate':
                    if (!$user->is_active) {
                        $user->is_active = true;
                        $user->save();
                        $changed = true;
                    }
                    break;

                case 'deactivate':
                    if ($user->is_active) {
                        $user->is_active = false;
                        $user->save();
                        $changed = true;
                    }
                    break;

                case 'assign_department':
                    if ($value === '__none' || $value === '') {
                        $user->department_id = null;
                        $user->save();
                        $changed = true;
                    } else {
                        $department = Department::find($value);
                        if ($department) {
                            $user->department_id = $value;
                            $user->save();
                            $changed = true;
                        }
                    }
                    break;

                case 'assign_role':
                    $role = Role::find($value);
                    if ($role && !$user->hasRole($role->name)) {
                        $user->assignRole($role);
                        $changed = true;
                    }
                    break;

                case 'remove_role':
                    $role = Role::find($value);
                    if ($role && $user->hasRole($role->name)) {
                        $user->removeRole($role);
                        $changed = true;
                    }
                    break;
            }

            if ($changed) {
                $updatedCount++;
            }
        }

        $message = $updatedCount > 0
            ? "Successfully updated {$updatedCount} user(s)."
            : "No users were updated.";

        return redirect()
            ->route('admin.users.index')
            ->with('success', $message);
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['exists:users,id'],
        ]);

        $userIds = $request->input('user_ids');
        $count = User::whereIn('id', $userIds)->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', "Successfully deleted {$count} user(s).");
    }

    public function toggleActive(User $user): RedirectResponse
    {
        $user->is_active = !$user->is_active;
        $user->save();

        return redirect()
            ->route('admin.users.index')
            ->with('success', "User {$user->name} has been " . ($user->is_active ? 'activated' : 'deactivated') . '.');
    }

    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $filters = $request->only(['q', 'department', 'is_active']);

        $query = User::query()
            ->with(['department:id,name', 'roles:id,name'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('employee_id', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['department']), function ($query) use ($filters) {
                $query->where('department_id', $filters['department']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            });

        // Apply department-based visibility (same as index)
        if (!$user->hasAnyRole(['Super Admin', 'Admin', 'CEO', 'Director', 'Project Manager'])) {
            if ($user->department_id) {
                $query->where('department_id', $user->department_id);
            } else {
                $query->where('id', $user->id);
            }
        }

        $users = $query->latest()->get();

        $filename = 'users_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');

            // Add CSV headers
            fputcsv($file, [
                'Name',
                'Email',
                'Employee ID',
                'Phone',
                'Department',
                'Roles',
                'Status',
                'Created At',
            ]);

            // Add data rows
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->name,
                    $user->email,
                    $user->employee_id ?? '',
                    $user->phone ?? '',
                    $user->department?->name ?? '',
                    $user->roles->pluck('name')->join(', '),
                    $user->is_active ? 'Active' : 'Inactive',
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));
        
        // Remove header row
        $headers = array_shift($data);
        
        $imported = 0;
        $updated = 0;
        $errors = [];

        foreach ($data as $index => $row) {
            $rowNumber = $index + 2; // +2 because we removed header and arrays are 0-indexed

            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            // Map CSV columns (assuming: Name, Email, Employee ID, Phone, Department, Roles, Status)
            $name = $row[0] ?? '';
            $email = $row[1] ?? '';
            $employeeId = $row[2] ?? '';
            $phone = $row[3] ?? '';
            $departmentName = $row[4] ?? '';
            $rolesString = $row[5] ?? '';
            $status = strtolower(trim($row[6] ?? 'active'));

            // Validate required fields
            if (empty($name) || empty($email)) {
                $errors[] = "Row {$rowNumber}: Name and Email are required.";
                continue;
            }

            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Row {$rowNumber}: Invalid email format ({$email}).";
                continue;
            }

            // Find or create user
            $user = User::where('email', $email)->first();

            if ($user) {
                // Update existing user
                $user->name = $name;
                $user->employee_id = $employeeId ?: $user->employee_id;
                $user->phone = $phone ?: $user->phone;
                $user->is_active = in_array($status, ['active', '1', 'true', 'yes']);
                
                // Update department
                if ($departmentName) {
                    $department = Department::where('name', $departmentName)->first();
                    if ($department) {
                        $user->department_id = $department->id;
                    }
                }

                $user->save();
                $updated++;

                // Update roles
                if ($rolesString) {
                    $roleNames = array_map('trim', explode(',', $rolesString));
                    $roles = Role::whereIn('name', $roleNames)->get();
                    if ($roles->isNotEmpty()) {
                        $user->syncRoles($roles);
                    }
                }
            } else {
                // Create new user (password will need to be set separately)
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'employee_id' => $employeeId,
                    'phone' => $phone,
                    'password' => Hash::make('password'), // Default password - should be changed
                    'is_active' => in_array($status, ['active', '1', 'true', 'yes']),
                ]);

                // Assign department
                if ($departmentName) {
                    $department = Department::where('name', $departmentName)->first();
                    if ($department) {
                        $user->department_id = $department->id;
                        $user->save();
                    }
                }

                // Assign roles
                if ($rolesString) {
                    $roleNames = array_map('trim', explode(',', $rolesString));
                    $roles = Role::whereIn('name', $roleNames)->get();
                    if ($roles->isNotEmpty()) {
                        $user->syncRoles($roles);
                    }
                }

                $imported++;
            }
        }

        $message = "Import completed: {$imported} new user(s) imported, {$updated} user(s) updated.";
        if (!empty($errors)) {
            $message .= " " . count($errors) . " error(s) occurred.";
        }

        return redirect()
            ->route('admin.users.index')
            ->with('success', $message)
            ->with('import_errors', $errors);
    }
}

