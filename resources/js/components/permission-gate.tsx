import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render content based on permissions
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions();

  // Check permissions
  if (permission) {
    if (!can(permission)) {
      return <>{fallback}</>;
    }
  }

  if (permissions) {
    if (requireAll) {
      if (!canAll(permissions)) {
        return <>{fallback}</>;
      }
    } else {
      if (!canAny(permissions)) {
        return <>{fallback}</>;
      }
    }
  }

  // Check roles
  if (role) {
    if (!hasRole(role)) {
      return <>{fallback}</>;
    }
  }

  if (roles) {
    if (!hasAnyRole(roles)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

