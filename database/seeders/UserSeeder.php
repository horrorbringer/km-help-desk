<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Step 1: Get department mappings
        $departments = Department::pluck('id', 'code')->toArray();

        // Step 2: Get role mappings
        $roles = $this->getRoleMappings();

        // Step 3: Create/Update users
        $this->createUsers($departments, $roles);
    }

    /**
     * Get role name mappings for easy reference
     */
    protected function getRoleMappings(): array
    {
        return [
            'super_admin' => Role::where('name', 'Super Admin')->first(),
            'hod' => Role::where('name', 'Head of Department')->first(),
            'director' => Role::where('name', 'Director')->first(),
            'line_manager' => Role::where('name', 'Line Manager')->first(),
            'manager' => Role::where('name', 'Manager')->first(),
            'agent' => Role::where('name', 'Agent')->first(),
            'requester' => Role::where('name', 'Requester')->first(),
        ];
    }

    /**
     * Create/Update all users and assign roles
     */
    protected function createUsers(array $departments, array $roles): void
    {
        $users = [
            // ============================================
            // SUPER ADMINS
            // ============================================
            [
                'name' => 'Makara',
                'email' => 'sonmakara69@gmail.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1001',
                'phone' => '+855 12 000 000',
                'role_key' => 'super_admin',
            ],
            [
                'name' => 'Vanny',
                'email' => 'vannysmilekh@gmail.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-1050',
                'phone' => '+855 12 000 002',
                'role_key' => 'super_admin',
            ],
            [
                'name' => 'Sopheap',
                'email' => 'sopheap@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1075',
                'phone' => '+855 12 000 003',
                'role_key' => 'super_admin',
            ],
            [
                'name' => 'Vutty',
                'email' => 'vutty@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1100',
                'phone' => '+855 12 000 004',
                'role_key' => 'super_admin',
            ],
            [
                'name' => 'Super Admin 01',
                'email' => 'superadmin01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1225',
                'phone' => '+855 12 000 005',
                'role_key' => 'super_admin',
            ],

            // ============================================
            // HEAD OF DEPARTMENT
            // ============================================
            [
                'name' => 'Sokuntha',
                'email' => 'sokuntha@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-0999',
                'phone' => '+855 12 000 001',
                'role_key' => 'hod',
            ],

            // ============================================
            // LINE MANAGERS
            // ============================================
            [
                'name' => 'Vannak',
                'email' => 'fnak98755@gmail.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1020',
                'phone' => '+855 12 345 678',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Manager 01',
                'email' => 'manager01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1175',
                'phone' => '+855 12 345 679',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Sopheap LM',
                'email' => 'sopheap.lm@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1500',
                'phone' => '+855 12 345 700',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Vutty LM',
                'email' => 'vutty.lm@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1525',
                'phone' => '+855 12 345 701',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Vanny LM',
                'email' => 'vanny.lm@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-1550',
                'phone' => '+855 12 345 702',
                'role_key' => 'line_manager',
            ],

            // ============================================
            // MANAGERS
            // ============================================
            [
                'name' => 'Sopheap Manager',
                'email' => 'sopheap.manager@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1425',
                'phone' => '+855 12 345 685',
                'role_key' => 'manager',
            ],
            [
                'name' => 'Vannak Field',
                'email' => 'vannak.field@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1450',
                'phone' => '+855 12 345 686',
                'role_key' => 'manager',
            ],

            // ============================================
            // AGENTS
            // ============================================
            [
                'name' => 'Pov',
                'email' => 'pov@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1125',
                'phone' => '+855 12 345 680',
                'role_key' => 'agent',
            ],
            [
                'name' => 'Agent 01',
                'email' => 'agent01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1150',
                'phone' => '+855 12 345 681',
                'role_key' => 'agent',
            ],
            [
                'name' => 'Sokha',
                'email' => 'sokha@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1250',
                'phone' => '+855 12 345 678',
                'role_key' => 'agent',
            ],
            [
                'name' => 'Ratha',
                'email' => 'ratha@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1275',
                'phone' => '+855 12 345 679',
                'role_key' => 'agent',
            ],
            [
                'name' => 'Srey',
                'email' => 'srey@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-1300',
                'phone' => '+855 12 345 680',
                'role_key' => 'agent',
            ],
            [
                'name' => 'Dara',
                'email' => 'dara@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1325',
                'phone' => '+855 12 345 681',
                'role_key' => 'agent',
            ],
            [
                'name' => 'Sophea',
                'email' => 'sophea@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1350',
                'phone' => '+855 12 345 682',
                'role_key' => 'agent',
            ],

            // ============================================
            // REQUESTERS
            // ============================================
            [
                'name' => 'Chanthou',
                'email' => 'chanthou@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1375',
                'phone' => '+855 12 345 683',
                'role_key' => 'requester',
            ],
            [
                'name' => 'Sokun',
                'email' => 'sokun@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1400',
                'phone' => '+855 12 345 684',
                'role_key' => 'requester',
            ],
            [
                'name' => 'Requester 01',
                'email' => 'requester01@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1200',
                'phone' => '+855 12 345 687',
                'role_key' => 'requester',
            ],
            [
                'name' => 'Dongdong',
                'email' => 'dongdongmi72@gmail.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1600',
                'phone' => '+855 12 345 688',
                'role_key' => 'requester',
            ],
            [
                'name' => 'Sunwukhong',
                'email' => 'sunwukhongking@gmail.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1625',
                'phone' => '+855 12 345 689',
                'role_key' => 'requester',
            ],
        ];

        foreach ($users as $userData) {
            // Extract role key
            $roleKey = $userData['role_key'] ?? null;
            unset($userData['role_key']);

            // Create or update user
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'), // Default password for all test users
                    'email_verified_at' => now(),
                    'department_id' => $departments[$userData['department_code']] ?? null,
                    'employee_id' => $userData['employee_id'] ?? null,
                    'phone' => $userData['phone'] ?? null,
                    'is_active' => true,
                ]
            );

            // Assign role to user
            if ($roleKey && isset($roles[$roleKey]) && $roles[$roleKey]) {
                $user->syncRoles([$roles[$roleKey]]);
            }
        }
    }
}


