import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  getOrganizationMembers,
  inviteUserToOrganization,
} from '@/lib/worship-user-management';
import { withWorshipAuth } from '@/middleware/worship-auth';

/**
 * GET /api/worship/users
 * Get all organization members with their worship roles
 */
async function handleGetMembers(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 },
      );
    }

    const members = await getOrganizationMembers(organizationId);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Failed to get organization members:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve organization members' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/worship/users/invite
 * Invite a user to the organization with a specific worship role
 */
async function handleInviteUser(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, emailAddress, worshipRole, invitedBy } = body;

    if (!organizationId || !emailAddress || !worshipRole || !invitedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, emailAddress, worshipRole, invitedBy' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 },
      );
    }

    // Validate worship role
    const validRoles = ['admin', 'pastor', 'worship_leader', 'collaborator', 'member'];
    if (!validRoles.includes(worshipRole)) {
      return NextResponse.json(
        { error: 'Invalid worship role' },
        { status: 400 },
      );
    }

    const result = await inviteUserToOrganization(
      organizationId,
      {
        emailAddress,
        worshipRole,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
      invitedBy,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        invitationId: result.invitationId,
        message: 'Invitation sent successfully',
      },
    });
  } catch (error) {
    console.error('Failed to invite user:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 },
    );
  }
}

// Apply worship auth middleware - allow viewing for all roles, but restrict inviting
export const GET = withWorshipAuth(handleGetMembers, {
  minimumRole: 'member', // Allow all users to view member list
});

export const POST = withWorshipAuth(handleInviteUser, {
  permission: 'canInviteUsers',
});
