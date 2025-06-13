import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/models/db';
import { organizationMembersTable } from '@/models/Schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  organizationId: string;
  isPublic: boolean;
  tags: string[];
  hymns: PlaylistHymn[];
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistHymn {
  id: string;
  hymnId: string;
  position: number;
  hymn: any;
  notes?: string;
  customTitle?: string;
  selectedLanguage?: string;
}

// In-memory storage for playlists (in production, use database)
const playlists = new Map<string, Playlist>();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user is member of organization
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

    // Get playlists for this organization
    const organizationPlaylists = Array.from(playlists.values())
      .filter(playlist => playlist.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return NextResponse.json({
      playlists: organizationPlaylists
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      organizationId,
      isPublic,
      tags,
      hymns,
      duration
    } = body;

    // Verify user is member of organization
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

    // Create new playlist
    const playlistId = nanoid();
    const now = new Date();
    
    const newPlaylist: Playlist = {
      id: playlistId,
      name,
      description,
      createdBy: userId,
      organizationId,
      isPublic: isPublic || false,
      tags: tags || [],
      hymns: hymns || [],
      duration: duration || 0,
      createdAt: now,
      updatedAt: now
    };

    // Store playlist
    playlists.set(playlistId, newPlaylist);

    return NextResponse.json({
      playlist: newPlaylist
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}