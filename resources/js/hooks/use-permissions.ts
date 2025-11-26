import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface PageProps {
  auth: {
    user: AuthUser | null;
  };
}

/**
 * Hook to check user permissions
 * @returns Object with permission checking methods
 */
export function usePermissions() {
  const { auth } = usePage<PageProps>().props;

  const user = auth.user;

  /**
   * Check if user has a specific permission
   */
  const can = useMemo(() => {
    if (!user) return () => false;

    const permissions = new Set(user.permissions || []);
    const roles = new Set(user.roles || []);

    return (permission: string): boolean => {
      // Super Admin has all permissions
      if (roles.has('Super Admin')) {
        return true;
      }

      return permissions.has(permission);
    };
  }, [user]);

  /**
   * Check if user has any of the given permissions
   */
  const canAny = useMemo(() => {
    if (!user) return () => false;

    const permissions = new Set(user.permissions || []);
    const roles = new Set(user.roles || []);

    return (permissionList: string[]): boolean => {
      // Super Admin has all permissions
      if (roles.has('Super Admin')) {
        return true;
      }

      return permissionList.some((permission) => permissions.has(permission));
    };
  }, [user]);

  /**
   * Check if user has all of the given permissions
   */
  const canAll = useMemo(() => {
    if (!user) return () => false;

    const permissions = new Set(user.permissions || []);
    const roles = new Set(user.roles || []);

    return (permissionList: string[]): boolean => {
      // Super Admin has all permissions
      if (roles.has('Super Admin')) {
        return true;
      }

      return permissionList.every((permission) => permissions.has(permission));
    };
  }, [user]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useMemo(() => {
    if (!user) return () => false;

    const roles = new Set(user.roles || []);

    return (role: string): boolean => {
      return roles.has(role);
    };
  }, [user]);

  /**
   * Check if user has any of the given roles
   */
  const hasAnyRole = useMemo(() => {
    if (!user) return () => false;

    const roles = new Set(user.roles || []);

    return (roleList: string[]): boolean => {
      return roleList.some((role) => roles.has(role));
    };
  }, [user]);

  return {
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    user,
    isAuthenticated: !!user,
  };
}

