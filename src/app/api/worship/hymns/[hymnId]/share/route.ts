import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/models/db';
import { organizationMembersTable, hymnsTable } from '@/models/Schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface ShareSettings {
  visibility: 'private' | 'organization' | 'public';
  allowDownload: boolean;
  allowCopy: boolean;
  allowPrint: boolean;
  requireLogin: boolean;
  expirationDate?: string;
  password?: string;
  sharedWith: string[];
  message?: string;
}

// In-memory storage for share links (in production, use database)
const shareLinks = new Map<string, {
  hymnId: string;
  organizationId: string;
  createdBy: string;
  settings: ShareSettings;
  url: string;
  shortCode: string;
  created: Date;
  expires?: Date;
  accessCount: number;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: { hymnId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hymnId } = params;

    // Find existing share link for this hymn
    let shareLink = null;
    let settings = null;

    for (const [shortCode, share] of shareLinks.entries()) {
      if (share.hymnId === hymnId) {
        shareLink = {
          url: share.url,
          shortCode: share.shortCode,
          created: share.created,
          expires: share.expires,
          accessCount: share.accessCount
        };
        settings = share.settings;
        break;
      }
    }

    return NextResponse.json({
      shareLink,
      settings
    });
  } catch (error) {
    console.error('Error fetching share link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share link' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { hymnId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hymnId } = params;
    const { organizationId, settings } = await request.json();

    // Verify user has permission to share this hymn
    const [hymn] = await db
      .select()
      .from(hymnsTable)
      .where(eq(hymnsTable.id, hymnId))
      .limit(1);

    if (!hymn) {
      return NextResponse.json(
        { error: 'Hymn not found' },
        { status: 404 }
      );
    }

    // Check if user is organization member
    const [membership] = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.organizationId, organizationId),
          eq(organizationMembersTable.userId, userId)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // Check permissions
    const canShare = 
      membership.role === 'admin' || 
      membership.role === 'worship_leader' || 
      hymn.createdBy === userId;

    if (!canShare) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Generate share link
    const shortCode = nanoid(10);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const shareUrl = `${baseUrl}/hymn/share/${shortCode}`;

    const shareData = {
      hymnId,
      organizationId,
      createdBy: userId,
      settings,
      url: shareUrl,
      shortCode,
      created: new Date(),
      expires: settings.expirationDate ? new Date(settings.expirationDate) : undefined,
      accessCount: 0
    };

    // Store share link (in production, save to database)
    shareLinks.set(shortCode, shareData);

    // Update hymn's public status if needed
    if (settings.visibility === 'public' && !hymn.isPublic) {
      await db
        .update(hymnsTable)
        .set({ isPublic: true })
        .where(eq(hymnsTable.id, hymnId));
    }

    return NextResponse.json({
      shareLink: {
        url: shareUrl,
        shortCode,
        created: shareData.created,
        expires: shareData.expires,
        accessCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { hymnId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hymnId } = params;
    const { shareId, settings } = await request.json();

    // Find and update share link
    const shareData = shareLinks.get(shareId);
    
    if (!shareData || shareData.hymnId !== hymnId) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    // Verify user has permission
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

    // Update settings
    shareData.settings = { ...shareData.settings, ...settings };
    shareData.expires = settings.expirationDate ? new Date(settings.expirationDate) : undefined;

    // Update hymn's public status if needed
    const [hymn] = await db
      .select()
      .from(hymnsTable)
      .where(eq(hymnsTable.id, hymnId))
      .limit(1);

    if (hymn && settings.visibility === 'public' && !hymn.isPublic) {
      await db
        .update(hymnsTable)
        .set({ isPublic: true })
        .where(eq(hymnsTable.id, hymnId));
    } else if (hymn && settings.visibility !== 'public' && hymn.isPublic) {
      await db
        .update(hymnsTable)
        .set({ isPublic: false })
        .where(eq(hymnsTable.id, hymnId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating share settings:', error);
    return NextResponse.json(
      { error: 'Failed to update share settings' },
      { status: 500 }
    );
  }
}