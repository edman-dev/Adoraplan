'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Globe, 
  Music, 
  Download, 
  Copy, 
  Play,
  Calendar,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import { HymnViewer } from '@/features/worship/components/HymnViewer';
import { HymnPlayer } from '@/features/worship/components/HymnPlayer';
import { HymnKaraokeViewer } from '@/features/worship/components/HymnKaraokeViewer';
import { useToast } from '@/hooks/use-toast';

interface SharedHymn {
  id: string;
  title: string;
  author: string;
  year?: number;
  copyright?: string;
  type: string;
  languages: string[];
  lyrics: Array<{
    language: string;
    content: string;
  }>;
  audioFiles?: Array<{
    id: string;
    filename: string;
    url?: string;
    description?: string;
    language: string;
    duration?: number;
    format?: string;
  }>;
  categories: string[];
  themes: string[];
  doctrines: string[];
  shareSettings: {
    visibility: string;
    allowDownload: boolean;
    allowCopy: boolean;
    requireLogin: boolean;
    expirationDate?: string;
    password?: string;
  };
}

export default function SharedHymnPage() {
  const params = useParams();
  const { toast } = useToast();
  const shareId = params.shareId as string;
  
  const [hymn, setHymn] = useState<SharedHymn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [showKaraoke, setShowKaraoke] = useState(false);

  useEffect(() => {
    if (shareId) {
      fetchSharedHymn();
    }
  }, [shareId]);

  const fetchSharedHymn = async (providedPassword?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (providedPassword) {
        headers['X-Share-Password'] = providedPassword;
      }
      
      const response = await fetch(`/api/public/hymn/share/${shareId}`, {
        headers
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.requiresPassword) {
          setPasswordRequired(true);
          return;
        }
        if (data.requiresLogin) {
          setError('This hymn requires you to be logged in');
          return;
        }
      }

      if (response.status === 404) {
        setError('This shared hymn could not be found');
        return;
      }

      if (response.status === 410) {
        setError('This share link has expired');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load shared hymn');
      }

      const data = await response.json();
      setHymn(data.hymn);
      setPasswordRequired(false);
    } catch (err) {
      console.error('Error fetching shared hymn:', err);
      setError('Failed to load hymn. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      fetchSharedHymn(password);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'pptx') => {
    if (!hymn || !hymn.shareSettings.allowDownload) {
      toast({
        title: "Download not allowed",
        description: "The owner has disabled downloads for this hymn",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/public/hymn/share/${shareId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error('Failed to export hymn');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${hymn.title.replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Downloading ${hymn.title} as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download hymn",
        variant: "destructive"
      });
    }
  };

  const handleCopyText = async () => {
    if (!hymn || !hymn.shareSettings.allowCopy) {
      toast({
        title: "Copy not allowed",
        description: "The owner has disabled text copying for this hymn",
        variant: "destructive"
      });
      return;
    }

    try {
      const lyricsText = hymn.lyrics.map(l => 
        `${l.language.toUpperCase()}:\n${l.content}`
      ).join('\n\n---\n\n');
      
      await navigator.clipboard.writeText(lyricsText);
      toast({
        title: "Copied!",
        description: "Hymn lyrics copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy lyrics",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared hymn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Hymn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">{error}</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Required
            </CardTitle>
            <CardDescription>
              This hymn is password protected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Access Hymn
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hymn) {
    return null;
  }

  if (showKaraoke) {
    return (
      <HymnKaraokeViewer
        hymn={hymn as any}
        initialLanguage={hymn.languages[0]}
        onClose={() => setShowKaraoke(false)}
        isFullscreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hymn.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {hymn.author}
                </span>
                {hymn.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {hymn.year}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hymn.shareSettings.visibility === 'public' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Public
                </Badge>
              )}
              {hymn.shareSettings.expirationDate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires {new Date(hymn.shareSettings.expirationDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {hymn.shareSettings.allowCopy && (
              <Button variant="outline" size="sm" onClick={handleCopyText}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Lyrics
              </Button>
            )}
            {hymn.shareSettings.allowDownload && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload('docx')}>
                  <Download className="h-4 w-4 mr-2" />
                  Word
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload('pptx')}>
                  <Download className="h-4 w-4 mr-2" />
                  PowerPoint
                </Button>
              </>
            )}
            {hymn.audioFiles && hymn.audioFiles.length > 0 && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowKaraoke(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Play className="h-4 w-4 mr-2" />
                Karaoke Mode
              </Button>
            )}
          </div>
        </div>

        {/* Categories and Tags */}
        {(hymn.categories.length > 0 || hymn.themes.length > 0 || hymn.doctrines.length > 0) && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {hymn.categories.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium min-w-[80px]">Categories:</span>
                    <div className="flex flex-wrap gap-1">
                      {hymn.categories.map((category) => (
                        <Badge key={category} variant="secondary">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {hymn.themes.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium min-w-[80px]">Themes:</span>
                    <div className="flex flex-wrap gap-1">
                      {hymn.themes.map((theme) => (
                        <Badge key={theme} variant="outline">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {hymn.doctrines.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium min-w-[80px]">Doctrines:</span>
                    <div className="flex flex-wrap gap-1">
                      {hymn.doctrines.map((doctrine) => (
                        <Badge key={doctrine} variant="outline">{doctrine}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hymn Viewer */}
        <div className="space-y-6">
          <HymnViewer
            hymn={hymn as any}
            onClose={() => {}}
          />

          {/* Audio Player */}
          {hymn.audioFiles && hymn.audioFiles.length > 0 && (
            <HymnPlayer
              hymnId={hymn.id}
              title={hymn.title}
              author={hymn.author}
              audioFiles={hymn.audioFiles.map(af => ({
                id: af.id,
                url: af.url || `/api/public/hymn/share/${shareId}/audio/${af.id}`,
                filename: af.filename,
                description: af.description || '',
                language: af.language,
                duration: af.duration || 180,
                format: af.format || 'mp3'
              }))}
              lyrics={hymn.lyrics.reduce((acc, lyric) => {
                acc[lyric.language] = lyric.content;
                return acc;
              }, {} as Record<string, string>)}
              languages={hymn.languages}
              showLyrics={false}
            />
          )}
        </div>

        {/* Copyright Notice */}
        {hymn.copyright && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                {hymn.copyright}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}