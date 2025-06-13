import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  canAssignRole,
  removeUserFromOrganization,
  updateUserWorshipRole,
} from '@/lib/worship-user-management';
import { withWorshipAuth } from '@/middleware/worship-auth';

type RouteParams = {
  params: {
    userId: string;
  };
};

/**
 * PATCH /api/worship/users/[userId]
 * Update a user's worship role
 */
async function handleUpdateUserRole(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { organizationId, newWorshipRole, assignedBy } = body;

    if (!organizationId || !newWorshipRole || !assignedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, newWorshipRole, assignedBy' },
        { status: 400 },
      );
    }

    // Validate worship role
    const validRoles = ['admin', 'pastor', 'worship_leader', 'collaborator', 'member'];
    if (!validRoles.includes(newWorshipRole)) {
      return NextResponse.json(
        { error: 'Invalid worship role' },
        { status: 400 },
      );
    }

    // Check if the assigner has permission to assign this role
    const canAssign = await canAssignRole(assignedBy, organizationId, newWorshipRole);
    if (!canAssign) {
      return NextResponse.json(
        { error: 'You do not have permission to assign this role' },
        { status: 403 },
      );
    }

    const result = await updateUserWorshipRole(organizationId, {
      userId,
      newWorshipRole,
      assignedBy,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    console.error('Failed to update user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/worship/users/[userId]
 * Remove a user from the organization
 */
async function handleRemoveUser(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 },
      );
    }

    const result = await removeUserFromOrganization(organizationId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User removed from organization successfully',
    });
  } catch (error) {
    console.error('Failed to remove user:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from organization' },
      { status: 500 },
    );
  }
}

// Apply worship auth middleware
export const PATCH = withWorshipAuth(handleUpdateUserRole, {
  permission: 'canAssignRoles',
});

export const DELETE = withWorshipAuth(handleRemoveUser, {
  permission: 'canRemoveUsers',
});
