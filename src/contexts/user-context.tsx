'use client';

import { useUser, useOrganization } from '@clerk/nextjs';
import { createContext, useContext, ReactNode } from 'react';
import type { OrganizationMembership } from '@clerk/nextjs/server';

// Church role types
export type ChurchRole = 'Admin' | 'Pastor' | 'Organization Manager' | 'Ministry Leader' | 'Member';

// Extended user session data interface
export interface UserSessionData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  emailAddress: string;
  imageUrl: string;
  publicMetadata: Record<string, any>;
  organizationMemberships: OrganizationMembership[] | undefined;
}

// Extended organization data interface
export interface OrganizationSessionData {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string;
  membersCount: number | undefined;
  createdAt: Date;
  publicMetadata: Record<string, any>;
}

// User context interface with proper TypeScript types
export interface UserContextType {
  user: ReturnType<typeof useUser>['user'];
  organization: ReturnType<typeof useOrganization>['organization'];
  userRole: ChurchRole | null;
  isLoading: boolean;
  isSignedIn: boolean;
  // Computed helper properties
  userDisplayName: string | null;
  organizationDisplayName: string | null;
  isAdmin: boolean;
  isPastor: boolean;
  isOrganizationManager: boolean;
  isMinistryLeader: boolean;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  // Helper function to determine user role
  const getUserRole = (): ChurchRole | null => {
    if (!user || !organization) return null;
    
    // Check organization membership role
    const membership = user.organizationMemberships?.find(
      (membership) => membership.organization?.id === organization.id
    );
    
    if (!membership) return null;
    
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

  // Helper function to get role from user metadata (for custom roles)
  const getUserRoleFromMetadata = (): ChurchRole | null => {
    if (!user?.publicMetadata) return null;
    
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

  // Computed helper values
  const userRole = getUserRole();
  const userDisplayName = user?.fullName || user?.firstName || null;
  const organizationDisplayName = organization?.name || null;

  const contextValue: UserContextType = {
    user,
    organization,
    userRole,
    isLoading: !userLoaded || !orgLoaded,
    isSignedIn: !!isSignedIn,
    // Computed helper properties
    userDisplayName,
    organizationDisplayName,
    isAdmin: userRole === 'Admin',
    isPastor: userRole === 'Pastor',
    isOrganizationManager: userRole === 'Organization Manager',
    isMinistryLeader: userRole === 'Ministry Leader',
  };

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