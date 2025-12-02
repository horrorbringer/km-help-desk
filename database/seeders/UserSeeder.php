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
        // Real users for testing IT interactions
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

            // ============================================
            // MANAGERS
            // ============================================
            [
                'name' => 'Vutty',
                'email' => 'vutty63552@outlook.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1700',
                'phone' => '+855 12 345 679',
                'role_key' => 'manager',
            ],

            // ============================================
            // AGENTS (IT Support Staff)
            // ============================================
            [
                'name' => 'Sokha',
                'email' => 'sokha6338@outlook.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1800',
                'phone' => '+855 12 345 680',
                'role_key' => 'agent',
            ],
            [
                'name' => 'Sunwukhong',
                'email' => 'sunwukhongking@gmail.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1900',
                'phone' => '+855 12 345 681',
                'role_key' => 'agent',
            ],

            // ============================================
            // REQUESTERS (End Users)
            // ============================================
            [
                'name' => 'Chanthou',
                'email' => 'chanthou121@outlook.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-2000',
                'phone' => '+855 12 345 682',
                'role_key' => 'requester',
            ],
            [
                'name' => 'Dongdong',
                'email' => 'dongdongmi72@gmail.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-2100',
                'phone' => '+855 12 345 683',
                'role_key' => 'requester',
            ],
            [
                'name' => 'Sokun',
                'email' => 'sokun12442@outlook.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-2200',
                'phone' => '+855 12 345 684',
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


