import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/models/db';
import { organizationMembersTable } from '@/models/Schema';
import { eq, and } from 'drizzle-orm';

// Import the shareLinks map (in production, use database)
const shareLinks = new Map<string, any>();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { hymnId: string; shareId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hymnId, shareId } = params;

    // Find share link
    const shareData = shareLinks.get(shareId);
    
    if (!shareData || shareData.hymnId !== hymnId) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    // Verify user has permission to revoke
    if (shareData.createdBy !== userId) {
      // Check if user is admin
      const [membership] = await db
        .select()
        .from(organizationMembersTable)
        .where(
          and(
            eq(organizationMembersTable.organizationId, shareData.organizationId),
            eq(organizationMembersTable.userId, userId)
          )
        )
        .limit(1);

      if (!membership || (membership.role !== 'admin' && membership.role !== 'worship_leader')) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    // Delete share link
    shareLinks.delete(shareId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}