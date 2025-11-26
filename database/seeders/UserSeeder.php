<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure roles exist (should be created by RolePermissionSeeder)
        $departments = Department::pluck('id', 'code');

        $users = [
            [
                'name' => 'Makara',
                'email' => 'makara@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1001',
                'roles' => ['Super Admin'], // Super Admin has all permissions
            ],
            [
                'name' => 'Vannak',
                'email' => 'vannak@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1020',
                'roles' => ['Manager'], // Manager role
            ],
            [
                'name' => 'Vanny',
                'email' => 'vanny@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-1050',
                'roles' => ['Super Admin'], // Agent role
            ],
            [
                'name' => 'Sopheap',
                'email' => 'sopheap@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1075',
                'roles' => ['Super Admin'], // Agent role
            ],
            [
                'name' => 'Vutty',
                'email' => 'vutty@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1100',
                'roles' => ['Super Admin'], // Agent role
            ],
            [
                'name' => 'Pov',
                'email' => 'pov@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1125',
                'roles' => ['Agent'], // Agent role
            ],
        ];

        foreach ($users as $userData) {
            $roles = $userData['roles'] ?? [];
            unset($userData['roles']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'department_id' => $departments[$userData['department_code']] ?? null,
                    'employee_id' => $userData['employee_id'],
                    'is_active' => true,
                ]
            );

            // Assign roles to user
            if (!empty($roles)) {
                $roleModels = Role::whereIn('name', $roles)->get();
                if ($roleModels->isNotEmpty()) {
                    $user->syncRoles($roleModels);
                }
            }
        }
    }
}


