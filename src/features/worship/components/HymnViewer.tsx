'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Music, 
  Volume2, 
  Play, 
  Pause, 
  Maximize, 
  Heart, 
  Share, 
  Download,
  Clock,
  User,
  Calendar,
  Copyright,
  Tv2
} from 'lucide-react';
import { Hymn } from './HymnLibrary';

interface HymnViewerProps {
  hymn: Hymn;
  onClose?: () => void;
  onLanguageChange?: (language: string) => void;
  onToggleLike?: (hymnId: string) => void;
  onPlay?: (hymnId: string) => void;
  onFullscreen?: (hymn: Hymn, language: string) => void;
  onKaraokeMode?: (hymn: Hymn, language: string) => void;
  onShare?: (hymn: Hymn) => void;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
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

export function HymnViewer({ 
  hymn, 
  onClose, 
  onLanguageChange,
  onToggleLike,
  onPlay,
  onFullscreen,
  onKaraokeMode,
  onShare,
  isPlaying = false,
  currentTime = 0,
  duration = 0
}: HymnViewerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(
    hymn.languages[0] || 'en'
  );
  const [activeTab, setActiveTab] = useState('lyrics');

  const getLanguageName = (code: string) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  const currentLyrics = hymn.lyrics[selectedLanguage] || '';
  const formattedLyrics = useMemo(() => {
    if (!currentLyrics) return [];
    
    // Split lyrics into verses (separated by double line breaks)
    const verses = currentLyrics.split('\n\n').filter(verse => verse.trim());
    return verses.map((verse, index) => ({
      number: index + 1,
      content: verse.trim()
    }));
  }, [currentLyrics]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    onLanguageChange?.(language);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{hymn.title}</h1>
            <div className="flex items-center gap-2">
              {hymn.type === 'official' && (
                <Badge variant="default">Official</Badge>
              )}
              {hymn.type === 'public' && (
                <Badge variant="secondary">Public</Badge>
              )}
              {hymn.isPublic && (
                <Badge variant="outline">Shared</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{hymn.author}</span>
            </div>
            {hymn.year && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{hymn.year}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Music className="h-4 w-4" />
              <span>{formattedLyrics.length} verses</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleLike?.(hymn.id)}
            className={hymn.isLiked ? 'text-red-500 hover:text-red-600' : ''}
          >
            <Heart className={`h-4 w-4 ${hymn.isLiked ? 'fill-current' : ''}`} />
            {hymn.likeCount > 0 && <span className="ml-1">{hymn.likeCount}</span>}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onShare?.(hymn)}
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onFullscreen?.(hymn, selectedLanguage)}
          >
            <Maximize className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          {hymn.audioFiles && hymn.audioFiles.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onKaraokeMode?.(hymn, selectedLanguage)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600"
            >
              <Tv2 className="h-4 w-4 mr-2" />
              Karaoke Mode
            </Button>
          )}
        </div>
      </div>

      {/* Language Selector */}
      {hymn.languages.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Selection
            </CardTitle>
            <CardDescription>
              This hymn is available in {hymn.languages.length} languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {hymn.languages.map((lang) => (
                <Button
                  key={lang}
                  variant={selectedLanguage === lang ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLanguageChange(lang)}
                  className="flex items-center gap-2"
                >
                  {getLanguageName(lang)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audio Player */}
      {hymn.audioFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Player
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPlay?.(hymn.id)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              {duration > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}

            {/* Audio File Selection */}
            {hymn.audioFiles.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Audio Version:</label>
                <Select defaultValue={hymn.audioFiles[0]?.id}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hymn.audioFiles.map((audio) => (
                      <SelectItem key={audio.id} value={audio.id}>
                        {audio.description || audio.filename} 
                        {audio.language && ` (${getLanguageName(audio.language)})`}
                        {audio.duration && ` - ${formatTime(audio.duration)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
          <TabsTrigger value="metadata">Details</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="lyrics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lyrics in {getLanguageName(selectedLanguage)}</span>
                {hymn.languages.length > 1 && (
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[200px]">
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLyrics ? (
                <div className="space-y-6">
                  {formattedLyrics.map((verse) => (
                    <div key={verse.number} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Verse {verse.number}
                        </Badge>
                      </div>
                      <div className="text-lg leading-relaxed whitespace-pre-line pl-4 border-l-2 border-muted">
                        {verse.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No lyrics available in {getLanguageName(selectedLanguage)}</p>
                  {hymn.languages.length > 1 && (
                    <p className="text-sm mt-2">
                      Try switching to another language using the selector above
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hymn Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p className="text-lg">{hymn.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Author</label>
                  <p className="text-lg">{hymn.author}</p>
                </div>
                {hymn.composer && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Composer</label>
                    <p>{hymn.composer}</p>
                  </div>
                )}
                {hymn.year && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Year</label>
                    <p>{hymn.year}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="capitalize">{hymn.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Languages</label>
                  <p>{hymn.languages.map(lang => getLanguageName(lang)).join(', ')}</p>
                </div>
              </div>

              {hymn.copyright && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Copyright className="h-4 w-4" />
                    Copyright Information
                  </label>
                  <p className="mt-2 text-sm">{hymn.copyright}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Categories */}
            {hymn.categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hymn.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Themes */}
            {hymn.themes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Themes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hymn.themes.map((theme) => (
                      <Badge key={theme} variant="outline">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Doctrines */}
            {hymn.doctrines.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Doctrines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hymn.doctrines.map((doctrine) => (
                      <Badge key={doctrine} variant="default">
                        {doctrine}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}