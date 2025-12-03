<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
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
            'tickets' => ['view', 'create', 'edit', 'delete', 'assign', 'resolve', 'close', 'auto-approve'],
            
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
     * Step 2: Create all system roles
     * Organized by hierarchy: Executive → Management → Operations → Support → Users
     */
    protected function createRoles(): void
    {
        $roles = [
            // Executive Level
            'Super Admin',           // Full system access
            'CEO',                   // Chief Executive Officer
            'Director',              // Department Director
            'Head of Department',    // HOD - Department head with approval authority
            
            // Management Level
            'IT Manager',            // IT Department Manager
            'Operations Manager',     // Operations/Field Manager
            'Finance Manager',       // Finance Department Manager
            'HR Manager',            // Human Resources Manager
            'Procurement Manager',   // Procurement/Purchasing Manager
            'Safety Manager',        // Health & Safety Manager
            'Line Manager',          // Team Lead/Line Manager (first-level approval)
            'Project Manager',       // Project-specific manager
            
            // Operations Level
            'IT Administrator',       // IT Admin with system access
            'Senior Agent',          // Senior support agent
            'Agent',                 // Support agent
            
            // User Level
            'Requester',             // Regular user submitting tickets
            'Contractor',            // External contractor (limited access)
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
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

        // Management Level
        $this->assignITManagerPermissions();
        $this->assignOperationsManagerPermissions();
        $this->assignFinanceManagerPermissions();
        $this->assignHRManagerPermissions();
        $this->assignProcurementManagerPermissions();
        $this->assignSafetyManagerPermissions();
        $this->assignLineManagerPermissions();
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
            
            // Time Tracking
            'time-entries.view',
            'time-entries.create',
            'time-entries.edit',
            
            // Knowledge Base
            'knowledge-base.view',
        ]);
    }
}
