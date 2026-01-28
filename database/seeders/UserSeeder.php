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
            'dhod' => Role::where('name', 'Deputy Head of Department')->first(),
            'it_manager' => Role::where('name', 'IT Manager')->first(),
            'operations_manager' => Role::where('name', 'Operations Manager')->first(),
            'finance_manager' => Role::where('name', 'Finance Manager')->first(),
            'hr_manager' => Role::where('name', 'HR Manager')->first(),
            'procurement_manager' => Role::where('name', 'Procurement Manager')->first(),
            'safety_manager' => Role::where('name', 'Safety Manager')->first(),
            'line_manager' => Role::where('name', 'Line Manager')->first(),
            'dlm' => Role::where('name', 'Deputy Line Manager')->first(),
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
            // IT DEPARTMENT - V1 FOCUS
            // ============================================
            // Head of Department (IT)
            [
                'name' => 'Sokuntha',
                'email' => 'kmhodsokun@outlook.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-0999',
                'phone' => '+855 12 000 001',
                'role_key' => 'hod',
            ],
            // Deputy Head of Department (IT) - Backup for HOD
            [
                'name' => 'IT Deputy HOD',
                'email' => 'it.dhod@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-0998',
                'phone' => '+855 12 000 003',
                'role_key' => 'dhod',
            ],
            // ============================================
            // FIELD ENGINEERING DEPARTMENT
            // ============================================
            [
                'name' => 'Field Eng HOD',
                'email' => 'hod.field@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-FIELD-01',
                'phone' => '+855 12 000 101',
                'role_key' => 'hod',
            ],
            [
                'name' => 'Field Eng Deputy HOD',
                'email' => 'dhod.field@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-FIELD-02',
                'phone' => '+855 12 000 102',
                'role_key' => 'dhod',
            ],
            // ============================================
            // PROCUREMENT DEPARTMENT
            // ============================================
            [
                'name' => 'Procurement HOD',
                'email' => 'hod.proc@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-PROC-01',
                'phone' => '+855 12 000 201',
                'role_key' => 'hod',
            ],
            [
                'name' => 'Procurement Deputy HOD',
                'email' => 'dhod.proc@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-PROC-02',
                'phone' => '+855 12 000 202',
                'role_key' => 'dhod',
            ],
            // ============================================
            // HEALTH & SAFETY (HSE) DEPARTMENT
            // ============================================
            [
                'name' => 'HSE HOD',
                'email' => 'hod.hse@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-HSE-01',
                'phone' => '+855 12 000 301',
                'role_key' => 'hod',
            ],
            [
                'name' => 'HSE Deputy HOD',
                'email' => 'dhod.hse@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-HSE-02',
                'phone' => '+855 12 000 302',
                'role_key' => 'dhod',
            ],
            // ============================================
            // FINANCE DEPARTMENT
            // ============================================
            [
                'name' => 'Finance HOD',
                'email' => 'hod.fin@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-FIN-01',
                'phone' => '+855 12 000 401',
                'role_key' => 'hod',
            ],
            [
                'name' => 'Finance Deputy HOD',
                'email' => 'dhod.fin@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-FIN-02',
                'phone' => '+855 12 000 402',
                'role_key' => 'dhod',
            ],
            // ============================================
            // HR DEPARTMENT
            // ============================================
            [
                'name' => 'HR HOD',
                'email' => 'hod.hr@kimmix.com',
                'department_code' => 'HR',
                'employee_id' => 'EMP-HR-01',
                'phone' => '+855 12 000 501',
                'role_key' => 'hod',
            ],
            [
                'name' => 'HR Deputy HOD',
                'email' => 'dhod.hr@kimmix.com',
                'department_code' => 'HR',
                'employee_id' => 'EMP-HR-02',
                'phone' => '+855 12 000 502',
                'role_key' => 'dhod',
            ],
            // ============================================
            // FACILITIES DEPARTMENT
            // ============================================
            [
                'name' => 'Facilities HOD',
                'email' => 'hod.facilities@kimmix.com',
                'department_code' => 'FACILITIES',
                'employee_id' => 'EMP-FAC-01',
                'phone' => '+855 12 000 601',
                'role_key' => 'hod',
            ],
            [
                'name' => 'Facilities Deputy HOD',
                'email' => 'dhod.facilities@kimmix.com',
                'department_code' => 'FACILITIES',
                'employee_id' => 'EMP-FAC-02',
                'phone' => '+855 12 000 602',
                'role_key' => 'dhod',
            ],
            // ============================================
            // LINE MANAGERS & DEPUTY LINE MANAGERS
            // ============================================
            // IT Department
            [
                'name' => 'IT Line Manager',
                'email' => 'it.lm@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1021',
                'phone' => '+855 12 345 679',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'IT Deputy LM',
                'email' => 'it.dlm@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1022',
                'phone' => '+855 12 345 680',
                'role_key' => 'dlm',
            ],
            // Field Engineering Department
            [
                'name' => 'Field Eng Line Manager',
                'email' => 'field.lm@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-FIELD-LM-01', // Changed to avoid collision with old test data
                'phone' => '+855 12 345 678',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Field Eng Deputy LM',
                'email' => 'field.dlm@kimmix.com',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-FIELD-LM-02',
                'phone' => '+855 12 000 104',
                'role_key' => 'dlm',
            ],
            // Procurement Department
            [
                'name' => 'Procurement Line Manager',
                'email' => 'proc.lm@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-PROC-LM-01',
                'phone' => '+855 12 000 203',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Procurement Deputy LM',
                'email' => 'proc.dlm@kimmix.com',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-PROC-LM-02',
                'phone' => '+855 12 000 204',
                'role_key' => 'dlm',
            ],
            // HSE Department
            [
                'name' => 'HSE Line Manager',
                'email' => 'hse.lm@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-HSE-LM-01',
                'phone' => '+855 12 000 303',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'HSE Deputy LM',
                'email' => 'hse.dlm@kimmix.com',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-HSE-LM-02',
                'phone' => '+855 12 000 304',
                'role_key' => 'dlm',
            ],
            // Finance Department
            [
                'name' => 'Finance Line Manager',
                'email' => 'fin.lm@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-FIN-LM-01',
                'phone' => '+855 12 000 403',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Finance Deputy LM',
                'email' => 'fin.dlm@kimmix.com',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-FIN-LM-02',
                'phone' => '+855 12 000 404',
                'role_key' => 'dlm',
            ],
            // HR Department
            [
                'name' => 'HR Line Manager',
                'email' => 'hr.lm@kimmix.com',
                'department_code' => 'HR',
                'employee_id' => 'EMP-HR-LM-01',
                'phone' => '+855 12 000 503',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'HR Deputy LM',
                'email' => 'hr.dlm@kimmix.com',
                'department_code' => 'HR',
                'employee_id' => 'EMP-HR-LM-02',
                'phone' => '+855 12 000 504',
                'role_key' => 'dlm',
            ],
            // Facilities Department
            [
                'name' => 'Facilities Line Manager',
                'email' => 'fac.lm@kimmix.com',
                'department_code' => 'FACILITIES',
                'employee_id' => 'EMP-FAC-LM-01',
                'phone' => '+855 12 000 603',
                'role_key' => 'line_manager',
            ],
            [
                'name' => 'Facilities Deputy LM',
                'email' => 'fac.dlm@kimmix.com',
                'department_code' => 'FACILITIES',
                'employee_id' => 'EMP-FAC-LM-02',
                'phone' => '+855 12 000 604',
                'role_key' => 'dlm',
            ],
            // Line Manager (IT) - Required for approval workflow
            [
                'name' => 'IT Line Manager',
                'email' => 'it.lm@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1021',
                'phone' => '+855 12 345 679',
                'role_key' => 'line_manager',
            ],
            // Deputy Line Manager (IT) - Backup for LM
            [
                'name' => 'IT Deputy LM',
                'email' => 'it.dlm@kimmix.com',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1022',
                'phone' => '+855 12 345 680',
                'role_key' => 'dlm',
            ],

            // ============================================
            // OTHER DEPARTMENTS - LINE MANAGERS
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
