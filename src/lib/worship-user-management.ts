import { clerkClient } from '@clerk/nextjs/server';

import {
  assignWorshipRole,
  getUserWorshipRole,
  revokeWorshipRole,
} from '@/lib/worship-role-management';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';

/**
 * Server-side worship user management utilities
 * Handles organization-level user management with worship-specific roles
 */

export type OrganizationMember = {
  id: string;
  userId: string;
  organizationId: string;
  firstName: string | null;
  lastName: string | null;
  emailAddress: string;
  imageUrl: string;
  role: string; // Clerk organization role
  worshipRole: ExtendedWorshipRole;
  joinedAt: Date;
  invitedAt?: Date;
  status: 'active' | 'invited' | 'revoked';
};

export type InviteUserData = {
  emailAddress: string;
  worshipRole: ExtendedWorshipRole;
  redirectUrl?: string;
};

export type UpdateUserRoleData = {
  userId: string;
  newWorshipRole: ExtendedWorshipRole;
  assignedBy: string;
};

/**
 * Get all organization members with their worship roles
 */
export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  try {
    const clerk = await clerkClient();

    // Get organization memberships from Clerk
    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100, // Adjust as needed
    });

    const members: OrganizationMember[] = await Promise.all(
      memberships.data.map(async (membership) => {
        const user = membership.publicUserData;

        // Get worship role for this user
        const worshipRole = await getUserWorshipRole(
          membership.publicUserData.userId,
          organizationId,
        );

        return {
          id: membership.id,
          userId: user.userId,
          organizationId,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddress: user.identifier,
          imageUrl: user.imageUrl,
          role: membership.role,
          worshipRole,
          joinedAt: new Date(membership.createdAt),
          status: 'active',
        };
      }),
    );

    // Get pending invitations
    const invitations = await clerk.organizations.getOrganizationInvitationList({
      organizationId,
      status: ['pending'],
    });

    const pendingMembers: OrganizationMember[] = invitations.data.map(invitation => ({
      id: invitation.id,
      userId: '', // No user ID for pending invitations
      organizationId,
      firstName: null,
      lastName: null,
      emailAddress: invitation.emailAddress,
      imageUrl: '',
      role: invitation.role,
      worshipRole: 'member' as ExtendedWorshipRole, // Default role for pending invitations
      joinedAt: new Date(invitation.createdAt),
      invitedAt: new Date(invitation.createdAt),
      status: 'invited',
    }));

    return [...members, ...pendingMembers];
  } catch (error) {
    console.error('Failed to get organization members:', error);
    throw new Error('Failed to retrieve organization members');
  }
}

/**
 * Invite a user to the organization with a specific worship role
 */
export async function inviteUserToOrganization(
  organizationId: string,
  inviteData: InviteUserData,
  invitedBy: string,
): Promise<{ success: true; invitationId: string } | { success: false; error: string }> {
  try {
    const clerk = await clerkClient();

    // Create Clerk organization invitation
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId,
      emailAddress: inviteData.emailAddress,
      role: 'basic_member', // Start with basic Clerk role
      redirectUrl: inviteData.redirectUrl,
    });

    // Store the intended worship role in the invitation metadata
    // We'll assign the actual worship role when the user accepts the invitation
    await clerk.invitations.updateInvitation(invitation.id, {
      publicMetadata: {
        intendedWorshipRole: inviteData.worshipRole,
        invitedBy,
        organizationId,
      },
    });

    return {
      success: true,
      invitationId: invitation.id,
    };
  } catch (error) {
    console.error('Failed to invite user to organization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update a user's worship role within the organization
 */
export async function updateUserWorshipRole(
  organizationId: string,
  updateData: UpdateUserRoleData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Assign new worship role
    await assignWorshipRole(
      updateData.userId,
      organizationId,
      updateData.newWorshipRole,
      updateData.assignedBy,
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to update user worship role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Remove a user from the organization
 */
export async function removeUserFromOrganization(
  organizationId: string,
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const clerk = await clerkClient();

    // Remove user from organization in Clerk
    await clerk.organizations.deleteOrganizationMembership({
      organizationId,
      userId,
    });

    // Revoke worship role
    await revokeWorshipRole(userId, organizationId);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove user from organization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Revoke a pending invitation
 */
export async function revokePendingInvitation(
  organizationId: string,
  invitationId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const clerk = await clerkClient();

    await clerk.organizations.revokeOrganizationInvitation({
      organizationId,
      invitationId,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to revoke invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Process accepted invitation and assign worship role
 */
export async function processAcceptedInvitation(
  userId: string,
  organizationId: string,
): Promise<void> {
  try {
    const clerk = await clerkClient();

    // Find the invitation that was accepted by this user
    const invitations = await clerk.organizations.getOrganizationInvitationList({
      organizationId,
      status: ['accepted'],
    });

    // Find invitation for this user (we'll need to match by email)
    const user = await clerk.users.getUser(userId);
    const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

    if (!userEmail) {
      throw new Error('User email not found');
    }

    const acceptedInvitation = invitations.data.find(
      inv => inv.emailAddress === userEmail,
    );

    if (acceptedInvitation?.publicMetadata) {
      const metadata = acceptedInvitation.publicMetadata as {
        intendedWorshipRole?: ExtendedWorshipRole;
        invitedBy?: string;
      };

      if (metadata.intendedWorshipRole && metadata.invitedBy) {
        // Assign the worship role that was intended when the invitation was sent
        await assignWorshipRole(
          userId,
          organizationId,
          metadata.intendedWorshipRole,
          metadata.invitedBy,
        );
      }
    }
  } catch (error) {
    console.error('Failed to process accepted invitation:', error);
    // Don't throw here as this is called after the user has already joined
    // We'll just log the error and continue
  }
}

/**
 * Check if user can manage other users in the organization
 */
export async function canManageUsers(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  try {
    const userRole = await getUserWorshipRole(userId, organizationId);

    // Only admin and pastor roles can manage users
    return ['admin', 'pastor'].includes(userRole);
  } catch (error) {
    console.error('Failed to check user management permissions:', error);
    return false;
  }
}

/**
 * Check if user can assign specific worship role
 */
export async function canAssignRole(
  assignerId: string,
  organizationId: string,
  targetRole: ExtendedWorshipRole,
): Promise<boolean> {
  try {
    const assignerRole = await getUserWorshipRole(assignerId, organizationId);

    // Role hierarchy for assignment permissions
    const roleHierarchy: Record<ExtendedWorshipRole, number> = {
      admin: 100,
      pastor: 80,
      worship_leader: 60,
      collaborator: 40,
      member: 20,
    };

    const assignerLevel = roleHierarchy[assignerRole];
    const targetLevel = roleHierarchy[targetRole];

    // Can only assign roles at or below your own level
    // Admin can assign any role, Pastor can assign pastor and below, etc.
    return assignerLevel >= targetLevel;
  } catch (error) {
    console.error('Failed to check role assignment permissions:', error);
    return false;
  }
}
