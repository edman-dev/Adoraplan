import type { WorshipRole } from '@/features/worship/types';

// Extended worship role types that integrate with Clerk
export type ExtendedWorshipRole = WorshipRole | 'member'; // Add 'member' as base role

// Map display names for worship roles
export const WorshipRoleDisplayNames: Record<ExtendedWorshipRole, string> = {
  admin: 'Admin',
  worship_leader: 'Worship Leader',
  pastor: 'Pastor',
  collaborator: 'Collaborator',
  member: 'Member',
} as const;

// Role hierarchy for permission checking (higher numbers = more permissions)
export const WorshipRoleHierarchy: Record<ExtendedWorshipRole, number> = {
  admin: 100,
  pastor: 80,
  worship_leader: 60,
  collaborator: 40,
  member: 20,
} as const;

// Worship-specific metadata interface for Clerk user
export type WorshipUserMetadata = {
  worshipRoles?: {
    [organizationId: string]: {
      role: WorshipRole;
      churchId?: number;
      assignedBy: string;
      assignedAt: string; // ISO date string
      isActive: boolean;
    };
  };
  defaultRole?: ExtendedWorshipRole;
  // Index signature to satisfy Clerk UserPublicMetadata requirements
  [key: string]: any;
};

// Role permission checking utilities
export const WorshipRolePermissions = {
  // Church management permissions
  canViewChurches: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator', 'member'].includes(role),

  canManageChurches: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor'].includes(role),

  canCreateChurch: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor'].includes(role),

  canManageChurch: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor'].includes(role),

  canDeleteChurch: (role: ExtendedWorshipRole): boolean =>
    role === 'admin',

  // Ministry management permissions
  canViewMinistries: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator', 'member'].includes(role),

  canManageMinistries: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  canCreateMinistry: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  canManageMinistry: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  canDeleteMinistry: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor'].includes(role),

  // Hymn management permissions
  canCreateHymn: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator'].includes(role),

  canEditHymn: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator'].includes(role),

  canApproveHymn: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  canDeleteHymn: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  // Program management permissions
  canCreateProgram: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator'].includes(role),

  canEditProgram: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator'].includes(role),

  canApproveProgram: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  canDeleteProgram: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  // Event management permissions
  canCreateEvent: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator'].includes(role),

  canEditEvent: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader', 'collaborator'].includes(role),

  canDeleteEvent: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  // User management permissions
  canInviteUsers: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  canAssignRoles: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor'].includes(role),

  canRemoveUsers: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor'].includes(role),

  // Feedback and notification permissions
  canViewAllFeedback: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  canResolveFeedback: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor', 'worship_leader'].includes(role),

  // Subscription management permissions
  canManageSubscription: (role: ExtendedWorshipRole): boolean =>
    role === 'admin',

  canViewUsageStats: (role: ExtendedWorshipRole): boolean =>
    ['admin', 'pastor'].includes(role),
} as const;

/**
 * Get worship role from user metadata for a specific organization
 */
export function getWorshipRoleFromMetadata(
  userMetadata: WorshipUserMetadata | undefined,
  organizationId: string,
): ExtendedWorshipRole {
  if (!userMetadata?.worshipRoles?.[organizationId]) {
    return userMetadata?.defaultRole || 'member';
  }

  const orgRole = userMetadata.worshipRoles[organizationId];

  // Check if role is still active
  if (!orgRole.isActive) {
    return 'member';
  }

  return orgRole.role;
}

/**
 * Check if user has sufficient permissions for a given action
 */
export function hasWorshipPermission(
  userRole: ExtendedWorshipRole,
  requiredRole: ExtendedWorshipRole,
): boolean {
  const userLevel = WorshipRoleHierarchy[userRole];
  const requiredLevel = WorshipRoleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Get all available worship roles for assignment
 */
export function getAvailableWorshipRoles(
  assignerRole: ExtendedWorshipRole,
): WorshipRole[] {
  const assignerLevel = WorshipRoleHierarchy[assignerRole];

  return (Object.keys(WorshipRoleHierarchy) as ExtendedWorshipRole[])
    .filter((role) => {
      // Exclude 'member' from assignable roles (it's implicit)
      if (role === 'member') {
        return false;
      }

      // Can only assign roles at or below your level
      const roleLevel = WorshipRoleHierarchy[role];
      return roleLevel <= assignerLevel;
    }) as WorshipRole[];
}

/**
 * Create worship role metadata for updating user
 */
export function createWorshipRoleMetadata(
  organizationId: string,
  role: WorshipRole,
  assignedBy: string,
  churchId?: number,
): { worshipRoles: WorshipUserMetadata['worshipRoles'] } {
  return {
    worshipRoles: {
      [organizationId]: {
        role,
        churchId,
        assignedBy,
        assignedAt: new Date().toISOString(),
        isActive: true,
      },
    },
  };
}

/**
 * Merge new worship role metadata with existing metadata
 */
export function mergeWorshipRoleMetadata(
  existingMetadata: WorshipUserMetadata | undefined,
  newRoleData: ReturnType<typeof createWorshipRoleMetadata>,
): WorshipUserMetadata {
  return {
    ...existingMetadata,
    worshipRoles: {
      ...existingMetadata?.worshipRoles,
      ...newRoleData.worshipRoles,
    },
  };
}

/**
 * Revoke worship role for organization
 */
export function revokeWorshipRole(
  existingMetadata: WorshipUserMetadata | undefined,
  organizationId: string,
): WorshipUserMetadata {
  const updated = { ...existingMetadata };

  if (updated.worshipRoles?.[organizationId]) {
    updated.worshipRoles[organizationId] = {
      ...updated.worshipRoles[organizationId],
      isActive: false,
    };
  }

  return updated;
}

/**
 * Get user's effective worship role considering both Clerk org roles and worship metadata
 */
export function getEffectiveWorshipRole(
  clerkOrgRole: string | undefined,
  worshipMetadata: WorshipUserMetadata | undefined,
  organizationId: string,
): ExtendedWorshipRole {
  // First check worship-specific metadata
  const worshipRole = getWorshipRoleFromMetadata(worshipMetadata, organizationId);

  if (worshipRole !== 'member') {
    return worshipRole;
  }

  // Fall back to Clerk organization role mapping
  switch (clerkOrgRole) {
    case 'org:admin':
      return 'admin';
    case 'org:pastor':
      return 'pastor';
    case 'org:worship_leader':
      return 'worship_leader';
    case 'org:collaborator':
      return 'collaborator';
    default:
      return 'member';
  }
}
