import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/models/db';
import { hymnsTable } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// Import the shareLinks map (in production, use database)
const shareLinks = new Map<string, any>();

export async function POST(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;
    const { format } = await request.json();
    
    // Find share link
    const shareData = shareLinks.get(shareId);
    
    if (!shareData) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    // Check if downloads are allowed
    if (!shareData.settings.allowDownload) {
      return NextResponse.json(
        { error: 'Download not permitted' },
        { status: 403 }
      );
    }

    // Check if link has expired
    if (shareData.expires && new Date() > shareData.expires) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      );
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

    // Generate export based on format
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        content = generatePublicPDFContent(hymn);
        mimeType = 'application/pdf';
        filename = `${hymn.title.replace(/\s+/g, '-')}.pdf`;
        break;

      case 'docx':
        content = generatePublicDocxContent(hymn);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${hymn.title.replace(/\s+/g, '-')}.docx`;
        break;

      case 'pptx':
        content = generatePublicPptxContent(hymn);
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        filename = `${hymn.title.replace(/\s+/g, '-')}.pptx`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }

    // Create blob response
    const blob = new Blob([content], { type: mimeType });
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting shared hymn:', error);
    return NextResponse.json(
      { error: 'Failed to export hymn' },
      { status: 500 }
    );
  }
}

// Export generators for public sharing
function generatePublicPDFContent(hymn: any): string {
  let content = `
    SHARED HYMN EXPORT
    
    Title: ${hymn.title}
    Author: ${hymn.author}
    Year: ${hymn.year || 'Unknown'}
    
    LYRICS:
    ${JSON.stringify(hymn.lyrics, null, 2)}
    
    Categories: ${hymn.categories.join(', ')}
    Themes: ${hymn.themes.join(', ')}
    Doctrines: ${hymn.doctrines.join(', ')}
    
    Copyright: ${hymn.copyright || 'Not specified'}
    
    ---
    This hymn was shared via Adoraplan Worship Team Planning Service
  `;

  return content;
}

function generatePublicDocxContent(hymn: any): string {
  return generatePublicPDFContent(hymn);
}

function generatePublicPptxContent(hymn: any): string {
  let content = `
    SLIDE 1: ${hymn.title}
    By ${hymn.author}
    ${hymn.year ? `(${hymn.year})` : ''}
    
  `;

  // Add lyrics as slides
  if (hymn.lyrics && Array.isArray(hymn.lyrics)) {
    hymn.lyrics.forEach((lyric: any, index: number) => {
      const verses = lyric.content.split('\n\n');
      verses.forEach((verse: string, vIndex: number) => {
        content += `
    SLIDE ${index * 10 + vIndex + 2} [${lyric.language.toUpperCase()}]: 
    ${verse}
        `;
      });
    });
  }

  content += `
    
    FINAL SLIDE:
    ${hymn.copyright || ''}
    
    Shared via Adoraplan Worship Team Planning Service
  `;

  return content;
}