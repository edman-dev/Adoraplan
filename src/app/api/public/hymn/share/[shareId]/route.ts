import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/models/db';
import { hymnsTable } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// Import the shareLinks map (in production, use database)
const shareLinks = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;
    
    // Find share link
    const shareData = shareLinks.get(shareId);
    
    if (!shareData) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (shareData.expires && new Date() > shareData.expires) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      );
    }

    // Check password if required
    if (shareData.settings.password) {
      const providedPassword = request.headers.get('X-Share-Password');
      if (!providedPassword || providedPassword !== shareData.settings.password) {
        return NextResponse.json(
          { error: 'Password required', requiresPassword: true },
          { status: 401 }
        );
      }
    }

    // Check login requirement
    if (shareData.settings.requireLogin) {
      // In a real app, check for valid session/auth token
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Login required', requiresLogin: true },
          { status: 401 }
        );
      }
    }

    // Check visibility permissions
    if (shareData.settings.visibility === 'private') {
      // Additional checks for private sharing would go here
      // For now, password protection handles this
    }

    // Fetch hymn data
    const [hymn] = await db
      .select()
      .from(hymnsTable)
      .where(eq(hymnsTable.id, shareData.hymnId))
      .limit(1);

    if (!hymn) {
      return NextResponse.json(
        { error: 'Hymn not found' },
        { status: 404 }
      );
    }

    // Increment access count
    shareData.accessCount = (shareData.accessCount || 0) + 1;

    // Prepare response data based on permissions
    const responseData = {
      id: hymn.id,
      title: hymn.title,
      author: hymn.author,
      year: hymn.year,
      copyright: hymn.copyright,
      type: hymn.hymnType,
      languages: hymn.languages,
      lyrics: hymn.lyrics,
      categories: hymn.categories,
      themes: hymn.themes,
      doctrines: hymn.doctrines,
      shareSettings: {
        visibility: shareData.settings.visibility,
        allowDownload: shareData.settings.allowDownload,
        allowCopy: shareData.settings.allowCopy,
        requireLogin: shareData.settings.requireLogin,
        expirationDate: shareData.settings.expirationDate
      }
    };

    // Include audio files if download is allowed
    if (shareData.settings.allowDownload && hymn.audioFiles) {
      responseData.audioFiles = hymn.audioFiles;
    }

    return NextResponse.json({ hymn: responseData });
  } catch (error) {
    console.error('Error fetching shared hymn:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hymn' },
      { status: 500 }
    );
  }
}