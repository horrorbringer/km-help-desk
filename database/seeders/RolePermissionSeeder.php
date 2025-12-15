<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Step 1: Create all permissions
        $this->createPermissions();

        // Step 2: Create all roles
        $this->createRoles();

        // Step 3: Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    /**
     * Step 1: Create all system permissions
     */
    protected function createPermissions(): void
    {
        $permissionGroups = [
            // Tickets
            'tickets' => ['view', 'create', 'edit', 'delete', 'assign', 'resolve', 'close', 'auto-approve', 'create-on-behalf'],
            
            // Users
            'users' => ['view', 'create', 'edit', 'delete'],
            
            // Departments
            'departments' => ['view', 'create', 'edit', 'delete'],
            
            // Categories
            'categories' => ['view', 'create', 'edit', 'delete'],
            
            // Projects
            'projects' => ['view', 'create', 'edit', 'delete'],
            
            // SLA Policies
            'sla-policies' => ['view', 'create', 'edit', 'delete'],
            
            // Tags
            'tags' => ['view', 'create', 'edit', 'delete'],
            
            // Canned Responses
            'canned-responses' => ['view', 'create', 'edit', 'delete'],
            
            // Email Templates
            'email-templates' => ['view', 'create', 'edit', 'delete'],
            
            // Automation Rules
            'automation-rules' => ['view', 'create', 'edit', 'delete'],
            
            // Escalation Rules
            'escalation-rules' => ['view', 'create', 'edit', 'delete'],
            
            // Custom Fields
            'custom-fields' => ['view', 'create', 'edit', 'delete'],
            
            // Ticket Templates
            'ticket-templates' => ['view', 'create', 'edit', 'delete'],
            
            // Time Entries
            'time-entries' => ['view', 'create', 'edit', 'delete', 'approve'],
            
            // Knowledge Base
            'knowledge-base' => ['view', 'create', 'edit', 'delete'],
            
            // Reports
            'reports' => ['view'],
            
            // Notifications
            'notifications' => ['view'],
            
            // Settings
            'settings' => ['view', 'edit'],
            
            // Roles & Permissions
            'roles' => ['view', 'create', 'edit', 'delete'],
        ];

        foreach ($permissionGroups as $group => $actions) {
            foreach ($actions as $action) {
                $permissionName = "{$group}.{$action}";
                Permission::firstOrCreate(['name' => $permissionName]);
            }
        }
    }

    /**
     * Step 2: Create all system roles with hierarchy and metadata
     * Organized by hierarchy: Executive → Management → Operations → Support → Users
     */
    protected function createRoles(): void
    {
        $roles = [
            // Executive Level (Level 10-7)
            [
                'name' => 'Super Admin',
                'hierarchy_level' => 10,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => null, // Unlimited
                    'department_scope' => 'all',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'CEO',
                'hierarchy_level' => 9,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => null, // Unlimited
                    'department_scope' => 'all',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Director',
                'hierarchy_level' => 8,
                'parent_role_id' => null, // Will set after creation
                'metadata' => [
                    'approval_limit' => 50000,
                    'department_scope' => 'all',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Head of Department',
                'hierarchy_level' => 7,
                'parent_role_id' => null, // Will set after creation
                'metadata' => [
                    'approval_limit' => 10000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Deputy Head of Department',
                'hierarchy_level' => 6.5, // Between HOD (7) and Managers (6)
                'parent_role_id' => null, // Will set after creation (parent: HOD)
                'metadata' => [
                    'approval_limit' => 7500, // Slightly lower than HOD
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            
            // Management Level (Level 6-4)
            [
                'name' => 'IT Manager',
                'hierarchy_level' => 6,
                'parent_role_id' => null, // Will set after creation
                'metadata' => [
                    'approval_limit' => 5000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Operations Manager',
                'hierarchy_level' => 6,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => 5000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Finance Manager',
                'hierarchy_level' => 6,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => 5000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'HR Manager',
                'hierarchy_level' => 6,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => 5000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Procurement Manager',
                'hierarchy_level' => 6,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => 5000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Safety Manager',
                'hierarchy_level' => 6,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => 5000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Line Manager',
                'hierarchy_level' => 5,
                'parent_role_id' => null, // Will set after creation
                'metadata' => [
                    'approval_limit' => 1000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Deputy Line Manager',
                'hierarchy_level' => 4.5, // Between LM (5) and Operations (3-2)
                'parent_role_id' => null, // Will set after creation (parent: LM)
                'metadata' => [
                    'approval_limit' => 750, // Slightly lower than LM
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Project Manager',
                'hierarchy_level' => 5,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => 5000,
                    'department_scope' => 'project',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Manager',
                'hierarchy_level' => 5,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => 1000,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            
            // Operations Level (Level 3-2)
            [
                'name' => 'IT Administrator',
                'hierarchy_level' => 3,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => null,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Senior Agent',
                'hierarchy_level' => 2,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => null,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Agent',
                'hierarchy_level' => 2,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => null,
                    'department_scope' => 'own_department',
                ],
                'is_system_role' => true,
            ],
            
            // User Level (Level 1-0)
            [
                'name' => 'Requester',
                'hierarchy_level' => 1,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => null,
                    'department_scope' => 'none',
                ],
                'is_system_role' => true,
            ],
            [
                'name' => 'Contractor',
                'hierarchy_level' => 0,
                'parent_role_id' => null,
                'metadata' => [
                    'approval_limit' => null,
                    'department_scope' => 'none',
                ],
                'is_system_role' => true,
            ],
        ];

        // First pass: Create all roles
        $createdRoles = [];
        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                [
                    'hierarchy_level' => $roleData['hierarchy_level'],
                    'metadata' => $roleData['metadata'],
                    'is_system_role' => $roleData['is_system_role'],
                ]
            );
            $createdRoles[$roleData['name']] = $role;
        }

        // Second pass: Set parent relationships
        $parentMappings = [
            'Director' => 'CEO',
            'Head of Department' => 'Director',
            'Deputy Head of Department' => 'Head of Department',
            'IT Manager' => 'Head of Department',
            'Operations Manager' => 'Head of Department',
            'Finance Manager' => 'Head of Department',
            'HR Manager' => 'Head of Department',
            'Procurement Manager' => 'Head of Department',
            'Safety Manager' => 'Head of Department',
            'Line Manager' => 'Head of Department',
            'Deputy Line Manager' => 'Line Manager',
            'Manager' => 'Head of Department',
            'Project Manager' => 'Head of Department',
            'IT Administrator' => 'IT Manager',
            'Senior Agent' => 'Line Manager',
            'Agent' => 'Line Manager',
        ];

        foreach ($parentMappings as $childName => $parentName) {
            if (isset($createdRoles[$childName]) && isset($createdRoles[$parentName])) {
                $createdRoles[$childName]->update([
                    'parent_role_id' => $createdRoles[$parentName]->id
                ]);
            }
        }
    }

    /**
     * Step 3: Assign permissions to roles
     * Organized by organizational hierarchy
     */
    protected function assignPermissionsToRoles(): void
    {
        // Executive Level
        $this->assignSuperAdminPermissions();
        $this->assignCEOPermissions();
        $this->assignDirectorPermissions();
        $this->assignHODPermissions();
        $this->assignDHODPermissions();

        // Management Level
        $this->assignITManagerPermissions();
        $this->assignOperationsManagerPermissions();
        $this->assignFinanceManagerPermissions();
        $this->assignHRManagerPermissions();
        $this->assignProcurementManagerPermissions();
        $this->assignSafetyManagerPermissions();
        $this->assignLineManagerPermissions();
        $this->assignDLMPermissions();
        $this->assignProjectManagerPermissions();

        // Operations Level
        $this->assignITAdministratorPermissions();
        $this->assignSeniorAgentPermissions();
        $this->assignAgentPermissions();

        // User Level
        $this->assignRequesterPermissions();
        $this->assignContractorPermissions();
    }

    /**
     * Super Admin: Full system access
     */
    protected function assignSuperAdminPermissions(): void
    {
        $role = Role::where('name', 'Super Admin')->first();
        $role->givePermissionTo(Permission::all());
    }

    /**
     * CEO: Executive-level access with strategic oversight
     */
    protected function assignCEOPermissions(): void
    {
        $role = Role::where('name', 'CEO')->first();
        $role->givePermissionTo([
            // Ticket Management (view and approve)
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve',
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
            
            // Settings (view only)
            'settings.view',
        ]);
    }

    /**
     * Director: Organization-level management and approval
     */
    protected function assignDirectorPermissions(): void
    {
        $role = Role::where('name', 'Director')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve',
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * Head of Department: Department-level approval and management
     */
    protected function assignHODPermissions(): void
    {
        $role = Role::where('name', 'Head of Department')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve', // Can bypass approval workflow
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * Deputy Head of Department: Acts as HOD when HOD is unavailable
     */
    protected function assignDHODPermissions(): void
    {
        $role = Role::where('name', 'Deputy Head of Department')->first();
        if (!$role) {
            return;
        }
        
        // DHOD has similar permissions to HOD but slightly reduced approval limit
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve', // Can bypass approval workflow (when HOD unavailable)
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * IT Manager: IT department management and IT-specific permissions
     */
    protected function assignITManagerPermissions(): void
    {
        $role = Role::where('name', 'IT Manager')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.create-on-behalf',
            
            // IT Resources Management
            'users.view',
            'users.create',
            'users.edit',
            'departments.view',
            'categories.view',
            'categories.edit',
            'projects.view',
            'tags.view',
            
            // IT-Specific
            'custom-fields.view',
            'custom-fields.create',
            'custom-fields.edit',
            'automation-rules.view',
            'automation-rules.create',
            'automation-rules.edit',
            'escalation-rules.view',
            'escalation-rules.create',
            'escalation-rules.edit',
            'email-templates.view',
            'email-templates.create',
            'email-templates.edit',
            'sla-policies.view',
            'sla-policies.create',
            'sla-policies.edit',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'knowledge-base.create',
            'knowledge-base.edit',
            'reports.view',
        ]);
    }

    /**
     * Operations Manager: Field operations and site management
     */
    protected function assignOperationsManagerPermissions(): void
    {
        $role = Role::where('name', 'Operations Manager')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'projects.edit',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * Finance Manager: Financial oversight and approval
     */
    protected function assignFinanceManagerPermissions(): void
    {
        $role = Role::where('name', 'Finance Manager')->first();
        $role->givePermissionTo([
            // Ticket Management (for finance-related tickets)
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve', // Can approve finance-related requests
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * HR Manager: Human resources management
     */
    protected function assignHRManagerPermissions(): void
    {
        $role = Role::where('name', 'HR Manager')->first();
        $role->givePermissionTo([
            // Ticket Management (for HR-related tickets)
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.create-on-behalf',
            
            // User Management
            'users.view',
            'users.create',
            'users.edit',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'knowledge-base.create',
            'knowledge-base.edit',
            'reports.view',
        ]);
    }

    /**
     * Procurement Manager: Purchasing and vendor management
     */
    protected function assignProcurementManagerPermissions(): void
    {
        $role = Role::where('name', 'Procurement Manager')->first();
        $role->givePermissionTo([
            // Ticket Management (for procurement tickets)
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve', // Can approve procurement requests
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * Safety Manager: Health, safety, and compliance
     */
    protected function assignSafetyManagerPermissions(): void
    {
        $role = Role::where('name', 'Safety Manager')->first();
        $role->givePermissionTo([
            // Ticket Management (for safety-related tickets)
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'knowledge-base.create',
            'knowledge-base.edit',
            'reports.view',
        ]);
    }

    /**
     * Line Manager: First-level approval authority for team members
     */
    protected function assignLineManagerPermissions(): void
    {
        $role = Role::where('name', 'Line Manager')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve', // Can approve team member requests
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * Deputy Line Manager: Acts as LM when LM is unavailable
     */
    protected function assignDLMPermissions(): void
    {
        $role = Role::where('name', 'Deputy Line Manager')->first();
        if (!$role) {
            return;
        }
        
        // DLM has similar permissions to LM but slightly reduced approval limit
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve', // Can approve team member requests (when LM unavailable)
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * Project Manager: Project-specific management
     */
    protected function assignProjectManagerPermissions(): void
    {
        $role = Role::where('name', 'Project Manager')->first();
        $role->givePermissionTo([
            // Ticket Management (for project tickets)
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.create-on-behalf',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'projects.edit',
            'tags.view',
            
            // Time Management
            'time-entries.view',
            'time-entries.approve',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * IT Administrator: System administration and configuration
     */
    protected function assignITAdministratorPermissions(): void
    {
        $role = Role::where('name', 'IT Administrator')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            
            // IT Configuration
            'users.view',
            'users.create',
            'users.edit',
            'departments.view',
            'departments.edit',
            'categories.view',
            'categories.edit',
            'projects.view',
            'tags.view',
            'tags.edit',
            'custom-fields.view',
            'custom-fields.create',
            'custom-fields.edit',
            'automation-rules.view',
            'automation-rules.create',
            'automation-rules.edit',
            'escalation-rules.view',
            'escalation-rules.create',
            'escalation-rules.edit',
            'email-templates.view',
            'email-templates.create',
            'email-templates.edit',
            'sla-policies.view',
            'sla-policies.create',
            'sla-policies.edit',
            'canned-responses.view',
            'canned-responses.create',
            'canned-responses.edit',
            'ticket-templates.view',
            'ticket-templates.create',
            'ticket-templates.edit',
            
            // Time Management
            'time-entries.view',
            'time-entries.create',
            'time-entries.edit',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'knowledge-base.create',
            'knowledge-base.edit',
            'reports.view',
        ]);
    }

    /**
     * Senior Agent: Experienced support agent with additional permissions
     */
    protected function assignSeniorAgentPermissions(): void
    {
        $role = Role::where('name', 'Senior Agent')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign', // Can assign tickets
            'tickets.resolve',
            'tickets.close',
            
            // Resource Viewing
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            'canned-responses.view',
            'canned-responses.create',
            'canned-responses.edit',
            'ticket-templates.view',
            'ticket-templates.create',
            'ticket-templates.edit',
            
            // Time Tracking
            'time-entries.view',
            'time-entries.create',
            'time-entries.edit',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'knowledge-base.create',
            'knowledge-base.edit',
            'reports.view',
        ]);
    }

    /**
     * Agent: Support staff handling tickets
     */
    protected function assignAgentPermissions(): void
    {
        $role = Role::where('name', 'Agent')->first();
        $role->givePermissionTo([
            // Ticket Management (limited)
            'tickets.view',      // Can view tickets assigned to them or their team
            'tickets.create',    // Can create tickets
            'tickets.edit',      // Can edit tickets
            'tickets.resolve',   // Can resolve tickets
            'tickets.close',     // Can close tickets
            // Note: Agents do NOT have 'tickets.assign' - they can only see tickets assigned to them or their team
            
            // Resource Viewing (own department)
            'departments.view',   // Can view their own department
            
            // Time Tracking
            'time-entries.view',
            'time-entries.create',
            'time-entries.edit',
            
            // Knowledge & Reports
            'knowledge-base.view',
            'reports.view',
        ]);
    }

    /**
     * Requester: Regular users submitting tickets
     */
    protected function assignRequesterPermissions(): void
    {
        $role = Role::where('name', 'Requester')->first();
        $role->givePermissionTo([
            // Ticket Management (minimal)
            'tickets.view',      // Can view their own tickets
            'tickets.create',    // Can create tickets
            'tickets.edit',      // Can edit their own open tickets
            
            // Resource Viewing (own department)
            'departments.view',   // Can view their own department
            
            // Knowledge Base
            'knowledge-base.view',
        ]);
    }

    /**
     * Contractor: External contractor with limited access
     */
    protected function assignContractorPermissions(): void
    {
        $role = Role::where('name', 'Contractor')->first();
        $role->givePermissionTo([
            // Ticket Management (very limited)
            'tickets.view',      // Can view tickets assigned to them
            'tickets.create',    // Can create tickets
            'tickets.edit',      // Can edit tickets assigned to them
            'tickets.resolve',   // Can resolve tickets assigned to them
            
            // Resource Viewing (own department)
            'departments.view',   // Can view their own department
            
            // Time Tracking
            'time-entries.view',
            'time-entries.create',
            'time-entries.edit',
            
            // Knowledge Base
            'knowledge-base.view',
        ]);
    }
}
