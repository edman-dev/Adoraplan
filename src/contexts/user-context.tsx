'use client';

import { useOrganization, useUser } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import type { ChurchRole } from '@/lib/user-role-utils';
import type {
  ExtendedWorshipRole,
  WorshipUserMetadata,
} from '@/lib/worship-role-utils';
import {
  getEffectiveWorshipRole,
  WorshipRolePermissions,
} from '@/lib/worship-role-utils';

// User context interface with proper TypeScript types
export type UserContextType = {
  user: ReturnType<typeof useUser>['user'];
  organization: ReturnType<typeof useOrganization>['organization'];
  userRole: ChurchRole | null;
  worshipRole: ExtendedWorshipRole;
  isLoading: boolean;
  isSignedIn: boolean;
  // Computed helper properties
  userDisplayName: string | null;
  organizationDisplayName: string | null;
  // Legacy role checks (maintained for backward compatibility)
  isAdmin: boolean;
  isPastor: boolean;
  isOrganizationManager: boolean;
  isMinistryLeader: boolean;
  // Worship-specific role checks
  isWorshipAdmin: boolean;
  isWorshipLeader: boolean;
  isWorshipPastor: boolean;
  isWorshipCollaborator: boolean;
  // Permission checks
  permissions: {
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
  };
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  // Helper function to get role from user metadata (for custom roles)
  const getUserRoleFromMetadata = (): ChurchRole | null => {
    if (!user?.publicMetadata) {
      return null;
    }

    // Check public metadata for church role
    const churchRole = user.publicMetadata.churchRole as string;

    // Map metadata roles to display names
    switch (churchRole) {
      case 'pastor':
        return 'Pastor';
      case 'organization_manager':
        return 'Organization Manager';
      case 'ministry_leader':
        return 'Ministry Leader';
      case 'admin':
        return 'Admin';
      default:
        return null;
    }
  };

  // Helper function to determine user role (legacy support)
  const getUserRole = (): ChurchRole | null => {
    if (!user || !organization) {
      return null;
    }

    // Check organization membership role
    const membership = user.organizationMemberships?.find(
      membership => membership.organization?.id === organization.id,
    );

    if (!membership) {
      return null;
    }

    // Map Clerk roles to church-specific roles
    const role = membership.role as string;
    switch (role) {
      case 'org:admin':
        return 'Admin';
      case 'org:pastor':
        return 'Pastor';
      case 'org:manager':
        return 'Organization Manager';
      case 'org:ministry_leader':
        return 'Ministry Leader';
      case 'org:member':
        return 'Member';
      default:
        // Check for custom roles using public metadata
        return getUserRoleFromMetadata() || 'Member';
    }
  };

  // Get worship-specific role from new system
  const getWorshipRole = (): ExtendedWorshipRole => {
    if (!user || !organization) {
      return 'member';
    }

    // Get current organization membership role
    const membership = user.organizationMemberships?.find(
      membership => membership.organization?.id === organization.id,
    );

    const clerkOrgRole = membership?.role as string;

    // Get worship metadata from user's public metadata
    const worshipMetadata = user.publicMetadata as WorshipUserMetadata;

    // Get effective worship role combining Clerk roles and worship metadata
    return getEffectiveWorshipRole(clerkOrgRole, worshipMetadata, organization.id);
  };

  // Computed helper values
  const userRole = getUserRole();
  const worshipRole = getWorshipRole();
  const userDisplayName = user?.fullName || user?.firstName || null;
  const organizationDisplayName = organization?.name || null;

  // Create permissions object based on worship role
  const permissions = useMemo(() => ({
    canCreateChurch: WorshipRolePermissions.canCreateChurch(worshipRole),
    canManageChurch: WorshipRolePermissions.canManageChurch(worshipRole),
    canDeleteChurch: WorshipRolePermissions.canDeleteChurch(worshipRole),
    canCreateMinistry: WorshipRolePermissions.canCreateMinistry(worshipRole),
    canManageMinistry: WorshipRolePermissions.canManageMinistry(worshipRole),
    canDeleteMinistry: WorshipRolePermissions.canDeleteMinistry(worshipRole),
    canCreateHymn: WorshipRolePermissions.canCreateHymn(worshipRole),
    canEditHymn: WorshipRolePermissions.canEditHymn(worshipRole),
    canApproveHymn: WorshipRolePermissions.canApproveHymn(worshipRole),
    canDeleteHymn: WorshipRolePermissions.canDeleteHymn(worshipRole),
    canCreateProgram: WorshipRolePermissions.canCreateProgram(worshipRole),
    canEditProgram: WorshipRolePermissions.canEditProgram(worshipRole),
    canApproveProgram: WorshipRolePermissions.canApproveProgram(worshipRole),
    canDeleteProgram: WorshipRolePermissions.canDeleteProgram(worshipRole),
    canCreateEvent: WorshipRolePermissions.canCreateEvent(worshipRole),
    canEditEvent: WorshipRolePermissions.canEditEvent(worshipRole),
    canDeleteEvent: WorshipRolePermissions.canDeleteEvent(worshipRole),
    canInviteUsers: WorshipRolePermissions.canInviteUsers(worshipRole),
    canAssignRoles: WorshipRolePermissions.canAssignRoles(worshipRole),
    canRemoveUsers: WorshipRolePermissions.canRemoveUsers(worshipRole),
    canViewAllFeedback: WorshipRolePermissions.canViewAllFeedback(worshipRole),
    canResolveFeedback: WorshipRolePermissions.canResolveFeedback(worshipRole),
    canManageSubscription: WorshipRolePermissions.canManageSubscription(worshipRole),
    canViewUsageStats: WorshipRolePermissions.canViewUsageStats(worshipRole),
  }), [worshipRole]);

  const contextValue: UserContextType = useMemo(() => ({
    user,
    organization,
    userRole,
    worshipRole,
    isLoading: !userLoaded || !orgLoaded,
    isSignedIn: !!isSignedIn,
    // Computed helper properties
    userDisplayName,
    organizationDisplayName,
    // Legacy role checks (maintained for backward compatibility)
    isAdmin: userRole === 'Admin',
    isPastor: userRole === 'Pastor',
    isOrganizationManager: userRole === 'Organization Manager',
    isMinistryLeader: userRole === 'Ministry Leader',
    // Worship-specific role checks
    isWorshipAdmin: worshipRole === 'admin',
    isWorshipLeader: worshipRole === 'worship_leader',
    isWorshipPastor: worshipRole === 'pastor',
    isWorshipCollaborator: worshipRole === 'collaborator',
    // Permission checks
    permissions,
  }), [user, organization, userRole, worshipRole, userLoaded, orgLoaded, isSignedIn, userDisplayName, organizationDisplayName, permissions]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the user context
export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
