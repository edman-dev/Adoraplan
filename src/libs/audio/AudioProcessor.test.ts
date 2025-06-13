import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateAudioFile,
  validateAudioMetadata,
  extractAudioMetadata,
  compressAudio,
  processAudioFile,
  generateWaveform,
  formatFileSize,
  formatDuration,
  getAudioFormatName,
  AudioProcessingError,
  SUPPORTED_AUDIO_FORMATS,
  AUDIO_CONSTRAINTS,
  type AudioMetadata
} from './AudioProcessor';

// Mock File constructor for tests
class MockFile extends File {
  constructor(
    bits: BlobPart[],
    name: string,
    options?: FilePropertyBag & { size?: number }
  ) {
    super(bits, name, options);
    // Override size if provided for testing
    if (options?.size !== undefined) {
      Object.defineProperty(this, 'size', { value: options.size });
    }
  }
}

describe('AudioProcessor', () => {
  describe('validateAudioFile', () => {
    it('should accept valid MP3 file', () => {
      const file = new MockFile([''], 'test.mp3', { 
        type: 'audio/mpeg',
        size: 1024 * 1024 // 1MB
      });
      
      expect(() => validateAudioFile(file)).not.toThrow();
    });

    it('should accept valid WAV file', () => {
      const file = new MockFile([''], 'test.wav', { 
        type: 'audio/wav',
        size: 1024 * 1024
      });
      
      expect(() => validateAudioFile(file)).not.toThrow();
    });

    it('should accept valid FLAC file', () => {
      const file = new MockFile([''], 'test.flac', { 
        type: 'audio/flac',
        size: 1024 * 1024
      });
      
      expect(() => validateAudioFile(file)).not.toThrow();
    });

    it('should reject file exceeding size limit', () => {
      const file = new MockFile([''], 'test.mp3', { 
        type: 'audio/mpeg',
        size: AUDIO_CONSTRAINTS.maxFileSize + 1
      });
      
      expect(() => validateAudioFile(file)).toThrow(AudioProcessingError);
      expect(() => validateAudioFile(file)).toThrow('exceeds maximum allowed size');
    });

    it('should reject unsupported file format', () => {
      const file = new MockFile([''], 'test.txt', { 
        type: 'text/plain',
        size: 1024
      });
      
      expect(() => validateAudioFile(file)).toThrow(AudioProcessingError);
      expect(() => validateAudioFile(file)).toThrow('Unsupported file format');
    });

    it('should reject file with extension mismatch', () => {
      const file = new MockFile([''], 'test.txt', { 
        type: 'audio/mpeg',
        size: 1024
      });
      
      expect(() => validateAudioFile(file)).toThrow(AudioProcessingError);
      expect(() => validateAudioFile(file)).toThrow('does not match MIME type');
    });

    it('should accept file without extension', () => {
      const file = new MockFile([''], 'audiofile', { 
        type: 'audio/mpeg',
        size: 1024
      });
      
      expect(() => validateAudioFile(file)).not.toThrow();
    });
  });

  describe('validateAudioMetadata', () => {
    let validMetadata: AudioMetadata;

    beforeEach(() => {
      validMetadata = {
        duration: 180, // 3 minutes
        bitrate: 320,
        sampleRate: 44100,
        channels: 2
      };
    });

    it('should accept valid metadata', () => {
      expect(() => validateAudioMetadata(validMetadata)).not.toThrow();
    });

    it('should reject audio exceeding max duration', () => {
      validMetadata.duration = AUDIO_CONSTRAINTS.maxDuration + 1;
      
      expect(() => validateAudioMetadata(validMetadata)).toThrow(AudioProcessingError);
      expect(() => validateAudioMetadata(validMetadata)).toThrow('exceeds maximum allowed duration');
    });

    it('should reject audio below min duration', () => {
      validMetadata.duration = AUDIO_CONSTRAINTS.minDuration - 1;
      
      expect(() => validateAudioMetadata(validMetadata)).toThrow(AudioProcessingError);
      expect(() => validateAudioMetadata(validMetadata)).toThrow('below minimum required duration');
    });

    it('should reject audio with too many channels', () => {
      validMetadata.channels = AUDIO_CONSTRAINTS.maxChannels + 1;
      
      expect(() => validateAudioMetadata(validMetadata)).toThrow(AudioProcessingError);
      expect(() => validateAudioMetadata(validMetadata)).toThrow('maximum allowed is');
    });

    it('should accept mono audio', () => {
      validMetadata.channels = 1;
      
      expect(() => validateAudioMetadata(validMetadata)).not.toThrow();
    });

    it('should accept edge case durations', () => {
      // Minimum duration
      validMetadata.duration = AUDIO_CONSTRAINTS.minDuration;
      expect(() => validateAudioMetadata(validMetadata)).not.toThrow();
      
      // Maximum duration
      validMetadata.duration = AUDIO_CONSTRAINTS.maxDuration;
      expect(() => validateAudioMetadata(validMetadata)).not.toThrow();
    });
  });

  describe('extractAudioMetadata', () => {
    it('should extract metadata from MP3 buffer', async () => {
      const buffer = Buffer.from('mock audio data');
      const metadata = await extractAudioMetadata(buffer, 'test.mp3');
      
      expect(metadata).toHaveProperty('duration');
      expect(metadata).toHaveProperty('bitrate');
      expect(metadata).toHaveProperty('sampleRate');
      expect(metadata).toHaveProperty('channels');
      expect(metadata.bitrate).toBe(320); // MP3 default
    });

    it('should extract metadata from WAV buffer', async () => {
      const buffer = Buffer.from('mock audio data');
      const metadata = await extractAudioMetadata(buffer, 'test.wav');
      
      expect(metadata.bitrate).toBe(1411); // Lossless default
    });

    it('should extract metadata from FLAC buffer', async () => {
      const buffer = Buffer.from('mock audio data');
      const metadata = await extractAudioMetadata(buffer, 'test.flac');
      
      expect(metadata.bitrate).toBe(1411); // Lossless default
    });

    it('should extract metadata from AAC buffer', async () => {
      const buffer = Buffer.from('mock audio data');
      const metadata = await extractAudioMetadata(buffer, 'test.aac');
      
      expect(metadata.bitrate).toBe(256); // AAC default
    });

    it('should handle unknown format with default values', async () => {
      const buffer = Buffer.from('mock audio data');
      const metadata = await extractAudioMetadata(buffer, 'test.unknown');
      
      expect(metadata.bitrate).toBe(192); // Default fallback
      expect(metadata.sampleRate).toBe(44100);
      expect(metadata.channels).toBe(2);
    });
  });

  describe('compressAudio', () => {
    let mockMetadata: AudioMetadata;

    beforeEach(() => {
      mockMetadata = {
        duration: 180,
        bitrate: 320,
        sampleRate: 44100,
        channels: 2
      };
    });

    it('should compress audio and return compressed data', async () => {
      const originalBuffer = Buffer.from('mock audio data'.repeat(100));
      
      const result = await compressAudio(originalBuffer, mockMetadata, 'test.wav');
      
      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('format');
      expect(result.filename).toBe('test.mp3');
      expect(result.format).toBe('audio/mpeg');
      expect(result.size).toBeLessThan(originalBuffer.length);
    });

    it('should change file extension to mp3', async () => {
      const buffer = Buffer.from('mock data');
      
      const result = await compressAudio(buffer, mockMetadata, 'audio.wav');
      expect(result.filename).toBe('audio.mp3');
      
      const result2 = await compressAudio(buffer, mockMetadata, 'song.flac');
      expect(result2.filename).toBe('song.mp3');
    });

    it('should simulate compression ratio', async () => {
      const originalBuffer = Buffer.from('x'.repeat(1000));
      
      const result = await compressAudio(originalBuffer, mockMetadata, 'test.wav');
      
      // Should simulate ~30% compression
      expect(result.size).toBeCloseTo(originalBuffer.length * 0.7, 0);
    });
  });

  describe('generateWaveform', () => {
    it('should generate waveform data array', async () => {
      const buffer = Buffer.from('mock audio data');
      
      const waveform = await generateWaveform(buffer);
      
      expect(Array.isArray(waveform)).toBe(true);
      expect(waveform).toHaveLength(100);
      
      // All values should be between 0 and 1
      waveform.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should generate different waveforms for different calls', async () => {
      const buffer = Buffer.from('mock audio data');
      
      const waveform1 = await generateWaveform(buffer);
      const waveform2 = await generateWaveform(buffer);
      
      // Due to random component, they should be different
      expect(waveform1).not.toEqual(waveform2);
    });
  });

  describe('processAudioFile', () => {
    let validFile: MockFile;

    beforeEach(() => {
      validFile = new MockFile(['mock audio content'], 'test.mp3', {
        type: 'audio/mpeg',
        size: 2 * 1024 * 1024 // 2MB
      });
    });

    it('should process valid audio file successfully', async () => {
      const result = await processAudioFile(validFile);
      
      expect(result).toHaveProperty('originalFile');
      expect(result).toHaveProperty('metadata');
      expect(result.originalFile.originalName).toBe('test.mp3');
      expect(result.originalFile.format).toBe('audio/mpeg');
    });

    it('should include compressed file when compression is enabled', async () => {
      const result = await processAudioFile(validFile, { compress: true });
      
      expect(result.compressedFile).toBeDefined();
      expect(result.compressedFile?.format).toBe('audio/mpeg');
    });

    it('should skip compression when disabled', async () => {
      const result = await processAudioFile(validFile, { compress: false });
      
      expect(result.compressedFile).toBeUndefined();
    });

    it('should skip compression for small, already compressed files', async () => {
      const smallFile = new MockFile(['small'], 'small.mp3', {
        type: 'audio/mpeg',
        size: 500 * 1024 // 500KB
      });
      
      const result = await processAudioFile(smallFile, { compress: true });
      
      // Should skip compression for small MP3
      expect(result.compressedFile).toBeUndefined();
    });

    it('should reject invalid file', async () => {
      const invalidFile = new MockFile([''], 'test.txt', {
        type: 'text/plain',
        size: 1024
      });
      
      await expect(processAudioFile(invalidFile)).rejects.toThrow(AudioProcessingError);
    });

    it('should include original file info', async () => {
      const result = await processAudioFile(validFile);
      
      expect(result.originalFile).toEqual({
        originalName: 'test.mp3',
        size: 2 * 1024 * 1024,
        duration: 180,
        format: 'audio/mpeg',
        bitrate: 320,
        sampleRate: 44100,
        channels: 2
      });
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to MM:SS format', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3600)).toBe('1:00:00');
    });

    it('should handle hours correctly', () => {
      expect(formatDuration(3661)).toBe('1:01:01'); // 1 hour, 1 minute, 1 second
      expect(formatDuration(7322)).toBe('2:02:02'); // 2 hours, 2 minutes, 2 seconds
    });

    it('should pad minutes and seconds with zeros', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3605)).toBe('1:00:05');
    });
  });

  describe('getAudioFormatName', () => {
    it('should return correct format names', () => {
      expect(getAudioFormatName('audio/mpeg')).toBe('MP3');
      expect(getAudioFormatName('audio/wav')).toBe('WAV');
      expect(getAudioFormatName('audio/flac')).toBe('FLAC');
      expect(getAudioFormatName('audio/aac')).toBe('AAC');
      expect(getAudioFormatName('audio/mp4')).toBe('M4A');
      expect(getAudioFormatName('audio/ogg')).toBe('OGG');
    });

    it('should handle alternative MIME types', () => {
      expect(getAudioFormatName('audio/x-wav')).toBe('WAV');
      expect(getAudioFormatName('audio/x-flac')).toBe('FLAC');
      expect(getAudioFormatName('audio/x-m4a')).toBe('M4A');
    });

    it('should fallback to uppercase for unknown formats', () => {
      expect(getAudioFormatName('audio/unknown')).toBe('AUDIO/UNKNOWN');
      expect(getAudioFormatName('custom/format')).toBe('CUSTOM/FORMAT');
    });
  });

  describe('AudioProcessingError', () => {
    it('should create error with code and details', () => {
      const error = new AudioProcessingError(
        'Test error',
        'TEST_CODE',
        { detail: 'test' }
      );
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('AudioProcessingError');
    });

    it('should work without details', () => {
      const error = new AudioProcessingError('Test error', 'TEST_CODE');
      
      expect(error.details).toBeUndefined();
    });
  });

  describe('Constants', () => {
    it('should have expected supported formats', () => {
      expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/mpeg');
      expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/wav');
      expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/flac');
      expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/aac');
    });

    it('should have reasonable audio constraints', () => {
      expect(AUDIO_CONSTRAINTS.maxFileSize).toBeGreaterThan(0);
      expect(AUDIO_CONSTRAINTS.maxDuration).toBeGreaterThan(0);
      expect(AUDIO_CONSTRAINTS.minDuration).toBeGreaterThan(0);
      expect(AUDIO_CONSTRAINTS.targetBitrate).toBeGreaterThan(0);
      expect(AUDIO_CONSTRAINTS.targetSampleRate).toBeGreaterThan(0);
      expect(AUDIO_CONSTRAINTS.maxChannels).toBeGreaterThan(0);
    });
  });
});