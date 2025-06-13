import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/models/db';
import { hymnsTable } from '@/models/Schema';
import { eq } from 'drizzle-orm';

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
    const { format, includeAudio } = await request.json();

    // Fetch hymn data
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

    // Generate export based on format
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        // In production, use a PDF generation library like puppeteer or jsPDF
        content = generatePDFContent(hymn, includeAudio);
        mimeType = 'application/pdf';
        filename = `${hymn.title.replace(/\s+/g, '-')}.pdf`;
        break;

      case 'docx':
        // In production, use a library like docx
        content = generateDocxContent(hymn, includeAudio);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${hymn.title.replace(/\s+/g, '-')}.docx`;
        break;

      case 'pptx':
        // In production, use a library like pptxgenjs
        content = generatePptxContent(hymn, includeAudio);
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
    console.error('Error exporting hymn:', error);
    return NextResponse.json(
      { error: 'Failed to export hymn' },
      { status: 500 }
    );
  }
}

// Mock export generators (in production, use proper libraries)
function generatePDFContent(hymn: any, includeAudio: boolean): string {
  // This is a mock implementation
  // In production, use a proper PDF generation library
  let content = `
    HYMN: ${hymn.title}
    Author: ${hymn.author}
    Year: ${hymn.year || 'Unknown'}
    
    LYRICS:
    ${JSON.stringify(hymn.lyrics, null, 2)}
    
    Categories: ${hymn.categories.join(', ')}
    Themes: ${hymn.themes.join(', ')}
    Doctrines: ${hymn.doctrines.join(', ')}
  `;

  if (includeAudio && hymn.audioFiles) {
    content += '\n\nAUDIO FILES:\n';
    content += JSON.stringify(hymn.audioFiles, null, 2);
  }

  return content;
}

function generateDocxContent(hymn: any, includeAudio: boolean): string {
  // Mock implementation - same as PDF for now
  return generatePDFContent(hymn, includeAudio);
}

function generatePptxContent(hymn: any, includeAudio: boolean): string {
  // Mock implementation for PowerPoint
  let content = `
    SLIDE 1: ${hymn.title}
    By ${hymn.author}
    
  `;

  // Add lyrics as slides
  if (hymn.lyrics && Array.isArray(hymn.lyrics)) {
    hymn.lyrics.forEach((lyric: any, index: number) => {
      const verses = lyric.content.split('\n\n');
      verses.forEach((verse: string, vIndex: number) => {
        content += `
    SLIDE ${index * 10 + vIndex + 2}: 
    ${verse}
        `;
      });
    });
  }

  return content;
}