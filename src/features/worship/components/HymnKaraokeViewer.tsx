'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  Globe, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Settings,
  Type,
  Palette,
  Music,
  Clock,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { formatDuration } from '@/libs/audio/AudioProcessor';
import { HymnPlayer } from './HymnPlayer';
import { Hymn } from './HymnLibrary';

interface KaraokeSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'contrast' | 'gradient';
  showVerseNumbers: boolean;
  autoScroll: boolean;
  highlightMode: 'line' | 'word' | 'smooth';
  transitionSpeed: 'slow' | 'normal' | 'fast';
}

interface LyricSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  verseNumber?: number;
  isChorus?: boolean;
  wordTimings?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
}

interface HymnKaraokeViewerProps {
  hymn: Hymn;
  initialLanguage?: string;
  onClose: () => void;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' }
];

const fontSizeClasses = {
  small: 'text-3xl md:text-4xl',
  medium: 'text-4xl md:text-5xl',
  large: 'text-5xl md:text-6xl',
  xlarge: 'text-6xl md:text-7xl'
};

const themeClasses = {
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 text-white',
  contrast: 'bg-black text-yellow-400',
  gradient: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white'
};

const transitionSpeeds = {
  slow: 'duration-700',
  normal: 'duration-500',
  fast: 'duration-300'
};

