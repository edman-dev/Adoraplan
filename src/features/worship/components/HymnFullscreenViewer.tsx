'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Palette
} from 'lucide-react';
import { Hymn } from './HymnLibrary';

interface HymnFullscreenViewerProps {
  hymn: Hymn;
  initialLanguage?: string;
  onClose: () => void;
  onPlay?: (hymnId: string) => void;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
}

interface ViewerSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'contrast';
  showVerseNumbers: boolean;
  autoScroll: boolean;
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
  small: 'text-2xl',
  medium: 'text-3xl',
  large: 'text-4xl',
  xlarge: 'text-5xl'
};

const themeClasses = {
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 text-white',
  contrast: 'bg-black text-yellow-400'
};

export function HymnFullscreenViewer({ 
  hymn, 
  initialLanguage,
  onClose,
  onPlay,
  isPlaying = false,
  currentTime = 0,
  duration = 0
}: HymnFullscreenViewerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(
    initialLanguage || hymn.languages[0] || 'en'
  );
  const [settings, setSettings] = useState<ViewerSettings>({
    fontSize: 'medium',
    theme: 'dark',
    showVerseNumbers: true,
    autoScroll: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const getLanguageName = (code: string) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  const currentLyrics = hymn.lyrics[selectedLanguage] || '';
  const verses = currentLyrics.split('\n\n').filter(verse => verse.trim());

  // Auto-hide controls
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
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
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          onPlay?.(hymn.id);
          break;
        case 'ArrowLeft':
          setCurrentVerse(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setCurrentVerse(prev => Math.min(verses.length - 1, prev + 1));
          break;
        case 'ArrowUp':
          setCurrentVerse(0);
          break;
        case 'ArrowDown':
          setCurrentVerse(verses.length - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hymn.id, onClose, onPlay, verses.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const nextVerse = () => {
    setCurrentVerse(prev => Math.min(verses.length - 1, prev + 1));
  };

  const prevVerse = () => {
    setCurrentVerse(prev => Math.max(0, prev - 1));
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col ${themeClasses[settings.theme]} transition-all duration-300`}
    >
      {/* Header Controls */}
      <div 
        className={`absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
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
        <div className="absolute top-16 right-4 z-20 bg-black/80 backdrop-blur-sm rounded-lg p-4 space-y-4 text-white">
          <h3 className="font-semibold">Display Settings</h3>
          
          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-sm flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </label>
            <Select 
              value={settings.fontSize} 
              onValueChange={(value: ViewerSettings['fontSize']) => 
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
              onValueChange={(value: ViewerSettings['theme']) => 
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
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentLyrics ? (
          <div className="text-center max-w-4xl mx-auto">
            {settings.showVerseNumbers && verses.length > 1 && (
              <div className="mb-4">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Verse {currentVerse + 1} of {verses.length}
                </Badge>
              </div>
            )}
            <div 
              className={`${fontSizeClasses[settings.fontSize]} leading-relaxed whitespace-pre-line font-medium`}
            >
              {verses[currentVerse] || 'No lyrics available'}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No lyrics available in {getLanguageName(selectedLanguage)}</p>
            {hymn.languages.length > 1 && (
              <p className="text-sm mt-2 opacity-75">
                Try switching to another language
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Verse Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevVerse}
              disabled={currentVerse === 0}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm px-3">
              {currentVerse + 1} / {verses.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextVerse}
              disabled={currentVerse === verses.length - 1}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Audio Controls */}
          {hymn.audioFiles.length > 0 && (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPlay?.(hymn.id)}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-20 h-2 bg-white/20 rounded-lg appearance-none slider"
                />
              </div>

              {/* Time Display */}
              {duration > 0 && (
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {duration > 0 && (
            <div className="flex-1 mx-4">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 text-xs text-white/60 space-y-1">
        <div>ESC: Exit • SPACE: Play/Pause</div>
        <div>← →: Navigate verses • ↑ ↓: First/Last verse</div>
      </div>
    </div>
  );
}