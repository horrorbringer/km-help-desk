<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'department', 'is_active']);

        $users = User::query()
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
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_id' => $user->employee_id,
                'department' => $user->department ? [
                    'id' => $user->department->id,
                    'name' => $user->department->name,
                ] : null,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->toDateTimeString(),
            ]);

        $departments = Department::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $filters,
            'departments' => $departments,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Form', [
            'user' => null,
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        User::create($data);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User created successfully.');
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
            ],
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

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
}

