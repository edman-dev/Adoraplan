import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { revokePendingInvitation } from '@/lib/worship-user-management';
import { withWorshipAuth } from '@/middleware/worship-auth';

type RouteParams = {
  params: {
    invitationId: string;
  };
};

/**
 * DELETE /api/worship/invitations/[invitationId]
 * Revoke a pending invitation
 */
async function handleRevokeInvitation(request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 },
      );
    }

    const result = await revokePendingInvitation(organizationId, invitationId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    console.error('Failed to revoke invitation:', error);
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 },
    );
  }
}

// Apply worship auth middleware
export const DELETE = withWorshipAuth(handleRevokeInvitation, {
  permission: 'canInviteUsers',
});
