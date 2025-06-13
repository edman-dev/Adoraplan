/* eslint-disable jsx-a11y/aria-role */
'use client';

import type { ReactNode } from 'react';

import { useWorshipAuth } from '@/hooks/use-worship-auth';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import type { WorshipRoutePermission } from '@/middleware/worship-auth';

/**
 * Component-level access control utilities for worship features
 * Provides conditional rendering based on user permissions and roles
 */

export type AccessControlProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export type PermissionGuardProps = AccessControlProps & {
  permission: WorshipRoutePermission;
  requireAll?: boolean; // For multiple permissions
};

export type RoleGuardProps = AccessControlProps & {
  role: ExtendedWorshipRole;
  exact?: boolean; // Require exact role match vs minimum role
};

export type MultiPermissionGuardProps = AccessControlProps & {
  permissions: WorshipRoutePermission[];
  requireAll?: boolean; // true = AND logic, false = OR logic
};

export type MultiRoleGuardProps = AccessControlProps & {
  roles: ExtendedWorshipRole[];
  requireAll?: boolean; // true = AND logic, false = OR logic
};

/**
 * Guard component that renders children only if user has required permission
 */
export function PermissionGuard({
  children,
  permission,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = useWorshipAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard component that renders children only if user has required role level
 */
export function RoleGuard({
  children,
  role,
  exact = false,
  fallback = null,
}: RoleGuardProps) {
  const { worshipRole, hasMinimumRole } = useWorshipAuth();

  const hasAccess = exact
    ? worshipRole === role
    : hasMinimumRole(role);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard component that renders children based on multiple permission requirements
 */
export function MultiPermissionGuard({
  children,
  permissions,
  requireAll = true,
  fallback = null,
}: MultiPermissionGuardProps) {
  const { hasPermission } = useWorshipAuth();

  const hasAccess = requireAll
    ? permissions.every(permission => hasPermission(permission))
    : permissions.some(permission => hasPermission(permission));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard component that renders children based on multiple role requirements
 */
export function MultiRoleGuard({
  children,
  roles,
  requireAll = false,
  fallback = null,
}: MultiRoleGuardProps) {
  const { hasMinimumRole } = useWorshipAuth();

  const hasAccess = requireAll
    ? roles.every(role => hasMinimumRole(role))
    : roles.some(role => hasMinimumRole(role));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard component that renders children only if user is authenticated
 */
export function AuthGuard({ children, fallback = null }: AccessControlProps) {
  const { isAuthenticated, isLoading } = useWorshipAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard component that renders children only if user has an organization
 */
export function OrganizationGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  const { hasOrganization, isLoading } = useWorshipAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!hasOrganization) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Combined guard that checks authentication and organization membership
 */
export function WorshipGuard({ children, fallback = null }: AccessControlProps) {
  const { isAuthenticated, hasOrganization, isLoading } = useWorshipAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated || !hasOrganization) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Admin-only guard for administrative features
 */
export function AdminGuard({ children, fallback = null }: AccessControlProps) {
  return (
    <RoleGuard role="admin" exact fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Pastor or higher guard for pastoral oversight features
 */
export function PastorGuard({ children, fallback = null }: AccessControlProps) {
  return (
    <RoleGuard role="pastor" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Worship Leader or higher guard for worship planning features
 */
export function WorshipLeaderGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  return (
    <RoleGuard role="worship_leader" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Collaborator or higher guard for content creation features
 */
export function CollaboratorGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  return (
    <RoleGuard role="collaborator" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Church management guard - requires church management permission
 */
export function ChurchManagementGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  return (
    <PermissionGuard permission="canManageChurch" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Hymn creation guard - requires hymn creation permission
 */
export function HymnCreationGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  return (
    <PermissionGuard permission="canCreateHymn" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Program creation guard - requires program creation permission
 */
export function ProgramCreationGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  return (
    <PermissionGuard permission="canCreateProgram" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * User management guard - requires user invitation permission
 */
export function UserManagementGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  return (
    <PermissionGuard permission="canInviteUsers" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Generic access control component that can check roles or permissions
 */
export type AccessControlGenericProps = AccessControlProps & {
  requiredRole?: ExtendedWorshipRole;
  requiredPermission?: WorshipRoutePermission;
};

export function AccessControl({
  children,
  fallback = null,
  requiredRole,
  requiredPermission,
}: AccessControlGenericProps) {
  if (requiredRole) {
    return (
      <RoleGuard requiredRole={requiredRole} fallback={fallback}>
        {children}
      </RoleGuard>
    );
  }

  if (requiredPermission) {
    return (
      <PermissionGuard permission={requiredPermission} fallback={fallback}>
        {children}
      </PermissionGuard>
    );
  }

  // If no requirements specified, just render children
  return <>{children}</>;
}

/**
 * Hymn library guard - requires view hymns permission
 */
export function HymnLibraryGuard({
  children,
  fallback = null,
}: AccessControlProps) {
  return (
    <PermissionGuard permission="canViewHymns" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
