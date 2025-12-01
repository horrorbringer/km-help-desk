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

        // Create permissions
        $permissions = [
            // Tickets
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.delete',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'tickets.auto-approve',
            
            // Users
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            
            // Departments
            'departments.view',
            'departments.create',
            'departments.edit',
            'departments.delete',
            
            // Categories
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.delete',
            
            // Projects
            'projects.view',
            'projects.create',
            'projects.edit',
            'projects.delete',
            
            // SLA Policies
            'sla-policies.view',
            'sla-policies.create',
            'sla-policies.edit',
            'sla-policies.delete',
            
            // Tags
            'tags.view',
            'tags.create',
            'tags.edit',
            'tags.delete',
            
            // Canned Responses
            'canned-responses.view',
            'canned-responses.create',
            'canned-responses.edit',
            'canned-responses.delete',
            
            // Email Templates
            'email-templates.view',
            'email-templates.create',
            'email-templates.edit',
            'email-templates.delete',
            
            // Automation Rules
            'automation-rules.view',
            'automation-rules.create',
            'automation-rules.edit',
            'automation-rules.delete',
            
            // Escalation Rules
            'escalation-rules.view',
            'escalation-rules.create',
            'escalation-rules.edit',
            'escalation-rules.delete',
            
            // Custom Fields
            'custom-fields.view',
            'custom-fields.create',
            'custom-fields.edit',
            'custom-fields.delete',
            
            // Ticket Templates
            'ticket-templates.view',
            'ticket-templates.create',
            'ticket-templates.edit',
            'ticket-templates.delete',
            
            // Time Entries
            'time-entries.view',
            'time-entries.create',
            'time-entries.edit',
            'time-entries.delete',
            'time-entries.approve',
            
            // Knowledge Base
            'knowledge-base.view',
            'knowledge-base.create',
            'knowledge-base.edit',
            'knowledge-base.delete',
            
            // Reports
            'reports.view',
            
            // Notifications
            'notifications.view',
            
            // Settings
            'settings.view',
            'settings.edit',
            
            // Roles & Permissions
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions
        $adminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        $adminRole->givePermissionTo(Permission::all());

        $agentRole = Role::firstOrCreate(['name' => 'Agent']);
        $agentRole->givePermissionTo([
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            // Note: Agents do NOT have 'tickets.assign' - they can only see tickets assigned to them or their team
            'tickets.resolve',
            'tickets.close',
            'time-entries.view',
            'time-entries.create',
            'time-entries.edit',
            'knowledge-base.view',
            'reports.view',
        ]);

        $requesterRole = Role::firstOrCreate(['name' => 'Requester']);
        $requesterRole->givePermissionTo([
            'tickets.view',
            'tickets.create',
            'knowledge-base.view',
        ]);

        $managerRole = Role::firstOrCreate(['name' => 'Manager']);
        $managerRole->givePermissionTo([
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.assign',
            'tickets.resolve',
            'tickets.close',
            'users.view',
            'departments.view',
            'categories.view',
            'projects.view',
            'tags.view',
            'time-entries.view',
            'time-entries.approve',
            'knowledge-base.view',
            'reports.view',
        ]);
    }
}
