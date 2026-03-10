import { useMemo } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { modulePermissions, type ModulePermissions } from '@/config/permissions';

/**
 * Hook to get permission checks for a specific module
 * 
 * Usage:
 *   const { canView, canCreate, canEdit, canDelete, canCustom } = useModulePermissions('approval-levels');
 *   
 *   // In JSX:
 *   {canCreate && <Button>Create</Button>}
 *   {canEdit && <Button>Edit</Button>}
 *   {canDelete && <Button>Delete</Button>}
 *   
 *   // For custom actions:
 *   {canCustom('toggleStatus') && <Button>Toggle</Button>}
 */
export function useModulePermissions(moduleId: string) {
    const { can, hasRole } = usePermissions();

    const moduleConfig = modulePermissions[moduleId];

    /**
     * Check if user can perform an action based on module permission config
     */
    const checkAction = useMemo(() => {
        return (action: ModulePermissions['view']): boolean => {
            if (!action) return false;

            // Empty permission string = no permission required
            if (action.permission === '') return true;

            // Check if user has the required permission
            if (can(action.permission)) return true;

            // Check if user has one of the bypass roles
            if (action.roles && action.roles.some((role) => hasRole(role))) {
                return true;
            }

            return false;
        };
    }, [can, hasRole]);

    const canView = useMemo(() => {
        if (!moduleConfig) return false;
        return checkAction(moduleConfig.view);
    }, [moduleConfig, checkAction]);

    const canCreate = useMemo(() => {
        if (!moduleConfig) return false;
        return checkAction(moduleConfig.create);
    }, [moduleConfig, checkAction]);

    const canEdit = useMemo(() => {
        if (!moduleConfig) return false;
        return checkAction(moduleConfig.edit);
    }, [moduleConfig, checkAction]);

    const canDelete = useMemo(() => {
        if (!moduleConfig) return false;
        return checkAction(moduleConfig.delete);
    }, [moduleConfig, checkAction]);

    /**
     * Check custom action permission
     */
    const canCustom = useMemo(() => {
        return (actionName: string): boolean => {
            if (!moduleConfig?.custom) return false;
            const action = moduleConfig.custom[actionName];
            return checkAction(action);
        };
    }, [moduleConfig, checkAction]);

    return {
        /** Whether user can view/list items in this module */
        canView,
        /** Whether user can create new items */
        canCreate,
        /** Whether user can edit/update items */
        canEdit,
        /** Whether user can delete items */
        canDelete,
        /** Check custom action permission by name */
        canCustom,
        /** The module configuration (if you need raw access) */
        moduleConfig,
        /** Module name (human readable) */
        moduleName: moduleConfig?.name ?? moduleId,
    };
}
