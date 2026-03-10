/**
 * Module Permissions Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for all module permissions.
 * Each module defines its CRUD actions and required permissions.
 * 
 * Usage:
 *   import { useModulePermissions } from '@/hooks/use-module-permissions';
 *   
 *   const { canCreate, canEdit, canDelete, canView } = useModulePermissions('approval-levels');
 *   
 *   {canCreate && <Button>Create</Button>}
 *   {canEdit && <Button>Edit</Button>}
 *   {canDelete && <Button>Delete</Button>}
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ModuleAction {
    /** Permission string required for this action */
    permission: string;
    /** Optional: Additional roles that can perform this action (bypass permission check) */
    roles?: string[];
}

export interface ModulePermissions {
    /** Module identifier (matches nav config id) */
    id: string;
    /** Human-readable module name */
    name: string;
    /** Permission to view/list items */
    view?: ModuleAction;
    /** Permission to create new items */
    create?: ModuleAction;
    /** Permission to edit/update items */
    edit?: ModuleAction;
    /** Permission to delete items */
    delete?: ModuleAction;
    /** Custom actions specific to this module */
    custom?: Record<string, ModuleAction>;
}

// ============================================================================
// MODULE PERMISSIONS CONFIGURATION
// ============================================================================

/**
 * Define permissions for each module.
 * Add new modules here when you create them!
 */
