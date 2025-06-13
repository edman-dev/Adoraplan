'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Pause,
  FileAudio,
  Clock,
  HardDrive,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  validateAudioFile,
  AUDIO_CONSTRAINTS,
  formatFileSize,
  formatDuration,
  getAudioFormatName,
  AudioProcessingError
} from '@/libs/audio/AudioProcessor';

interface AudioFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  description: string;
  language: string;
}

interface AudioUploadProps {
  hymnId?: string;
  existingAudioFiles?: any[];
  onAudioUploaded?: (audioData: any) => void;
  onAudioDeleted?: (audioId: string) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' }
];

export function AudioUpload({
  hymnId,
  existingAudioFiles = [],
  onAudioUploaded,
  onAudioDeleted,
  maxFiles = 5,
  disabled = false
}: AudioUploadProps) {
  const { toast } = useToast();
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const canAddMore = audioFiles.length + existingAudioFiles.length < maxFiles;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;

    Array.from(files).forEach((file) => {
      if (audioFiles.length + existingAudioFiles.length >= maxFiles) {
        toast({
          title: "File limit reached",
          description: `Maximum ${maxFiles} audio files allowed`,
          variant: "destructive"
        });
        return;
      }

      try {
        validateAudioFile(file);
        
        const audioFile: AudioFile = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          status: 'pending',
          progress: 0,
          description: '',
          language: 'en'
        };

        setAudioFiles(prev => [...prev, audioFile]);
      } catch (error) {
        if (error instanceof AudioProcessingError) {
          toast({
            title: "File rejected",
            description: `${file.name}: ${error.message}`,
            variant: "destructive"
          });
        }
      }
    });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const updateAudioFile = (id: string, updates: Partial<AudioFile>) => {
    setAudioFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const removeAudioFile = (id: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id));
    if (audioRefs.current[id]) {
      delete audioRefs.current[id];
    }
  };

  const uploadAudioFile = async (audioFile: AudioFile) => {
    if (!hymnId) {
      toast({
        title: "Error",
        description: "Hymn must be created before uploading audio",
        variant: "destructive"
      });
      return;
    }

    try {
      updateAudioFile(audioFile.id, { status: 'uploading', progress: 0 });

      const formData = new FormData();
      formData.append('audio', audioFile.file);
      formData.append('hymnId', hymnId);
      formData.append('description', audioFile.description);
      formData.append('language', audioFile.language);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[audioFile.id] || 0;
          const newProgress = Math.min(current + Math.random() * 20, 90);
          return { ...prev, [audioFile.id]: newProgress };
        });
      }, 500);

      const response = await fetch('/api/worship/audio/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      updateAudioFile(audioFile.id, { 
        status: 'completed', 
        progress: 100
      });

      setUploadProgress(prev => ({ ...prev, [audioFile.id]: 100 }));

      toast({
        title: "Upload successful",
        description: `${audioFile.file.name} uploaded successfully`
      });

      onAudioUploaded?.(result.data);

      // Remove from queue after successful upload
      setTimeout(() => {
        removeAudioFile(audioFile.id);
      }, 2000);

    } catch (error) {
      updateAudioFile(audioFile.id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed'
      });

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload audio',
        variant: "destructive"
      });
    }
  };

  const handlePlayPause = (audioId: string, url?: string) => {
    if (!url) return;

    if (currentlyPlaying === audioId) {
      audioRefs.current[audioId]?.pause();
      setCurrentlyPlaying(null);
    } else {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach(audio => audio.pause());
      
      // Create or get audio element
      if (!audioRefs.current[audioId]) {
        audioRefs.current[audioId] = new Audio(url);
        audioRefs.current[audioId].addEventListener('ended', () => {
          setCurrentlyPlaying(null);
        });
      }
      
      audioRefs.current[audioId].play();
      setCurrentlyPlaying(audioId);
    }
  };

  const deleteExistingAudio = async (audioId: string) => {
    try {
      const response = await fetch(`/api/worship/audio/upload?audioId=${audioId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete audio');
      }

      onAudioDeleted?.(audioId);
      
      toast({
        title: "Audio deleted",
        description: "Audio file deleted successfully"
      });

    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : 'Failed to delete audio',
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: AudioFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />;
      default:
        return <FileAudio className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {canAddMore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Audio Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragOver ? (
                <p className="text-lg">Drop audio files here...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">Drag & drop audio files here, or click to select</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports MP3, WAV, FLAC, AAC, and more
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-gray-400">
                    <span>Max {formatFileSize(AUDIO_CONSTRAINTS.maxFileSize)}</span>
                    <span>•</span>
                    <span>Max {formatDuration(AUDIO_CONSTRAINTS.maxDuration)}</span>
                    <span>•</span>
                    <span>{maxFiles - audioFiles.length - existingAudioFiles.length} slots remaining</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Audio Files */}
      {existingAudioFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Audio Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingAudioFiles.map((audio) => (
              <div key={audio.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <FileAudio className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{audio.filename}</span>
                      <Badge variant="outline">{getAudioFormatName(audio.format)}</Badge>
                      {audio.language && (
                        <Badge variant="secondary">
                          {supportedLanguages.find(l => l.code === audio.language)?.name || audio.language}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(audio.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(audio.duration)}
                      </span>
                    </div>
                    {audio.description && (
                      <p className="text-sm text-gray-600 mt-1">{audio.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlayPause(audio.id, audio.url)}
                  >
                    {currentlyPlaying === audio.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExistingAudio(audio.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending/Uploading Files */}
      {audioFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {audioFiles.map((audioFile) => (
              <div key={audioFile.id} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(audioFile.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{audioFile.file.name}</span>
                        <Badge variant="outline">{getAudioFormatName(audioFile.file.type)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(audioFile.file.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAudioFile(audioFile.id)}
                    disabled={audioFile.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File Details Form */}
                {audioFile.status === 'pending' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`description-${audioFile.id}`}>Description</Label>
                      <Input
                        id={`description-${audioFile.id}`}
                        value={audioFile.description}
                        onChange={(e) => updateAudioFile(audioFile.id, { description: e.target.value })}
                        placeholder="e.g., Piano accompaniment"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`language-${audioFile.id}`}>Language</Label>
                      <Select 
                        value={audioFile.language} 
                        onValueChange={(value) => updateAudioFile(audioFile.id, { language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {(audioFile.status === 'uploading' || audioFile.status === 'processing') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {audioFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                      </span>
                      <span>{Math.round(uploadProgress[audioFile.id] || 0)}%</span>
                    </div>
                    <Progress value={uploadProgress[audioFile.id] || 0} />
                  </div>
                )}

                {/* Error Message */}
                {audioFile.status === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{audioFile.error}</span>
                  </div>
                )}

                {/* Success Message */}
                {audioFile.status === 'completed' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Upload completed successfully</span>
                  </div>
                )}

                {/* Upload Button */}
                {audioFile.status === 'pending' && (
                  <Button 
                    onClick={() => uploadAudioFile(audioFile)}
                    disabled={!audioFile.description.trim()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Audio
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Upload Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">File Requirements</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Max file size: {formatFileSize(AUDIO_CONSTRAINTS.maxFileSize)}</li>
                <li>• Max duration: {formatDuration(AUDIO_CONSTRAINTS.maxDuration)}</li>
                <li>• Min duration: {formatDuration(AUDIO_CONSTRAINTS.minDuration)}</li>
                <li>• Max {maxFiles} files per hymn</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Recommended Specs</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Bitrate: 128-320 kbps</li>
                <li>• Sample Rate: 44.1 kHz</li>
                <li>• Channels: Mono or Stereo</li>
                <li>• Format: MP3, WAV, FLAC</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}