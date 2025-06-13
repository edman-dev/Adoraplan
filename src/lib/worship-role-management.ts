import { createClerkClient } from '@clerk/nextjs/server';

import type { WorshipRole } from '@/features/worship/types';
import type {
  ExtendedWorshipRole,
  WorshipUserMetadata,
} from '@/lib/worship-role-utils';
import {
  createWorshipRoleMetadata,
  getWorshipRoleFromMetadata,
  mergeWorshipRoleMetadata,
  revokeWorshipRole,
} from '@/lib/worship-role-utils';

/**
 * Server-side utilities for managing worship roles in Clerk
 */

// Create clerk client instance - this should be configured with your Clerk secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Assign a worship role to a user within an organization
 */
export async function assignWorshipRole(
  userId: string,
  organizationId: string,
  role: WorshipRole,
  assignedBy: string,
  churchId?: number,
): Promise<void> {
  try {
    // Get current user metadata
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as WorshipUserMetadata;

    // Create new role metadata
    const newRoleData = createWorshipRoleMetadata(
      organizationId,
      role,
      assignedBy,
      churchId,
    );

    // Merge with existing metadata
    const updatedMetadata = mergeWorshipRoleMetadata(
      currentMetadata,
      newRoleData,
    );

    // Update user's public metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata,
    });

    // Also store the role assignment in our database for tracking
    // Note: This would typically call an API endpoint or database function
    // For now, we'll just update the metadata
  } catch (error) {
    console.error('Failed to assign worship role:', error);
    throw new Error('Failed to assign worship role');
  }
}

/**
 * Revoke a worship role from a user within an organization
 */
export async function revokeWorshipRoleFromUser(
  userId: string,
  organizationId: string,
): Promise<void> {
  try {
    // Get current user metadata
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as WorshipUserMetadata;

    // Revoke the role
    const updatedMetadata = revokeWorshipRole(currentMetadata, organizationId);

    // Update user's public metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata,
    });
  } catch (error) {
    console.error('Failed to revoke worship role:', error);
    throw new Error('Failed to revoke worship role');
  }
}

/**
 * Get a user's current worship role for an organization
 */
export async function getUserWorshipRole(
  userId: string,
  organizationId: string,
): Promise<ExtendedWorshipRole> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const metadata = user.publicMetadata as WorshipUserMetadata;

    return getWorshipRoleFromMetadata(metadata, organizationId);
  } catch (error) {
    console.error('Failed to get user worship role:', error);
    return 'member';
  }
}

/**
 * Get all users with worship roles in an organization
 */
export async function getOrganizationWorshipUsers(
  organizationId: string,
): Promise<Array<{
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
    worshipRole: ExtendedWorshipRole;
    churchId?: number;
    assignedAt?: string;
    assignedBy?: string;
  }>> {
  try {
    // Get organization members
    const organizationMemberships = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100, // Adjust as needed
    });

    const worshipUsers = [];

    for (const membership of organizationMemberships.data) {
      if (!membership.publicUserData) {
        continue;
      }

      const user = await clerkClient.users.getUser(membership.publicUserData.userId);
      const metadata = user.publicMetadata as WorshipUserMetadata;

      const worshipRole = getWorshipRoleFromMetadata(metadata, organizationId);
      const orgRoleData = metadata?.worshipRoles?.[organizationId];

      worshipUsers.push({
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        worshipRole,
        churchId: orgRoleData?.churchId,
        assignedAt: orgRoleData?.assignedAt,
        assignedBy: orgRoleData?.assignedBy,
      });
    }

    return worshipUsers;
  } catch (error) {
    console.error('Failed to get organization worship users:', error);
    return [];
  }
}

/**
 * Update a user's church assignment within their worship role
 */
export async function updateUserChurchAssignment(
  userId: string,
  organizationId: string,
  churchId: number | null,
): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as WorshipUserMetadata;

    if (!currentMetadata?.worshipRoles?.[organizationId]) {
      throw new Error('User does not have a worship role in this organization');
    }

    const updatedMetadata = {
      ...currentMetadata,
      worshipRoles: {
        ...currentMetadata.worshipRoles,
        [organizationId]: {
          ...currentMetadata.worshipRoles[organizationId],
          churchId: churchId || undefined,
        },
      },
    };

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata,
    });
  } catch (error) {
    console.error('Failed to update user church assignment:', error);
    throw new Error('Failed to update user church assignment');
  }
}

/**
 * Bulk assign worship roles to multiple users
 */
export async function bulkAssignWorshipRoles(
  assignments: Array<{
    userId: string;
    role: WorshipRole;
    churchId?: number;
  }>,
  organizationId: string,
  assignedBy: string,
): Promise<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
  }> {
  const successful: string[] = [];
  const failed: Array<{ userId: string; error: string }> = [];

  for (const assignment of assignments) {
    try {
      await assignWorshipRole(
        assignment.userId,
        organizationId,
        assignment.role,
        assignedBy,
        assignment.churchId,
      );
      successful.push(assignment.userId);
    } catch (error) {
      failed.push({
        userId: assignment.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { successful, failed };
}

/**
 * Get worship role statistics for an organization
 */
export async function getWorshipRoleStatistics(
  organizationId: string,
): Promise<{
    totalUsers: number;
    roleDistribution: Record<ExtendedWorshipRole, number>;
    activeRoles: number;
    recentAssignments: number; // Last 30 days
  }> {
  try {
    const users = await getOrganizationWorshipUsers(organizationId);

    const roleDistribution: Record<ExtendedWorshipRole, number> = {
      admin: 0,
      pastor: 0,
      worship_leader: 0,
      collaborator: 0,
      member: 0,
    };

    let activeRoles = 0;
    let recentAssignments = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const user of users) {
      roleDistribution[user.worshipRole]++;

      if (user.worshipRole !== 'member') {
        activeRoles++;
      }

      if (user.assignedAt && new Date(user.assignedAt) > thirtyDaysAgo) {
        recentAssignments++;
      }
    }

    return {
      totalUsers: users.length,
      roleDistribution,
      activeRoles,
      recentAssignments,
    };
  } catch (error) {
    console.error('Failed to get worship role statistics:', error);
    return {
      totalUsers: 0,
      roleDistribution: {
        admin: 0,
        pastor: 0,
        worship_leader: 0,
        collaborator: 0,
        member: 0,
      },
      activeRoles: 0,
      recentAssignments: 0,
    };
  }
}
