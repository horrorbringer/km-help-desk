<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $guardName = config('auth.defaults.guard', 'web');
        $now = now();

        $permissionId = DB::table('permissions')->where([
            'name' => 'dashboard.view',
            'guard_name' => $guardName,
        ])->value('id');

        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'dashboard.view',
                'guard_name' => $guardName,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $roleNames = collect(config('roles.structure', []))
            ->filter(fn (array $role): bool => in_array('*', $role['permissions'] ?? [], true)
                || in_array('dashboard.view', $role['permissions'] ?? [], true))
            ->keys();

        DB::table('roles')
            ->whereIn('name', $roleNames)
            ->where('guard_name', $guardName)
            ->pluck('id')
            ->each(function (int $roleId) use ($permissionId): void {
                DB::table('role_has_permissions')->updateOrInsert([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $guardName = config('auth.defaults.guard', 'web');
        $permissionId = DB::table('permissions')->where([
            'name' => 'dashboard.view',
            'guard_name' => $guardName,
        ])->value('id');

        if (! $permissionId) {
            return;
        }

        DB::table('role_has_permissions')
            ->where('permission_id', $permissionId)
            ->delete();

        DB::table('model_has_permissions')
            ->where('permission_id', $permissionId)
            ->delete();

        DB::table('permissions')
            ->where('id', $permissionId)
            ->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
