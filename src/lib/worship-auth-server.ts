import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getUserWorshipRole } from '@/lib/worship-role-management';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import {
  hasWorshipPermission,
  WorshipRolePermissions,
} from '@/lib/worship-role-utils';
import type { WorshipRoutePermission } from '@/middleware/worship-auth';

/**
 * Server-side worship authentication utilities for server components and actions
 */

export type WorshipAuthResult = {
  userId: string;
  orgId: string;
  userRole: ExtendedWorshipRole;
  hasPermission: (permission: WorshipRoutePermission) => boolean;
  hasMinimumRole: (role: ExtendedWorshipRole) => boolean;
};

/**
 * Require authentication and return worship auth context
 * Redirects if not authenticated or no organization
 */
export async function requireWorshipAuth(): Promise<WorshipAuthResult> {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!orgId) {
    redirect('/onboarding/organization-selection');
  }

  const userRole = await getUserWorshipRole(userId, orgId);

  return {
    userId,
    orgId,
    userRole,
    hasPermission: (permission: WorshipRoutePermission) =>
      WorshipRolePermissions[permission](userRole),
    hasMinimumRole: (role: ExtendedWorshipRole) =>
      hasWorshipPermission(userRole, role),
  };
}

/**
 * Require specific permission, redirect if not authorized
 */
export async function requireWorshipPermission(
  permission: WorshipRoutePermission,
  redirectUrl = '/dashboard?error=insufficient-permissions',
): Promise<WorshipAuthResult> {
  const authResult = await requireWorshipAuth();

  if (!authResult.hasPermission(permission)) {
    redirect(redirectUrl);
  }

  return authResult;
}

/**
 * Require minimum role level, redirect if not authorized
 */
export async function requireWorshipRole(
  minimumRole: ExtendedWorshipRole,
  redirectUrl = '/dashboard?error=insufficient-role',
): Promise<WorshipAuthResult> {
  const authResult = await requireWorshipAuth();

  if (!authResult.hasMinimumRole(minimumRole)) {
    redirect(redirectUrl);
  }

  return authResult;
}

/**
 * Check worship permission without redirecting (returns boolean)
 */
export async function checkWorshipPermission(
  permission: WorshipRoutePermission,
): Promise<boolean> {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return false;
    }

    const userRole = await getUserWorshipRole(userId, orgId);
    return WorshipRolePermissions[permission](userRole);
  } catch (error) {
    console.error('Failed to check worship permission:', error);
    return false;
  }
}

/**
 * Check minimum role without redirecting (returns boolean)
 */
export async function checkWorshipRole(
  minimumRole: ExtendedWorshipRole,
): Promise<boolean> {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return false;
    }

    const userRole = await getUserWorshipRole(userId, orgId);
    return hasWorshipPermission(userRole, minimumRole);
  } catch (error) {
    console.error('Failed to check worship role:', error);
    return false;
  }
}

/**
 * Get current user's worship context (without redirecting)
 */
export async function getWorshipAuthContext(): Promise<WorshipAuthResult | null> {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return null;
    }

    const userRole = await getUserWorshipRole(userId, orgId);

    return {
      userId,
      orgId,
      userRole,
      hasPermission: (permission: WorshipRoutePermission) =>
        WorshipRolePermissions[permission](userRole),
      hasMinimumRole: (role: ExtendedWorshipRole) =>
        hasWorshipPermission(userRole, role),
    };
  } catch (error) {
    console.error('Failed to get worship auth context:', error);
    return null;
  }
}

// Convenience functions for common permission checks

export const worshipAuth = {
  // Church management
  requireChurchManager: () => requireWorshipPermission('canManageChurch'),
  requireChurchCreator: () => requireWorshipPermission('canCreateChurch'),
  requireChurchAdmin: () => requireWorshipPermission('canDeleteChurch'),

  // Ministry management
  requireMinistryManager: () => requireWorshipPermission('canManageMinistry'),
  requireMinistryCreator: () => requireWorshipPermission('canCreateMinistry'),

  // Hymn management
  requireHymnCreator: () => requireWorshipPermission('canCreateHymn'),
  requireHymnEditor: () => requireWorshipPermission('canEditHymn'),
  requireHymnApprover: () => requireWorshipPermission('canApproveHymn'),

  // Program management
  requireProgramCreator: () => requireWorshipPermission('canCreateProgram'),
  requireProgramEditor: () => requireWorshipPermission('canEditProgram'),
  requireProgramApprover: () => requireWorshipPermission('canApproveProgram'),

  // Event management
  requireEventManager: () => requireWorshipPermission('canCreateEvent'),

  // User management
  requireUserManager: () => requireWorshipPermission('canInviteUsers'),
  requireRoleManager: () => requireWorshipPermission('canAssignRoles'),

  // Role-based requirements
  requireAdmin: () => requireWorshipRole('admin'),
  requirePastor: () => requireWorshipRole('pastor'),
  requireWorshipLeader: () => requireWorshipRole('worship_leader'),
  requireCollaborator: () => requireWorshipRole('collaborator'),

  // Non-redirecting checks
  checkChurchManager: () => checkWorshipPermission('canManageChurch'),
  checkHymnCreator: () => checkWorshipPermission('canCreateHymn'),
  checkProgramEditor: () => checkWorshipPermission('canEditProgram'),
  checkRoleManager: () => checkWorshipPermission('canAssignRoles'),
  checkAdmin: () => checkWorshipRole('admin'),
};
