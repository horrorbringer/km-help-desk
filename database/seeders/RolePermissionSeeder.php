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
     */
    protected function createRoles(): void
    {
        $roles = [
            'Super Admin',
            'Head of Department',
            'Director',
            'Line Manager',
            'Manager',
            'Agent',
            'Requester',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }
    }

    /**
     * Step 3: Assign permissions to roles
     */
    protected function assignPermissionsToRoles(): void
    {
        // Super Admin - Full access to everything
        $this->assignSuperAdminPermissions();

        // Head of Department - Organization-level approval authority
        $this->assignHODPermissions();

        // Director - Similar to HOD, organization-level
        $this->assignDirectorPermissions();

        // Line Manager - First-level approval authority
        $this->assignLineManagerPermissions();

        // Manager - Department management
        $this->assignManagerPermissions();

        // Agent - Support staff
        $this->assignAgentPermissions();

        // Requester - Regular users
        $this->assignRequesterPermissions();
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
     * Head of Department: Organization-level approval and management
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
     * Director: Organization-level (similar to HOD)
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
     * Line Manager: First-level approval authority
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
     * Manager: Department management and ticket assignment
     */
    protected function assignManagerPermissions(): void
    {
        $role = Role::where('name', 'Manager')->first();
        $role->givePermissionTo([
            // Ticket Management
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            // Note: Managers do NOT have auto-approve - they need to go through approval workflow
            
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
            
            // Knowledge Base
            'knowledge-base.view',
        ]);
    }
}
