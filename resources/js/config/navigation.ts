/**
 * Navigation Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for all navigation items.
 * To add a new module, simply add a new entry to this file.
 * Permissions are automatically filtered by the navigation components.
 */

import {
    IconBell,
    IconCalendar,
    IconChartBar,
    IconDashboard,
    IconFileDescription,
    IconFileWord,
    IconFolder,
    IconHelp,
    IconMail,
    IconKey,
    IconReport,
    IconRoute,
    IconSettings,
    IconTicket,
    IconUsers,
    type Icon,
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

export interface NavItem {
    /** Unique identifier for this nav item */
    id: string;
    /** Display title */
    title: string;
    /** Route name (using Ziggy route helper) */
    routeName?: string;
    /** Direct URL (use routeName instead when possible) */
    url?: string;
    /** Icon component */
    icon?: Icon;
    /** Required permission(s) - user needs ANY of these to see the item */
    permissions?: string[];
    /** Required permission(s) - user needs ALL of these to see the item */
    requireAllPermissions?: boolean;
    /** Required role(s) - user needs ANY of these to see the item */
    roles?: string[];
    /** Child navigation items */
    items?: NavItem[];
    /** Whether this item requires advanced options to be enabled */
    requiresAdvancedOptions?: boolean;
    /** Sort order (lower = higher in list) */
    order?: number;
    /** Whether this item is disabled/hidden */
    disabled?: boolean;
    /** Badge content (e.g., notification count) */
    badge?: string | number;
}

export interface NavigationSection {
    id: string;
    title?: string;
    items: NavItem[];
    order?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a route URL from a route name
 * Falls back to '#' if route doesn't exist
 */
const safeRoute = (routeName: string): string => {
    try {
        return route(routeName);
    } catch {
        console.warn(`Route "${routeName}" not found`);
        return '#';
    }
};

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

/**
 * Main Navigation Items
 * 
 * Add new modules here! The system will automatically:
 * - Filter based on permissions
 * - Hide empty parent menus
 * - Support nested items
 */
export const navigationConfig: NavItem[] = [
    // ─────────────────────────────────────────────────────────────────────────
    // Core Items (Always visible or minimal permissions)
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'dashboard',
        title: 'Dashboard',
        routeName: 'dashboard',
        icon: IconDashboard,
        permissions: ['dashboard.view'],
        order: 0,
    },
    {
        id: 'tickets',
        title: 'Tickets',
        routeName: 'admin.tickets.index',
        icon: IconTicket,
        permissions: ['tickets.view'],
        order: 10,
    },
    {
        id: 'bookings',
        title: 'Bookings',
        routeName: 'admin.bookings.index',
        icon: IconCalendar,
        order: 20,
    },
    {
        id: 'ticket-templates',
        title: 'Ticket Templates',
        routeName: 'admin.ticket-templates.index',
        icon: IconFileWord,
        permissions: ['ticket-templates.view'],
        order: 30,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Management Section
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'management',
        title: 'Management',
        icon: IconUsers,
        order: 100,
        items: [
            {
                id: 'users',
                title: 'Users',
                routeName: 'admin.users.index',
                icon: IconUsers,
                permissions: ['users.view'],
                order: 0,
            },
            {
                id: 'roles',
                title: 'Roles & Permissions',
                routeName: 'admin.roles.index',
                icon: IconUsers,
                permissions: ['roles.view'],
                order: 10,
            },
            {
                id: 'departments',
                title: 'Departments',
                routeName: 'admin.departments.index',
                icon: IconFolder,
                permissions: ['departments.view'],
                order: 20,
            },
            {
                id: 'projects',
                title: 'Projects',
                routeName: 'admin.projects.index',
                icon: IconFolder,
                permissions: ['projects.view'],
                order: 30,
            },
            {
                id: 'software-licenses',
                title: 'Software Licenses',
                routeName: 'admin.software-licenses.index',
                icon: IconKey,
                permissions: ['software-licenses.view'],
                order: 40,
            },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration Section
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'configuration',
        title: 'Configuration',
        icon: IconSettings,
        order: 200,
        items: [
            {
                id: 'categories',
                title: 'Categories',
                routeName: 'admin.categories.index',
                icon: IconFileDescription,
                permissions: ['categories.view'],
                order: 0,
            },
            {
                id: 'canned-responses',
                title: 'Canned Responses',
                routeName: 'admin.canned-responses.index',
                icon: IconMail,
                permissions: ['canned-responses.view'],
                order: 10,
            },
            {
                id: 'email-templates',
                title: 'Email Templates',
                routeName: 'admin.email-templates.index',
                icon: IconMail,
                permissions: ['email-templates.view'],
                order: 20,
            },
            {
                id: 'workflow-templates',
                title: 'Workflow Templates',
                routeName: 'admin.workflow-templates.index',
                icon: IconRoute,
                permissions: ['workflow-templates.view'],
                order: 30,
            },
            {
                id: 'approval-levels',
                title: 'Approval Levels',
                routeName: 'admin.approval-levels.index',
                icon: IconSettings,
                permissions: ['approval-levels.view'],
                order: 40,
            },
            {
                id: 'automation-rules',
                title: 'Automation Rules',
                routeName: 'admin.automation-rules.index',
                icon: IconRoute,
                permissions: ['automation-rules.view'],
                order: 50,
            },
            {
                id: 'escalation-rules',
                title: 'Escalation Rules',
                routeName: 'admin.escalation-rules.index',
                icon: IconRoute,
                permissions: ['escalation-rules.view'],
                order: 60,
            },
            {
                id: 'custom-fields',
                title: 'Custom Fields',
                routeName: 'admin.custom-fields.index',
                icon: IconFileDescription,
                permissions: ['custom-fields.view'],
                order: 70,
            },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Content Section
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'content',
        title: 'Content',
        icon: IconHelp,
        order: 300,
        items: [
            {
                id: 'knowledge-base',
                title: 'Knowledge Base',
                routeName: 'admin.knowledge-base.index',
                icon: IconHelp,
                permissions: ['knowledge-base.view'],
                order: 0,
            },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Analytics Section
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'analytics',
        title: 'Analytics',
        icon: IconChartBar,
        order: 400,
        items: [
            {
                id: 'reports',
                title: 'Reports',
                routeName: 'admin.reports.index',
                icon: IconReport,
                permissions: ['reports.view'],
                order: 0,
            },
            {
                id: 'system-monitor',
                title: 'System Monitor',
                routeName: 'admin.system-monitor',
                icon: IconChartBar,
                permissions: ['reports.view'],
                order: 10,
            },
            {
                id: 'notifications',
                title: 'Notifications',
                routeName: 'admin.notifications.index',
                icon: IconBell,
                // No permissions = visible to all authenticated users
                order: 20,
            },
        ],
    },
];

// ============================================================================
// QUICK CREATE BUTTON CONFIGURATION
// ============================================================================

export const quickCreateConfig = {
    enabled: true,
    title: 'Quick Create Ticket',
    routeName: 'admin.tickets.create',
    permission: 'tickets.create',
};

// ============================================================================
// NAVIGATION PROCESSOR
// ============================================================================

export interface ProcessNavigationOptions {
    /** Permission checker function */
    can: (permission: string) => boolean;
    /** Whether advanced options are enabled */
    enableAdvancedOptions?: boolean;
    /** Additional disabled module IDs (from settings) */
    disabledModules?: string[];
}

/**
 * Process navigation config and filter based on permissions
 * This is the magic function that handles all the permission logic!
 */
export function processNavigation(
    items: NavItem[],
    options: ProcessNavigationOptions
): NavItem[] {
    const { can, enableAdvancedOptions = true, disabledModules = [] } = options;

    const filtered = items
        .filter((item) => {
            // Check if module is disabled
            if (item.disabled || disabledModules.includes(item.id)) {
                return false;
            }

            // Check advanced options requirement
            if (item.requiresAdvancedOptions && !enableAdvancedOptions) {
                return false;
            }

            // Check permissions
            if (item.permissions && item.permissions.length > 0) {
                if (item.requireAllPermissions) {
                    // User needs ALL permissions
                    if (!item.permissions.every((p) => can(p))) {
                        return false;
                    }
                } else {
                    // User needs ANY permission
                    if (!item.permissions.some((p) => can(p))) {
                        return false;
                    }
                }
            }

            return true;
        })
        .map((item): NavItem | null => {
            // Process nested items
            if (item.items && item.items.length > 0) {
                const filteredItems = processNavigation(item.items, options);

                // Hide parent if no children remain
                if (filteredItems.length === 0) {
                    return null;
                }

                return {
                    ...item,
                    items: filteredItems,
                    url: item.url || (item.routeName ? safeRoute(item.routeName) : undefined),
                };
            }

            return {
                ...item,
                url: item.url || (item.routeName ? safeRoute(item.routeName) : undefined),
            };
        });

    return (filtered.filter((item) => item !== null) as NavItem[]).sort(
        (a, b) => (a.order ?? 999) - (b.order ?? 999)
    );
}
