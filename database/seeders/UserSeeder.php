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
            'ceo' => Role::where('name', 'CEO')->first(),
            'director' => Role::where('name', 'Director')->first(),
            'hod' => Role::where('name', 'Head of Department')->first(),
            'it_manager' => Role::where('name', 'IT Manager')->first(),
            'operations_manager' => Role::where('name', 'Operations Manager')->first(),
            'finance_manager' => Role::where('name', 'Finance Manager')->first(),
            'hr_manager' => Role::where('name', 'HR Manager')->first(),
            'procurement_manager' => Role::where('name', 'Procurement Manager')->first(),
            'safety_manager' => Role::where('name', 'Safety Manager')->first(),
            'line_manager' => Role::where('name', 'Line Manager')->first(),
            'project_manager' => Role::where('name', 'Project Manager')->first(),
            'it_administrator' => Role::where('name', 'IT Administrator')->first(),
            'senior_agent' => Role::where('name', 'Senior Agent')->first(),
            'agent' => Role::where('name', 'Agent')->first(),
            'requester' => Role::where('name', 'Requester')->first(),
            'contractor' => Role::where('name', 'Contractor')->first(),
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
                'name' => 'Horror',
                'email' => 'bringerhorror@gmail.com',
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
                'email' => 'kmhodsokun@outlook.com',
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
            // DIRECTORS
            // ============================================
            [
                'name' => 'Makara',
                'email' => 'makara@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-0100',
                'phone' => '+855 12 000 010',
                'role_key' => 'director',
            ],

            // ============================================
            // IT MANAGER
            // ============================================
            [
                'name' => 'IT Manager',
                'email' => 'it.manager@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1100',
                'phone' => '+855 12 345 690',
                'role_key' => 'it_manager',
            ],

            // ============================================
            // OPERATIONS MANAGER
            // ============================================
            [
                'name' => 'Operations Manager',
                'email' => 'operations.manager@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1200',
                'phone' => '+855 12 345 691',
                'role_key' => 'operations_manager',
            ],

            // ============================================
            // FINANCE MANAGER
            // ============================================
            [
                'name' => 'Finance Manager',
                'email' => 'finance.manager@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1300',
                'phone' => '+855 12 345 692',
                'role_key' => 'finance_manager',
            ],

            // ============================================
            // HR MANAGER
            // ============================================
            [
                'name' => 'HR Manager',
                'email' => 'hr.manager@kimmix.com',
                'department_code' => 'HR',
                'employee_id' => 'EMP-1400',
                'phone' => '+855 12 345 693',
                'role_key' => 'hr_manager',
            ],

            // ============================================
            // PROCUREMENT MANAGER
            // ============================================
            [
                'name' => 'Procurement Manager',
                'email' => 'procurement.manager@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-1500',
                'phone' => '+855 12 345 694',
                'role_key' => 'procurement_manager',
            ],

            // ============================================
            // SAFETY MANAGER
            // ============================================
            [
                'name' => 'Safety Manager',
                'email' => 'safety.manager@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1600',
                'phone' => '+855 12 345 695',
                'role_key' => 'safety_manager',
            ],

            // ============================================
            // PROJECT MANAGER
            // ============================================
            [
                'name' => 'Project Manager',
                'email' => 'project.manager@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1750',
                'phone' => '+855 12 345 696',
                'role_key' => 'project_manager',
            ],

            // ============================================
            // IT ADMINISTRATOR
            // ============================================
            [
                'name' => 'IT Administrator',
                'email' => 'it.admin@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1850',
                'phone' => '+855 12 345 697',
                'role_key' => 'it_administrator',
            ],

            // ============================================
            // SENIOR AGENTS
            // ============================================
            [
                'name' => 'Senior Agent',
                'email' => 'senior.agent@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1950',
                'phone' => '+855 12 345 698',
                'role_key' => 'senior_agent',
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
            [
                'name' => 'Finance User',
                'email' => 'finance.user@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-2300',
                'phone' => '+855 12 345 685',
                'role_key' => 'requester',
            ],
            [
                'name' => 'HR User',
                'email' => 'hr.user@kimmix.com',
                'department_code' => 'HR',
                'employee_id' => 'EMP-2400',
                'phone' => '+855 12 345 686',
                'role_key' => 'requester',
            ],

            // ============================================
            // CONTRACTORS (External Users)
            // ============================================
            [
                'name' => 'External Contractor',
                'email' => 'contractor@external.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'CON-1001',
                'phone' => '+855 12 345 700',
                'role_key' => 'contractor',
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


