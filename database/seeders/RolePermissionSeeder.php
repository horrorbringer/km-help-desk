<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $config = config('roles');

        if (! $config) {
            $this->command->error('Config file config/roles.php not found!');

            return;
        }

        // Step 1: Create Permissions
        $this->createPermissions($config['permissions_map']);

        // Step 2: Create Roles & Assign Permissions
        $this->createRolesAndAssignPermissions($config['structure']);
    }

    protected function createPermissions(array $map): void
    {
        foreach ($map as $group => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$group}.{$action}"]);
            }
        }
    }

    protected function createRolesAndAssignPermissions(array $rolesConfig): void
    {
        // First pass: Create all roles
        $createdRoles = [];
        foreach ($rolesConfig as $name => $data) {
            $role = Role::firstOrCreate(
                ['name' => $name],
                [
                    'hierarchy_level' => $data['level'],
                    'metadata' => $data['metadata'] ?? [],
                    'is_system_role' => $data['is_system'] ?? false,
                    'guard_name' => 'web',
                ]
            );
            $createdRoles[$name] = $role;
        }

        // Second pass: Set relationships and assign permissions
        foreach ($rolesConfig as $name => $data) {
            $role = $createdRoles[$name];

            // Set Parent
            if (! empty($data['parent']) && isset($createdRoles[$data['parent']])) {
                $role->parent_role_id = $createdRoles[$data['parent']]->id;
                $role->save();
            }

            // Assign Permissions
            if (! empty($data['permissions'])) {
                $permissionsToSync = [];

                foreach ($data['permissions'] as $permissionPattern) {
                    if ($permissionPattern === '*') {
                        // All permissions
                        $permissionsToSync = Permission::all();
                        break;
                    } elseif (str_ends_with($permissionPattern, '.*')) {
                        // Wildcard group (e.g. "tickets.*")
                        $group = explode('.', $permissionPattern)[0];
                        $groupPermissions = Permission::where('name', 'like', "{$group}.%")->get();
                        foreach ($groupPermissions as $p) {
                            $permissionsToSync[] = $p;
                        }
                    } else {
                        // Specific permission
                        $p = Permission::where('name', $permissionPattern)->first();
                        if ($p) {
                            $permissionsToSync[] = $p;
                        }

                        if ($permissionPattern === 'tickets.edit') {
                            foreach ([
                                'tickets.update-details',
                                'tickets.change-status',
                                'tickets.change-priority',
                                'tickets.comment',
                                'tickets.manage-comments',
                            ] as $granularPermission) {
                                $permission = Permission::where('name', $granularPermission)->first();
                                if ($permission) {
                                    $permissionsToSync[] = $permission;
                                }
                            }
                        }
                    }
                }

                // Handle exclusions if any
                if (! empty($data['excluded_permissions'])) {
                    $permissionsToSync = collect($permissionsToSync)
                        ->reject(fn ($p) => in_array($p->name, $data['excluded_permissions']))
                        ->unique('id');
                }

                $role->syncPermissions($permissionsToSync);
            }
        }
    }
}
