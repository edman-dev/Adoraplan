import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/models/db';
import { organizationMembersTable } from '@/models/Schema';
import { eq, and } from 'drizzle-orm';

// Import the playlists map (in production, use database)
const playlists = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { playlistId } = params;
    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this playlist
    const [membership] = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.organizationId, playlist.organizationId),
          eq(organizationMembersTable.userId, userId)
        )
      )
      .limit(1);

    if (!membership && playlist.createdBy !== userId && !playlist.isPublic) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      playlist
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { playlistId } = params;
    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Check if user can edit this playlist
    const canEdit = playlist.createdBy === userId;
    
    if (!canEdit) {
      // Check if user is admin/worship leader
      const [membership] = await db
        .select()
        .from(organizationMembersTable)
        .where(
          and(
            eq(organizationMembersTable.organizationId, playlist.organizationId),
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

    const body = await request.json();
    const {
      name,
      description,
      isPublic,
      tags,
      hymns,
      duration
    } = body;

    // Update playlist
    const updatedPlaylist = {
      ...playlist,
      name: name ?? playlist.name,
      description: description ?? playlist.description,
      isPublic: isPublic ?? playlist.isPublic,
      tags: tags ?? playlist.tags,
      hymns: hymns ?? playlist.hymns,
      duration: duration ?? playlist.duration,
      updatedAt: new Date()
    };

    playlists.set(playlistId, updatedPlaylist);

    return NextResponse.json({
      playlist: updatedPlaylist
    });
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { playlistId } = params;
    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Check if user can delete this playlist
    const canDelete = playlist.createdBy === userId;
    
    if (!canDelete) {
      // Check if user is admin
      const [membership] = await db
        .select()
        .from(organizationMembersTable)
        .where(
          and(
            eq(organizationMembersTable.organizationId, playlist.organizationId),
            eq(organizationMembersTable.userId, userId)
          )
        )
        .limit(1);

      if (!membership || membership.role !== 'admin') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    // Delete playlist
    playlists.delete(playlistId);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}