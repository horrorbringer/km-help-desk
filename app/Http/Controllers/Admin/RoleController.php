<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(auth()->user()->can('roles.view'), 403);

        $roles = Role::with('permissions')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'users_count' => $role->users_count,
                'permissions_count' => $role->permissions->count(),
                'created_at' => $role->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function create(): Response
    {
        abort_unless(auth()->user()->can('roles.create'), 403);

        $permissions = Permission::orderBy('name')->get()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('Admin/Roles/Form', [
            'role' => null,
            'permissions' => $permissions->map(fn ($group, $key) => [
                'group' => $key,
                'permissions' => $group->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'label' => $this->formatPermissionName($p->name),
                ]),
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->can('roles.create'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (!empty($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        abort_unless(auth()->user()->can('roles.edit'), 403);

        $permissions = Permission::orderBy('name')->get()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('Admin/Roles/Form', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permission_ids' => $role->permissions->pluck('id')->toArray(),
            ],
            'permissions' => $permissions->map(fn ($group, $key) => [
                'group' => $key,
                'permissions' => $group->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'label' => $this->formatPermissionName($p->name),
                ]),
            ])->values(),
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        abort_unless(auth()->user()->can('roles.edit'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        abort_unless(auth()->user()->can('roles.delete'), 403);

        // Prevent deletion of Super Admin role
        if ($role->name === 'Super Admin') {
            return redirect()
                ->route('admin.roles.index')
                ->with('error', 'Cannot delete Super Admin role.');
        }

        $role->delete();

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role deleted successfully.');
    }

    protected function formatPermissionName(string $name): string
    {
        $parts = explode('.', $name);
        $action = ucfirst($parts[1] ?? '');
        $resource = ucfirst(str_replace('-', ' ', $parts[0] ?? ''));
        return "{$action} {$resource}";
    }
}

