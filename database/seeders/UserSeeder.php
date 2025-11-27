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
            [
                'name' => 'Agent 01',
                'email' => 'agent01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1150',
                'roles' => ['Agent'], // Agent role
            ],
            [
                'name' => 'Manager 01',
                'email' => 'manager01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1175',
                'roles' => ['Manager'], // Manager role
            ],
            [
                'name' => 'Requester 01',
                'email' => 'requester01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1200',
                'roles' => ['Requester'], // Requester role
            ],
            [
                'name' => 'Super Admin 01',
                'email' => 'superadmin01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1225',
                'roles' => ['Super Admin'], // Super Admin role
            ],
            [
                'name' => 'Sokha',
                'email' => 'sokha@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1250',
                'phone' => '+855 12 345 678',
                'roles' => ['Agent'],
            ],
            [
                'name' => 'Ratha',
                'email' => 'ratha@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1275',
                'phone' => '+855 12 345 679',
                'roles' => ['Agent'],
            ],
            [
                'name' => 'Srey',
                'email' => 'srey@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-1300',
                'phone' => '+855 12 345 680',
                'roles' => ['Agent'],
            ],
            [
                'name' => 'Dara',
                'email' => 'dara@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1325',
                'phone' => '+855 12 345 681',
                'roles' => ['Agent'],
            ],
            [
                'name' => 'Sophea',
                'email' => 'sophea@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1350',
                'phone' => '+855 12 345 682',
                'roles' => ['Agent'],
            ],
            [
                'name' => 'Chanthou',
                'email' => 'chanthou@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1375',
                'phone' => '+855 12 345 683',
                'roles' => ['Requester'],
            ],
            [
                'name' => 'Sokun',
                'email' => 'sokun@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1400',
                'phone' => '+855 12 345 684',
                'roles' => ['Requester'],
            ],
            [
                'name' => 'Sopheap Manager',
                'email' => 'sopheap.manager@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1425',
                'phone' => '+855 12 345 685',
                'roles' => ['Manager'],
            ],
            [
                'name' => 'Vannak Field',
                'email' => 'vannak.field@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1450',
                'phone' => '+855 12 345 686',
                'roles' => ['Manager'],
            ]
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
                    'employee_id' => $userData['employee_id'] ?? null,
                    'phone' => $userData['phone'] ?? null,
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


