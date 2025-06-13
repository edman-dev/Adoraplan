'use client';

import { useCallback, useMemo } from 'react';

import { useUserContext } from '@/contexts/user-context';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import type { WorshipRoutePermission } from '@/middleware/worship-auth';

/**
 * Client-side hook for worship authentication and permissions
 */

export type UseWorshipAuthResult = {
  // Authentication state
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOrganization: boolean;

  // User info
  userId: string | null;
  organizationId: string | null;
  worshipRole: ExtendedWorshipRole;

  // Permission checking functions
  hasPermission: (permission: WorshipRoutePermission) => boolean;
  hasMinimumRole: (role: ExtendedWorshipRole) => boolean;

  // Convenience permission checks
  canCreateChurch: boolean;
  canManageChurch: boolean;
  canDeleteChurch: boolean;
  canCreateMinistry: boolean;
  canManageMinistry: boolean;
  canDeleteMinistry: boolean;
  canCreateHymn: boolean;
  canEditHymn: boolean;
  canApproveHymn: boolean;
  canDeleteHymn: boolean;
  canCreateProgram: boolean;
  canEditProgram: boolean;
  canApproveProgram: boolean;
  canDeleteProgram: boolean;
  canCreateEvent: boolean;
  canEditEvent: boolean;
  canDeleteEvent: boolean;
  canInviteUsers: boolean;
  canAssignRoles: boolean;
  canRemoveUsers: boolean;
  canViewAllFeedback: boolean;
  canResolveFeedback: boolean;
  canManageSubscription: boolean;
  canViewUsageStats: boolean;

  // Role checks
  isWorshipAdmin: boolean;
  isWorshipPastor: boolean;
  isWorshipLeader: boolean;
  isWorshipCollaborator: boolean;
  isWorshipMember: boolean;
};

export function useWorshipAuth(): UseWorshipAuthResult {
  const {
    isLoading,
    isSignedIn,
    user,
    organization,
    worshipRole,
    permissions,
    isWorshipAdmin,
    isWorshipPastor,
    isWorshipLeader,
    isWorshipCollaborator,
  } = useUserContext();

  // Basic authentication state
  const isAuthenticated = isSignedIn && !!user;
  const hasOrganization = !!organization;
  const userId = user?.id || null;
  const organizationId = organization?.id || null;

  // Permission checking function
  const hasPermission = useCallback((permission: WorshipRoutePermission): boolean => {
    return permissions[permission] || false;
  }, [permissions]);

  // Role checking function
  const hasMinimumRole = useCallback((role: ExtendedWorshipRole): boolean => {
    const roleHierarchy: Record<ExtendedWorshipRole, number> = {
      admin: 100,
      pastor: 80,
      worship_leader: 60,
      collaborator: 40,
      member: 20,
    };

    const userLevel = roleHierarchy[worshipRole];
    const requiredLevel = roleHierarchy[role];

    return userLevel >= requiredLevel;
  }, [worshipRole]);

  // Memoized permission values for performance
  const permissionValues = useMemo(() => ({
    canCreateChurch: permissions.canCreateChurch,
    canManageChurch: permissions.canManageChurch,
    canDeleteChurch: permissions.canDeleteChurch,
    canCreateMinistry: permissions.canCreateMinistry,
    canManageMinistry: permissions.canManageMinistry,
    canDeleteMinistry: permissions.canDeleteMinistry,
    canCreateHymn: permissions.canCreateHymn,
    canEditHymn: permissions.canEditHymn,
    canApproveHymn: permissions.canApproveHymn,
    canDeleteHymn: permissions.canDeleteHymn,
    canCreateProgram: permissions.canCreateProgram,
    canEditProgram: permissions.canEditProgram,
    canApproveProgram: permissions.canApproveProgram,
    canDeleteProgram: permissions.canDeleteProgram,
    canCreateEvent: permissions.canCreateEvent,
    canEditEvent: permissions.canEditEvent,
    canDeleteEvent: permissions.canDeleteEvent,
    canInviteUsers: permissions.canInviteUsers,
    canAssignRoles: permissions.canAssignRoles,
    canRemoveUsers: permissions.canRemoveUsers,
    canViewAllFeedback: permissions.canViewAllFeedback,
    canResolveFeedback: permissions.canResolveFeedback,
    canManageSubscription: permissions.canManageSubscription,
    canViewUsageStats: permissions.canViewUsageStats,
  }), [permissions]);

  return {
    // Authentication state
    isLoading,
    isAuthenticated,
    hasOrganization,

    // User info
    userId,
    organizationId,
    worshipRole,

    // Permission checking functions
    hasPermission,
    hasMinimumRole,

    // Convenience permission checks
    ...permissionValues,

    // Role checks
    isWorshipAdmin,
    isWorshipPastor,
    isWorshipLeader,
    isWorshipCollaborator,
    isWorshipMember: worshipRole === 'member',
  };
}

/**
 * Hook for checking if user has specific worship permission
 */
export function useWorshipPermission(permission: WorshipRoutePermission): boolean {
  const { hasPermission } = useWorshipAuth();
  return hasPermission(permission);
}

/**
 * Hook for checking if user has minimum worship role
 */
export function useWorshipRole(minimumRole: ExtendedWorshipRole): boolean {
  const { hasMinimumRole } = useWorshipAuth();
  return hasMinimumRole(minimumRole);
}

/**
 * Hook that returns only if user is authenticated and has organization
 */
export function useRequireWorshipAuth(): Omit<UseWorshipAuthResult, 'isLoading' | 'isAuthenticated' | 'hasOrganization'> | null {
  const authResult = useWorshipAuth();

  if (authResult.isLoading || !authResult.isAuthenticated || !authResult.hasOrganization) {
    return null;
  }

  return authResult;
}

/**
 * Convenience hooks for common role checks
 */
export const useWorshipRoles = {
  useIsAdmin: () => useWorshipRole('admin'),
  useIsPastor: () => useWorshipRole('pastor'),
  useIsWorshipLeader: () => useWorshipRole('worship_leader'),
  useIsCollaborator: () => useWorshipRole('collaborator'),
};

/**
 * Convenience hooks for common permission checks
 */
export const useWorshipPermissions = {
  useCanCreateChurch: () => useWorshipPermission('canCreateChurch'),
  useCanManageChurch: () => useWorshipPermission('canManageChurch'),
  useCanCreateMinistry: () => useWorshipPermission('canCreateMinistry'),
  useCanManageMinistry: () => useWorshipPermission('canManageMinistry'),
  useCanCreateHymn: () => useWorshipPermission('canCreateHymn'),
  useCanEditHymn: () => useWorshipPermission('canEditHymn'),
  useCanApproveHymn: () => useWorshipPermission('canApproveHymn'),
  useCanCreateProgram: () => useWorshipPermission('canCreateProgram'),
  useCanEditProgram: () => useWorshipPermission('canEditProgram'),
  useCanApproveProgram: () => useWorshipPermission('canApproveProgram'),
  useCanCreateEvent: () => useWorshipPermission('canCreateEvent'),
  useCanEditEvent: () => useWorshipPermission('canEditEvent'),
  useCanInviteUsers: () => useWorshipPermission('canInviteUsers'),
  useCanAssignRoles: () => useWorshipPermission('canAssignRoles'),
  useCanManageSubscription: () => useWorshipPermission('canManageSubscription'),
};
