/**
 * Audio processing utilities for hymn audio files
 * Handles validation, compression, and format conversion
 */

export interface AudioFileInfo {
  originalName: string;
  size: number;
  duration: number;
  format: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export interface ProcessedAudioResult {
  originalFile: AudioFileInfo;
  compressedFile?: {
    buffer: Buffer;
    filename: string;
    size: number;
    format: string;
  };
  thumbnail?: {
    buffer: Buffer;
    filename: string;
  };
  metadata: AudioMetadata;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export class AudioProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

// Supported audio formats
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',        // MP3
  'audio/wav',         // WAV
  'audio/x-wav',       // WAV (alternative)
  'audio/flac',        // FLAC
  'audio/x-flac',      // FLAC (alternative)
  'audio/aac',         // AAC
  'audio/mp4',         // M4A
  'audio/x-m4a',       // M4A (alternative)
  'audio/ogg',         // OGG
  'audio/webm',        // WebM Audio
] as const;

export type SupportedAudioFormat = typeof SUPPORTED_AUDIO_FORMATS[number];

// Audio validation constraints
export const AUDIO_CONSTRAINTS = {
  maxFileSize: 50 * 1024 * 1024,      // 50MB
  maxDuration: 30 * 60,               // 30 minutes
  minDuration: 5,                     // 5 seconds
  targetBitrate: 128,                 // 128 kbps for compressed output
  targetSampleRate: 44100,            // 44.1kHz
  maxChannels: 2,                     // Stereo max
} as const;

/**
 * Validates audio file format and basic properties
 */
export function validateAudioFile(file: File): void {
  // Check file size
  if (file.size > AUDIO_CONSTRAINTS.maxFileSize) {
    throw new AudioProcessingError(
      `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds maximum allowed size of ${AUDIO_CONSTRAINTS.maxFileSize / 1024 / 1024}MB`,
      'FILE_TOO_LARGE',
      { fileSize: file.size, maxSize: AUDIO_CONSTRAINTS.maxFileSize }
    );
  }

  // Check file type
  if (!SUPPORTED_AUDIO_FORMATS.includes(file.type as SupportedAudioFormat)) {
    throw new AudioProcessingError(
      `Unsupported file format: ${file.type}. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
      'UNSUPPORTED_FORMAT',
      { fileType: file.type, supportedFormats: SUPPORTED_AUDIO_FORMATS }
    );
  }

  // Check file extension matches MIME type
  const extension = file.name.toLowerCase().split('.').pop();
  const expectedExtensions: Record<string, string[]> = {
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
    'audio/x-wav': ['wav'],
    'audio/flac': ['flac'],
    'audio/x-flac': ['flac'],
    'audio/aac': ['aac'],
    'audio/mp4': ['m4a', 'mp4'],
    'audio/x-m4a': ['m4a'],
    'audio/ogg': ['ogg'],
    'audio/webm': ['webm'],
  };

  const validExtensions = expectedExtensions[file.type] || [];
  if (extension && !validExtensions.includes(extension)) {
    throw new AudioProcessingError(
      `File extension .${extension} does not match MIME type ${file.type}`,
      'EXTENSION_MISMATCH',
      { extension, mimeType: file.type, expectedExtensions: validExtensions }
    );
  }
}

/**
 * Extracts audio metadata from file buffer
 * Note: This is a simplified implementation. In production, you'd use a library like node-ffmpeg or music-metadata
 */
export async function extractAudioMetadata(buffer: Buffer, filename: string): Promise<AudioMetadata> {
  // For now, return mock metadata since we don't have audio processing libraries
  // In production, you would use libraries like:
  // - music-metadata for extracting ID3 tags and audio info
  // - ffprobe (ffmpeg) for detailed audio analysis
  
  const fileExtension = filename.toLowerCase().split('.').pop();
  
  // Mock metadata based on file type
  const mockMetadata: AudioMetadata = {
    duration: 180, // 3 minutes default
    bitrate: 320,  // 320 kbps
    sampleRate: 44100, // 44.1kHz
    channels: 2,   // Stereo
  };

  // Simulate different properties based on file type
  switch (fileExtension) {
    case 'mp3':
      mockMetadata.bitrate = 320;
      break;
    case 'wav':
    case 'flac':
      mockMetadata.bitrate = 1411; // Lossless
      break;
    case 'aac':
    case 'm4a':
      mockMetadata.bitrate = 256;
      break;
    default:
      mockMetadata.bitrate = 192;
  }

  return mockMetadata;
}

/**
 * Validates audio content and metadata
 */
export function validateAudioMetadata(metadata: AudioMetadata): void {
  if (metadata.duration > AUDIO_CONSTRAINTS.maxDuration) {
    throw new AudioProcessingError(
      `Audio duration ${Math.round(metadata.duration / 60)}:${String(Math.round(metadata.duration % 60)).padStart(2, '0')} exceeds maximum allowed duration of ${AUDIO_CONSTRAINTS.maxDuration / 60} minutes`,
      'DURATION_TOO_LONG',
      { duration: metadata.duration, maxDuration: AUDIO_CONSTRAINTS.maxDuration }
    );
  }

  if (metadata.duration < AUDIO_CONSTRAINTS.minDuration) {
    throw new AudioProcessingError(
      `Audio duration ${metadata.duration}s is below minimum required duration of ${AUDIO_CONSTRAINTS.minDuration}s`,
      'DURATION_TOO_SHORT',
      { duration: metadata.duration, minDuration: AUDIO_CONSTRAINTS.minDuration }
    );
  }

  if (metadata.channels > AUDIO_CONSTRAINTS.maxChannels) {
    throw new AudioProcessingError(
      `Audio has ${metadata.channels} channels, maximum allowed is ${AUDIO_CONSTRAINTS.maxChannels}`,
      'TOO_MANY_CHANNELS',
      { channels: metadata.channels, maxChannels: AUDIO_CONSTRAINTS.maxChannels }
    );
  }
}

/**
 * Generates a compressed version of the audio file
 * Note: This is a placeholder implementation. In production, you'd use ffmpeg or similar
 */
export async function compressAudio(
  buffer: Buffer, 
  originalMetadata: AudioMetadata,
  filename: string
): Promise<{ buffer: Buffer; filename: string; size: number; format: string }> {
  // In production, this would use ffmpeg to compress the audio
  // For now, we'll just return the original buffer for demonstration
  
  const compressedFilename = filename.replace(/\.[^.]+$/, '.mp3');
  
  // Simulate compression by returning a "compressed" version
  // In reality, you would:
  // 1. Use ffmpeg to convert to MP3 at target bitrate
  // 2. Apply audio normalization
  // 3. Remove excess metadata
  // 4. Optimize for streaming
  
  return {
    buffer: buffer, // In production: compressed audio buffer
    filename: compressedFilename,
    size: Math.round(buffer.length * 0.7), // Simulate 30% compression
    format: 'audio/mpeg'
  };
}

/**
 * Generates an audio waveform visualization (placeholder)
 */
export async function generateWaveform(buffer: Buffer): Promise<number[]> {
  // In production, this would generate a waveform visualization
  // For now, return mock waveform data
  const sampleCount = 100;
  const waveform: number[] = [];
  
  for (let i = 0; i < sampleCount; i++) {
    // Generate mock waveform data (sine wave with noise)
    const t = (i / sampleCount) * 4 * Math.PI;
    const amplitude = Math.sin(t) * 0.8 + Math.random() * 0.4 - 0.2;
    waveform.push(Math.max(0, Math.min(1, amplitude * 0.5 + 0.5)));
  }
  
  return waveform;
}

/**
 * Process uploaded audio file
 */
export async function processAudioFile(
  file: File,
  options: {
    compress?: boolean;
    generateWaveform?: boolean;
    extractMetadata?: boolean;
  } = {}
): Promise<ProcessedAudioResult> {
  const {
    compress = true,
    generateWaveform = true,
    extractMetadata = true
  } = options;

  // Validate file
  validateAudioFile(file);

  // Convert to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract metadata
  const metadata = extractMetadata 
    ? await extractAudioMetadata(buffer, file.name)
    : {
        duration: 0,
        bitrate: 0,
        sampleRate: 44100,
        channels: 2
      };

  // Validate metadata
  if (extractMetadata) {
    validateAudioMetadata(metadata);
  }

  // Create original file info
  const originalFile: AudioFileInfo = {
    originalName: file.name,
    size: file.size,
    duration: metadata.duration,
    format: file.type,
    bitrate: metadata.bitrate,
    sampleRate: metadata.sampleRate,
    channels: metadata.channels
  };

  const result: ProcessedAudioResult = {
    originalFile,
    metadata
  };

  // Compress if requested and beneficial
  if (compress && (file.size > 1024 * 1024 || metadata.bitrate > AUDIO_CONSTRAINTS.targetBitrate * 1.5)) {
    result.compressedFile = await compressAudio(buffer, metadata, file.name);
  }

  return result;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get audio format display name
 */
export function getAudioFormatName(mimeType: string): string {
  const formatNames: Record<string, string> = {
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/x-wav': 'WAV',
    'audio/flac': 'FLAC',
    'audio/x-flac': 'FLAC',
    'audio/aac': 'AAC',
    'audio/mp4': 'M4A',
    'audio/x-m4a': 'M4A',
    'audio/ogg': 'OGG',
    'audio/webm': 'WebM'
  };
  
  return formatNames[mimeType] || mimeType.toUpperCase();
}