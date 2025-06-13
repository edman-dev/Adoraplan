'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Music,
  Clock,
  Type,
  Settings
} from 'lucide-react';
import { formatDuration } from '@/libs/audio/AudioProcessor';

interface LyricLine {
  startTime: number;
  endTime: number;
  text: string;
  verseNumber?: number;
  isChorus?: boolean;
}

interface AudioFile {
  id: string;
  url: string;
  filename: string;
  description: string;
  language: string;
  duration: number;
  format: string;
}

interface HymnPlayerProps {
  hymnId: string;
  title: string;
  author: string;
  audioFiles: AudioFile[];
  lyrics: Record<string, string>;
  languages: string[];
  onPlayerStateChange?: (isPlaying: boolean, currentTime: number) => void;
  autoPlay?: boolean;
  showLyrics?: boolean;
  syncMode?: 'manual' | 'auto';
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  currentAudioIndex: number;
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

export function HymnPlayer({
  hymnId,
  title,
  author,
  audioFiles,
  lyrics,
  languages,
  onPlayerStateChange,
  autoPlay = false,
  showLyrics = true,
  syncMode = 'auto'
}: HymnPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLooping: false,
    currentAudioIndex: 0
  });

  const [selectedLanguage, setSelectedLanguage] = useState(languages[0] || 'en');
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [fontSize, setFontSize] = useState(16);
  const [isSeekingSelf, setIsSeekingSelf] = useState(false);

  const currentAudio = audioFiles[playbackState.currentAudioIndex];

  // Parse lyrics into synchronized lines (mock implementation)
  const parsedLyrics = useMemo(() => {
    const lyricText = lyrics[selectedLanguage] || '';
    if (!lyricText.trim()) return [];

    const lines = lyricText.split('\n').filter(line => line.trim());
    const duration = playbackState.duration || 180; // Default 3 minutes if no duration
    const timePerLine = duration / lines.length;

    return lines.map((text, index) => ({
      startTime: index * timePerLine,
      endTime: (index + 1) * timePerLine,
      text: text.trim(),
      verseNumber: Math.floor(index / 4) + 1,
      isChorus: text.toLowerCase().includes('chorus') || text.toLowerCase().includes('refrain')
    }));
  }, [lyrics, selectedLanguage, playbackState.duration]);

  // Update current lyric based on playback time
  useEffect(() => {
    if (syncMode === 'auto' && parsedLyrics.length > 0) {
      const currentIndex = parsedLyrics.findIndex(
        (line, index) => {
          const nextLine = parsedLyrics[index + 1];
          return playbackState.currentTime >= line.startTime && 
                 (!nextLine || playbackState.currentTime < nextLine.startTime);
        }
      );
      setCurrentLyricIndex(currentIndex);
    }
  }, [playbackState.currentTime, parsedLyrics, syncMode]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isSeekingSelf) {
        setPlaybackState(prev => ({
          ...prev,
          currentTime: audio.currentTime
        }));
      }
    };

    const handleLoadedMetadata = () => {
      setPlaybackState(prev => ({
        ...prev,
        duration: audio.duration
      }));
    };

    const handleEnded = () => {
      if (playbackState.isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else if (playbackState.currentAudioIndex < audioFiles.length - 1) {
        handleNextTrack();
      } else {
        setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      }
    };

    const handlePlay = () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playbackState.isLooping, playbackState.currentAudioIndex, audioFiles.length, isSeekingSelf]);

  // Load current audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudio) return;

    audio.src = currentAudio.url;
    audio.volume = playbackState.volume;
    audio.muted = playbackState.isMuted;

    if (autoPlay && !playbackState.isPlaying) {
      audio.play().catch(console.error);
    }
  }, [currentAudio, playbackState.volume, playbackState.isMuted, autoPlay]);

  // Notify parent of player state changes
  useEffect(() => {
    onPlayerStateChange?.(playbackState.isPlaying, playbackState.currentTime);
  }, [playbackState.isPlaying, playbackState.currentTime, onPlayerStateChange]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentAudio) return;

    if (playbackState.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleSeek = (values: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = values[0];
    setIsSeekingSelf(true);
    audio.currentTime = newTime;
    setPlaybackState(prev => ({ ...prev, currentTime: newTime }));
    
    // Reset seeking flag after a brief delay
    setTimeout(() => setIsSeekingSelf(false), 100);
  };

  const handleVolumeChange = (values: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = values[0];
    audio.volume = newVolume;
    setPlaybackState(prev => ({ 
      ...prev, 
      volume: newVolume,
      isMuted: newVolume === 0 
    }));
  };

  const handleMuteToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !playbackState.isMuted;
    audio.muted = newMuted;
    setPlaybackState(prev => ({ ...prev, isMuted: newMuted }));
  };

  const handlePreviousTrack = () => {
    if (playbackState.currentAudioIndex > 0) {
      setPlaybackState(prev => ({ 
        ...prev, 
        currentAudioIndex: prev.currentAudioIndex - 1,
        currentTime: 0 
      }));
    }
  };

  const handleNextTrack = () => {
    if (playbackState.currentAudioIndex < audioFiles.length - 1) {
      setPlaybackState(prev => ({ 
        ...prev, 
        currentAudioIndex: prev.currentAudioIndex + 1,
        currentTime: 0 
      }));
    }
  };

  const handleLoopToggle = () => {
    setPlaybackState(prev => ({ ...prev, isLooping: !prev.isLooping }));
  };

  const handleLyricClick = (line: LyricLine) => {
    const audio = audioRef.current;
    if (!audio || syncMode !== 'manual') return;

    audio.currentTime = line.startTime;
    setPlaybackState(prev => ({ ...prev, currentTime: line.startTime }));
  };

  const getLanguageName = (code: string) => {
    return supportedLanguages.find(lang => lang.code === code)?.name || code;
  };

  if (audioFiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Music className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">No Audio Available</p>
          <p className="text-sm text-gray-500">Upload audio files to enable playback</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} preload="metadata" />
      
      {/* Player Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-sm text-gray-600">by {author}</p>
            </div>
            <div className="flex items-center gap-2">
              {audioFiles.length > 1 && (
                <Select 
                  value={playbackState.currentAudioIndex.toString()} 
                  onValueChange={(value) => setPlaybackState(prev => ({ 
                    ...prev, 
                    currentAudioIndex: parseInt(value),
                    currentTime: 0 
                  }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audioFiles.map((audio, index) => (
                      <SelectItem key={audio.id} value={index.toString()}>
                        {audio.description || audio.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[playbackState.currentTime]}
              max={playbackState.duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatDuration(playbackState.currentTime)}</span>
              <span>{formatDuration(playbackState.duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousTrack}
              disabled={playbackState.currentAudioIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={handlePlayPause}
              disabled={!currentAudio}
              className="h-12 w-12 rounded-full"
            >
              {playbackState.isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextTrack}
              disabled={playbackState.currentAudioIndex >= audioFiles.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              variant={playbackState.isLooping ? "default" : "ghost"}
              size="sm"
              onClick={handleLoopToggle}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
            >
              {playbackState.isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[playbackState.isMuted ? 0 : playbackState.volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="flex-1 max-w-32"
            />
          </div>

          {/* Current Track Info */}
          {currentAudio && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Music className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{currentAudio.description || currentAudio.filename}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(currentAudio.duration)}</span>
                    {currentAudio.language && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {getLanguageName(currentAudio.language)}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synchronized Lyrics */}
      {showLyrics && lyrics[selectedLanguage] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Synchronized Lyrics
              </span>
              <div className="flex items-center gap-3">
                {/* Language Selector */}
                {languages.length > 1 && (
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {getLanguageName(lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Font Size Control */}
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <Slider
                    value={[fontSize]}
                    min={12}
                    max={24}
                    step={1}
                    onValueChange={(values) => setFontSize(values[0])}
                    className="w-16"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {parsedLyrics.map((line, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    index === currentLyricIndex
                      ? 'bg-primary/10 border-l-4 border-primary text-primary font-medium'
                      : 'hover:bg-gray-50'
                  } ${syncMode === 'manual' ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ fontSize: `${fontSize}px` }}
                  onClick={() => handleLyricClick(line)}
                >
                  <div className="flex items-center gap-3">
                    {line.isChorus && (
                      <Badge variant="outline" className="text-xs">
                        Chorus
                      </Badge>
                    )}
                    <span className="flex-1">{line.text}</span>
                    {syncMode === 'auto' && (
                      <span className="text-xs text-gray-500">
                        {formatDuration(line.startTime)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sync Mode Toggle */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Sync Mode:</span>
                <Badge variant={syncMode === 'auto' ? 'default' : 'outline'}>
                  {syncMode === 'auto' ? 'Automatic' : 'Manual'}
                </Badge>
              </div>
              {syncMode === 'manual' && (
                <p className="text-xs text-gray-500">
                  Click on lyrics to jump to that position
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}