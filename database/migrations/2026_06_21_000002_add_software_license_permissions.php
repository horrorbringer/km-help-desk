<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $guardName = config('auth.defaults.guard', 'web');
        $now = now();
        $permissionIds = [];

        foreach (['view', 'create', 'edit', 'delete'] as $action) {
            $permissionIds[] = DB::table('permissions')->where([
                'name' => "software-licenses.{$action}",
                'guard_name' => $guardName,
            ])->value('id') ?? DB::table('permissions')->insertGetId([
                'name' => "software-licenses.{$action}",
                'guard_name' => $guardName,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $roleIds = DB::table('roles')->whereIn('name', ['Super Admin', 'IT Manager', 'IT Administrator'])->pluck('id');
        foreach ($roleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_has_permissions')->updateOrInsert([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $ids = DB::table('permissions')->where('name', 'like', 'software-licenses.%')->pluck('id');
        DB::table('role_has_permissions')->whereIn('permission_id', $ids)->delete();
        DB::table('model_has_permissions')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('id', $ids)->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