export function HymnKaraokeViewer({ 
  hymn, 
  initialLanguage,
  onClose,
  isFullscreen = false,
  onFullscreenToggle
}: HymnKaraokeViewerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(
    initialLanguage || hymn.languages[0] || 'en'
  );
  const [settings, setSettings] = useState<KaraokeSettings>({
    fontSize: 'large',
    theme: 'gradient',
    showVerseNumbers: true,
    autoScroll: true,
    highlightMode: 'line',
    transitionSpeed: 'normal'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0
  });
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const getLanguageName = (code: string) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  // Parse lyrics into synchronized segments
  const lyricSegments = useMemo((): LyricSegment[] => {
    const lyricsText = hymn.lyrics?.find(l => l.language === selectedLanguage)?.content || '';
    if (!lyricsText.trim()) return [];

    const lines = lyricsText.split('\n').filter(line => line.trim());
    const estimatedDuration = playerState.duration || 240; // Default 4 minutes
    const timePerLine = estimatedDuration / lines.length;

    return lines.map((text, index) => {
      const isChorus = text.toLowerCase().includes('chorus') || text.toLowerCase().includes('refrain');
      const verseMatch = text.match(/^(\d+)\./);
      const verseNumber = verseMatch ? parseInt(verseMatch[1]) : undefined;

      return {
        id: `segment-${index}`,
        text: text.replace(/^\d+\.\s*/, ''), // Remove verse numbers from text
        startTime: index * timePerLine,
        endTime: (index + 1) * timePerLine,
        verseNumber,
        isChorus,
        wordTimings: generateWordTimings(text, index * timePerLine, (index + 1) * timePerLine)
      };
    });
  }, [hymn.lyrics, selectedLanguage, playerState.duration]);

  // Generate mock word timings for smooth word-by-word highlighting
  function generateWordTimings(text: string, startTime: number, endTime: number) {
    const words = text.split(' ').filter(word => word.trim());
    const duration = endTime - startTime;
    const timePerWord = duration / words.length;

    return words.map((word, index) => ({
      word,
      startTime: startTime + (index * timePerWord),
      endTime: startTime + ((index + 1) * timePerWord)
    }));
  }

  // Update current segment based on playback time
  useEffect(() => {
    if (settings.autoScroll && lyricSegments.length > 0) {
      const currentIndex = lyricSegments.findIndex((segment, index) => {
        const nextSegment = lyricSegments[index + 1];
        return playerState.currentTime >= segment.startTime && 
               (!nextSegment || playerState.currentTime < nextSegment.startTime);
      });

      if (currentIndex !== -1 && currentIndex !== currentSegmentIndex) {
        setCurrentSegmentIndex(currentIndex);
        
        // Auto-scroll to current segment
        if (lyricsContainerRef.current && settings.autoScroll) {
          const segmentElement = document.getElementById(lyricSegments[currentIndex].id);
          if (segmentElement) {
            segmentElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }
      }
    }
  }, [playerState.currentTime, lyricSegments, currentSegmentIndex, settings.autoScroll]);

  // Auto-hide controls
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (playerState.isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleKeyPress = () => resetTimeout();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    resetTimeout();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playerState.isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen && onFullscreenToggle) {
            onFullscreenToggle();
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          onFullscreenToggle?.();
          break;
        case ' ':
          e.preventDefault();
          // Space handled by player
          break;
        case 'ArrowLeft':
          if (currentSegmentIndex > 0) {
            setCurrentSegmentIndex(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          if (currentSegmentIndex < lyricSegments.length - 1) {
            setCurrentSegmentIndex(prev => prev + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onFullscreenToggle, onClose, currentSegmentIndex, lyricSegments.length]);

  const handlePlayerStateChange = (isPlaying: boolean, currentTime: number) => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying,
      currentTime
    }));
  };

  const getSegmentHighlight = (segment: LyricSegment, index: number) => {
    const isCurrent = index === currentSegmentIndex;
    const isPast = index < currentSegmentIndex;
    const progress = playerState.currentTime - segment.startTime;
    const segmentDuration = segment.endTime - segment.startTime;
    const progressPercentage = Math.max(0, Math.min(100, (progress / segmentDuration) * 100));

    if (settings.highlightMode === 'line') {
      if (isCurrent) return 'text-primary scale-105 font-bold';
      if (isPast) return 'opacity-50';
      return 'opacity-30';
    }

    if (settings.highlightMode === 'smooth' && isCurrent) {
      return {
        background: `linear-gradient(to right, var(--primary) ${progressPercentage}%, transparent ${progressPercentage}%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      };
    }

    return isPast ? 'opacity-50' : 'opacity-30';
  };

  const renderSegmentWithWordHighlight = (segment: LyricSegment, index: number) => {
    if (settings.highlightMode !== 'word' || index !== currentSegmentIndex || !segment.wordTimings) {
      return segment.text;
    }

    return segment.wordTimings.map((wordTiming, wordIndex) => {
      const isCurrentWord = playerState.currentTime >= wordTiming.startTime && 
                           playerState.currentTime < wordTiming.endTime;
      const isPastWord = playerState.currentTime >= wordTiming.endTime;

      return (
        <span
          key={`${segment.id}-word-${wordIndex}`}
          className={`transition-all ${transitionSpeeds[settings.transitionSpeed]} ${
            isCurrentWord ? 'text-primary font-bold scale-110 inline-block' :
            isPastWord ? 'opacity-70' : 'opacity-30'
          }`}
        >
          {wordTiming.word}{' '}
        </span>
      );
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0' : 'relative h-screen'} z-50 flex flex-col ${themeClasses[settings.theme]} transition-all duration-300`}
    >
      {/* Header Controls */}
      <div 
        className={`absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{hymn.title}</h1>
            <Badge variant="secondary">{hymn.author}</Badge>
            {hymn.year && <Badge variant="outline">{hymn.year}</Badge>}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            {hymn.languages.length > 1 && (
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[150px] bg-black/20 border-white/20 text-white">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hymn.languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {getLanguageName(lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Fullscreen Toggle */}
            {onFullscreenToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFullscreenToggle}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-30 bg-black/90 backdrop-blur-sm rounded-lg p-6 space-y-4 text-white min-w-[300px]">
          <h3 className="font-semibold text-lg mb-4">Karaoke Settings</h3>
          
          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-sm flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </label>
            <Select 
              value={settings.fontSize} 
              onValueChange={(value: KaraokeSettings['fontSize']) => 
                setSettings(prev => ({ ...prev, fontSize: value }))
              }
            >
              <SelectTrigger className="bg-black/20 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="xlarge">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </label>
            <Select 
              value={settings.theme} 
              onValueChange={(value: KaraokeSettings['theme']) => 
                setSettings(prev => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger className="bg-black/20 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="contrast">High Contrast</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Highlight Mode */}
          <div className="space-y-2">
            <label className="text-sm">Highlight Mode</label>
            <Select 
              value={settings.highlightMode} 
              onValueChange={(value: KaraokeSettings['highlightMode']) => 
                setSettings(prev => ({ ...prev, highlightMode: value }))
              }
            >
              <SelectTrigger className="bg-black/20 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line by Line</SelectItem>
                <SelectItem value="word">Word by Word</SelectItem>
                <SelectItem value="smooth">Smooth Fill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transition Speed */}
          <div className="space-y-2">
            <label className="text-sm">Animation Speed</label>
            <Select 
              value={settings.transitionSpeed} 
              onValueChange={(value: KaraokeSettings['transitionSpeed']) => 
                setSettings(prev => ({ ...prev, transitionSpeed: value }))
              }
            >
              <SelectTrigger className="bg-black/20 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto Scroll Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Auto Scroll</label>
            <Button
              variant={settings.autoScroll ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, autoScroll: !prev.autoScroll }))}
            >
              {settings.autoScroll ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      )}

      {/* Main Lyrics Display */}
      <div 
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto px-8 py-20"
        style={{ scrollBehavior: settings.autoScroll ? 'smooth' : 'auto' }}
      >
        <div className="max-w-6xl mx-auto">
          {lyricSegments.length > 0 ? (
            <div className="space-y-8">
              {lyricSegments.map((segment, index) => {
                const highlightStyle = getSegmentHighlight(segment, index);
                const isObject = typeof highlightStyle === 'object';
                
                return (
                  <div
                    key={segment.id}
                    id={segment.id}
                    className={`text-center transition-all ${transitionSpeeds[settings.transitionSpeed]} ${
                      !isObject ? highlightStyle : ''
                    } ${fontSizeClasses[settings.fontSize]} leading-relaxed`}
                    style={isObject ? highlightStyle : undefined}
                  >
                    {settings.showVerseNumbers && segment.verseNumber && (
                      <Badge 
                        variant="outline" 
                        className="mb-2 text-lg opacity-60"
                      >
                        Verse {segment.verseNumber}
                      </Badge>
                    )}
                    {segment.isChorus && (
                      <Badge 
                        variant="secondary" 
                        className="mb-2 text-lg"
                      >
                        Chorus
                      </Badge>
                    )}
                    <div className="font-medium">
                      {settings.highlightMode === 'word' 
                        ? renderSegmentWithWordHighlight(segment, index)
                        : segment.text
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center h-full">
              <Globe className="h-20 w-20 mx-auto mb-6 opacity-50" />
              <p className="text-2xl mb-2">No lyrics available</p>
              <p className="text-lg opacity-75">
                {hymn.languages.length > 1 
                  ? `Try switching to another language`
                  : `Upload lyrics to enable karaoke mode`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audio Player Integration */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent transition-all duration-300 ${
          showControls || showPlayer ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {showPlayer ? (
          <div className="max-w-4xl mx-auto">
            <HymnPlayer
              hymnId={hymn.id}
              title={hymn.title}
              author={hymn.author}
              audioFiles={hymn.audioFiles?.map(af => ({
                id: af.id,
                url: af.url || `/api/worship/audio/${af.id}`,
                filename: af.filename,
                description: af.description || '',
                language: af.language,
                duration: af.duration || 180,
                format: af.format || 'mp3'
              })) || []}
              lyrics={hymn.lyrics?.reduce((acc, lyric) => {
                acc[lyric.language] = lyric.content;
                return acc;
              }, {} as Record<string, string>) || {}}
              languages={hymn.languages}
              onPlayerStateChange={handlePlayerStateChange}
              showLyrics={false}
              syncMode="auto"
            />
          </div>
        ) : (
          hymn.audioFiles && hymn.audioFiles.length > 0 && (
            <div className="text-center">
              <Button
                variant="default"
                size="lg"
                onClick={() => setShowPlayer(true)}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
              >
                <Music className="h-5 w-5 mr-2" />
                Show Audio Player
              </Button>
            </div>
          )
        )}
      </div>

      {/* Progress Indicator */}
      {playerState.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(playerState.currentTime / playerState.duration) * 100}%` }}
          />
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div 
        className={`absolute bottom-4 left-4 text-xs text-white/60 space-y-1 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div>ESC: Exit • F: Fullscreen • SPACE: Play/Pause</div>
        <div>← →: Navigate lines • ↑ ↓: First/Last line</div>
      </div>
    </div>
  );
}