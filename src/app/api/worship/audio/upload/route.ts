import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withWorshipAuth } from '@/middleware/worship-auth';
import { 
  processAudioFile, 
  AudioProcessingError,
  formatFileSize,
  formatDuration
} from '@/libs/audio/AudioProcessor';

/**
 * POST /api/worship/audio/upload
 * Upload and process audio files for hymns
 */
async function handleAudioUpload(
  request: NextRequest, 
  { user, organization }: { user: any; organization: any }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const hymnId = formData.get('hymnId') as string;
    const description = formData.get('description') as string;
    const language = formData.get('language') as string || 'en';

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!hymnId) {
      return NextResponse.json(
        { error: 'Hymn ID is required' },
        { status: 400 }
      );
    }

    // Process the audio file
    const processedAudio = await processAudioFile(file, {
      compress: true,
      generateWaveform: true,
      extractMetadata: true
    });

    // In a real implementation, you would:
    // 1. Upload original and compressed files to cloud storage (S3, Cloudinary, etc.)
    // 2. Store file URLs and metadata in the database
    // 3. Generate and store waveform data
    // 4. Create thumbnail/preview if needed

    // For now, we'll return the processed information
    const response = {
      success: true,
      data: {
        id: `audio_${Date.now()}`, // Mock ID
        hymnId,
        originalFile: {
          filename: processedAudio.originalFile.originalName,
          size: processedAudio.originalFile.size,
          sizeFormatted: formatFileSize(processedAudio.originalFile.size),
          duration: processedAudio.originalFile.duration,
          durationFormatted: formatDuration(processedAudio.originalFile.duration),
          format: processedAudio.originalFile.format,
          bitrate: processedAudio.originalFile.bitrate,
          sampleRate: processedAudio.originalFile.sampleRate,
          channels: processedAudio.originalFile.channels,
          url: `https://storage.example.com/hymns/${hymnId}/original/${file.name}` // Mock URL
        },
        compressedFile: processedAudio.compressedFile ? {
          filename: processedAudio.compressedFile.filename,
          size: processedAudio.compressedFile.size,
          sizeFormatted: formatFileSize(processedAudio.compressedFile.size),
          format: processedAudio.compressedFile.format,
          url: `https://storage.example.com/hymns/${hymnId}/compressed/${processedAudio.compressedFile.filename}` // Mock URL
        } : null,
        metadata: {
          title: processedAudio.metadata.title,
          artist: processedAudio.metadata.artist,
          album: processedAudio.metadata.album,
          year: processedAudio.metadata.year,
          genre: processedAudio.metadata.genre,
          duration: processedAudio.metadata.duration,
          bitrate: processedAudio.metadata.bitrate,
          sampleRate: processedAudio.metadata.sampleRate,
          channels: processedAudio.metadata.channels
        },
        description,
        language,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
        status: 'processed'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Audio upload error:', error);

    if (error instanceof AudioProcessingError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process audio file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/worship/audio/upload
 * Get upload status and requirements
 */
async function handleGetUploadInfo(
  request: NextRequest,
  { user, organization }: { user: any; organization: any }
) {
  try {
    const { searchParams } = new URL(request.url);
    const hymnId = searchParams.get('hymnId');

    if (!hymnId) {
      return NextResponse.json(
        { error: 'Hymn ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would fetch existing audio files for the hymn
    // For now, return upload requirements and mock data

    const response = {
      success: true,
      data: {
        hymnId,
        existingAudioFiles: [
          // Mock existing files
          {
            id: 'audio_1',
            filename: 'hymn_audio_original.mp3',
            description: 'Original recording',
            language: 'en',
            duration: 240,
            size: 5 * 1024 * 1024,
            format: 'audio/mpeg',
            uploadedAt: '2024-01-15T10:30:00Z',
            url: `https://storage.example.com/hymns/${hymnId}/audio_1.mp3`
          }
        ],
        uploadRequirements: {
          maxFileSize: 50 * 1024 * 1024, // 50MB
          maxDuration: 30 * 60, // 30 minutes
          minDuration: 5, // 5 seconds
          supportedFormats: [
            'audio/mpeg',
            'audio/wav',
            'audio/flac',
            'audio/aac',
            'audio/mp4',
            'audio/ogg'
          ],
          recommendedSpecs: {
            bitrate: '128-320 kbps',
            sampleRate: '44.1 kHz',
            channels: 'Mono or Stereo'
          }
        },
        storageUsed: {
          totalSize: 25 * 1024 * 1024, // 25MB used
          fileCount: 3,
          organizationLimit: 1 * 1024 * 1024 * 1024 // 1GB limit
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get upload info error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload information' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/worship/audio/upload
 * Delete an uploaded audio file
 */
async function handleDeleteAudio(
  request: NextRequest,
  { user, organization }: { user: any; organization: any }
) {
  try {
    const { searchParams } = new URL(request.url);
    const audioId = searchParams.get('audioId');

    if (!audioId) {
      return NextResponse.json(
        { error: 'Audio ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Verify the user has permission to delete this audio
    // 2. Delete files from cloud storage
    // 3. Remove database records
    // 4. Update hymn audio files array

    return NextResponse.json({
      success: true,
      message: 'Audio file deleted successfully',
      data: {
        audioId,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delete audio error:', error);
    return NextResponse.json(
      { error: 'Failed to delete audio file' },
      { status: 500 }
    );
  }
}

// Apply worship auth middleware with permission checks
export const POST = withWorshipAuth(handleAudioUpload, {
  permission: 'canManageHymns',
});

export const GET = withWorshipAuth(handleGetUploadInfo, {
  permission: 'canViewHymns',
});

export const DELETE = withWorshipAuth(handleDeleteAudio, {
  permission: 'canManageHymns',
});