export const modulePermissions: Record<string, ModulePermissions> = {
    // ─────────────────────────────────────────────────────────────────────────
    // Core Modules
    // ─────────────────────────────────────────────────────────────────────────

    'tickets': {
        id: 'tickets',
        name: 'Tickets',
        view: { permission: 'tickets.view' },
        create: { permission: 'tickets.create' },
        edit: { permission: 'tickets.edit' },
        delete: { permission: 'tickets.delete' },
        custom: {
            assign: { permission: 'tickets.assign' },
            changeStatus: { permission: 'tickets.change-status' },
            addComment: { permission: 'tickets.add-comment' },
        },
    },

    'ticket-templates': {
        id: 'ticket-templates',
        name: 'Ticket Templates',
        view: { permission: 'ticket-templates.view' },
        create: { permission: 'ticket-templates.create' },
        edit: { permission: 'ticket-templates.edit' },
        delete: { permission: 'ticket-templates.delete' },
    },

    'bookings': {
        id: 'bookings',
        name: 'Bookings',
        view: { permission: 'bookings.view' },
        create: { permission: 'bookings.create' },
        edit: { permission: 'bookings.edit' },
        delete: { permission: 'bookings.delete' },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Management Modules
    // ─────────────────────────────────────────────────────────────────────────

    'users': {
        id: 'users',
        name: 'Users',
        view: { permission: 'users.view' },
        create: { permission: 'users.create' },
        edit: { permission: 'users.edit' },
        delete: { permission: 'users.delete' },
        custom: {
            import: { permission: 'users.import' },
            export: { permission: 'users.export' },
            toggleActive: { permission: 'users.edit' }, // Same as edit
            bulkUpdate: { permission: 'users.edit' },
            bulkDelete: { permission: 'users.delete' },
        },
    },

    'roles': {
        id: 'roles',
        name: 'Roles & Permissions',
        view: { permission: 'roles.view' },
        create: { permission: 'roles.create' },
        edit: { permission: 'roles.edit' },
        delete: { permission: 'roles.delete' },
    },

    'departments': {
        id: 'departments',
        name: 'Departments',
        view: { permission: 'departments.view' },
        create: { permission: 'departments.create' },
        edit: { permission: 'departments.edit' },
        delete: { permission: 'departments.delete' },
    },

    'projects': {
        id: 'projects',
        name: 'Projects',
        view: { permission: 'projects.view' },
        create: { permission: 'projects.create' },
        edit: { permission: 'projects.edit' },
        delete: { permission: 'projects.delete' },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration Modules
    // ─────────────────────────────────────────────────────────────────────────

    'categories': {
        id: 'categories',
        name: 'Categories',
        view: { permission: 'categories.view' },
        create: { permission: 'categories.create' },
        edit: { permission: 'categories.edit' },
        delete: { permission: 'categories.delete' },
    },

    'canned-responses': {
        id: 'canned-responses',
        name: 'Canned Responses',
        view: { permission: 'canned-responses.view' },
        create: { permission: 'canned-responses.create' },
        edit: { permission: 'canned-responses.edit' },
        delete: { permission: 'canned-responses.delete' },
    },

    'email-templates': {
        id: 'email-templates',
        name: 'Email Templates',
        view: { permission: 'email-templates.view' },
        create: { permission: 'email-templates.create' },
        edit: { permission: 'email-templates.edit' },
        delete: { permission: 'email-templates.delete' },
    },

    'workflow-templates': {
        id: 'workflow-templates',
        name: 'Workflow Templates',
        view: { permission: 'workflow-templates.view' },
        create: { permission: 'workflow-templates.create' },
        edit: { permission: 'workflow-templates.edit' },
        delete: { permission: 'workflow-templates.delete' },
    },

    'approval-levels': {
        id: 'approval-levels',
        name: 'Approval Levels',
        view: { permission: 'approval-levels.view' },
        create: { permission: 'approval-levels.create' },
        edit: { permission: 'approval-levels.edit' },
        delete: { permission: 'approval-levels.delete' },
        custom: {
            toggleStatus: { permission: 'approval-levels.edit' },
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Content Modules
    // ─────────────────────────────────────────────────────────────────────────

    'knowledge-base': {
        id: 'knowledge-base',
        name: 'Knowledge Base',
        view: { permission: 'knowledge-base.view' },
        create: { permission: 'knowledge-base.create' },
        edit: { permission: 'knowledge-base.edit' },
        delete: { permission: 'knowledge-base.delete' },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Analytics Modules
    // ─────────────────────────────────────────────────────────────────────────

    'reports': {
        id: 'reports',
        name: 'Reports',
        view: { permission: 'reports.view' },
        create: { permission: 'reports.create' },
        edit: { permission: 'reports.edit' },
        delete: { permission: 'reports.delete' },
    },

    'notifications': {
        id: 'notifications',
        name: 'Notifications',
        // Notifications are accessible to all authenticated users
        view: { permission: '' }, // Empty = no permission required
        create: { permission: '' },
        edit: { permission: '' },
        delete: { permission: '' },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Additional Configuration Modules
    // ─────────────────────────────────────────────────────────────────────────

    'tags': {
        id: 'tags',
        name: 'Tags',
        view: { permission: 'tags.view' },
        create: { permission: 'tags.create' },
        edit: { permission: 'tags.edit' },
        delete: { permission: 'tags.delete' },
    },

    'custom-fields': {
        id: 'custom-fields',
        name: 'Custom Fields',
        view: { permission: 'custom-fields.view' },
        create: { permission: 'custom-fields.create' },
        edit: { permission: 'custom-fields.edit' },
        delete: { permission: 'custom-fields.delete' },
    },

    'sla-policies': {
        id: 'sla-policies',
        name: 'SLA Policies',
        view: { permission: 'sla-policies.view' },
        create: { permission: 'sla-policies.create' },
        edit: { permission: 'sla-policies.edit' },
        delete: { permission: 'sla-policies.delete' },
    },

    'automation-rules': {
        id: 'automation-rules',
        name: 'Automation Rules',
        view: { permission: 'automation-rules.view' },
        create: { permission: 'automation-rules.create' },
        edit: { permission: 'automation-rules.edit' },
        delete: { permission: 'automation-rules.delete' },
    },

    'escalation-rules': {
        id: 'escalation-rules',
        name: 'Escalation Rules',
        view: { permission: 'escalation-rules.view' },
        create: { permission: 'escalation-rules.create' },
        edit: { permission: 'escalation-rules.edit' },
        delete: { permission: 'escalation-rules.delete' },
    },

    'notification-templates': {
        id: 'notification-templates',
        name: 'Notification Templates',
        view: { permission: 'notification-templates.view' },
        create: { permission: 'notification-templates.create' },
        edit: { permission: 'notification-templates.edit' },
        delete: { permission: 'notification-templates.delete' },
    },

    'time-entries': {
        id: 'time-entries',
        name: 'Time Entries',
        view: { permission: 'time-entries.view' },
        create: { permission: 'time-entries.create' },
        edit: { permission: 'time-entries.edit' },
        delete: { permission: 'time-entries.delete' },
        custom: {
            approve: { permission: 'time-entries.approve' },
        },
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get module permissions by module ID
 */
export function getModulePermissions(moduleId: string): ModulePermissions | undefined {
    return modulePermissions[moduleId];
}

/**
 * Get all permission strings for a module (useful for seeding)
 */
export function getModulePermissionStrings(moduleId: string): string[] {
    const module = modulePermissions[moduleId];
    if (!module) return [];

    const permissions: string[] = [];

    if (module.view?.permission) permissions.push(module.view.permission);
    if (module.create?.permission) permissions.push(module.create.permission);
    if (module.edit?.permission) permissions.push(module.edit.permission);
    if (module.delete?.permission) permissions.push(module.delete.permission);

    if (module.custom) {
        Object.values(module.custom).forEach((action) => {
            if (action.permission && !permissions.includes(action.permission)) {
                permissions.push(action.permission);
            }
        });
    }

    return permissions;
}

/**
 * Get ALL permission strings from all modules (useful for seeding database)
 */
export function getAllPermissionStrings(): string[] {
    const allPermissions = new Set<string>();

    Object.keys(modulePermissions).forEach((moduleId) => {
        getModulePermissionStrings(moduleId).forEach((p) => {
            if (p) allPermissions.add(p);
        });
    });

    return Array.from(allPermissions).sort();
}
