'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Plus, 
  Music, 
  Globe, 
  Play, 
  Pause,
  Heart,
  Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HymnCreationForm } from './HymnCreationForm';
import { HymnViewer } from './HymnViewer';
import { HymnFullscreenViewer } from './HymnFullscreenViewer';
import { HymnPlayer } from './HymnPlayer';
import { HymnKaraokeViewer } from './HymnKaraokeViewer';
import { HymnSharingDialog } from './HymnSharingDialog';
import { HymnSelector } from './HymnSelector';
import { PlaylistManager } from './PlaylistManager';

export interface Hymn {
  id: string;
  title: string;
  author: string;
  year?: number;
  copyright?: string;
  type: 'official' | 'user_created' | 'public';
  isPublic: boolean;
  categories: string[];
  doctrines: string[];
  themes: string[];
  verses: number;
  languages: string[];
  audioFiles: {
    id: string;
    filename: string;
    description?: string;
    duration?: number;
    language: string;
  }[];
  lyrics: {
    language: string;
    content: string;
  }[];
  organizationId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  likeCount: number;
}

interface HymnLibraryProps {
  organizationId: string;
  onHymnSelect?: (hymn: Hymn) => void;
  selectionMode?: boolean;
  selectedHymns?: string[];
}

const COMMON_CATEGORIES = [
  'Worship & Praise',
  'Prayer & Devotion',
  'Salvation & Grace',
  'Christmas',
  'Easter',
  'Baptism',
  'Communion',
  'Fellowship',
  'Mission & Evangelism',
  'Thanksgiving',
  'Wedding',
  'Funeral',
];

const COMMON_DOCTRINES = [
  'Trinity',
  'Salvation',
  'Grace',
  'Faith',
  'Love',
  'Hope',
  'Redemption',
  'Forgiveness',
  'Eternal Life',
  'Holy Spirit',
  'Prayer',
  'Scripture',
];

const COMMON_THEMES = [
  'Adoration',
  'Celebration',
  'Comfort',
  'Confession',
  'Discipleship',
  'Guidance',
  'Healing',
  'Joy',
  'Peace',
  'Strength',
  'Trust',
  'Unity',
];

export function HymnLibrary({ 
  organizationId, 
  onHymnSelect, 
  selectionMode = false,
  selectedHymns = []
}: HymnLibraryProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDoctrine, setSelectedDoctrine] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [hymnType, setHymnType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [showHymnViewer, setShowHymnViewer] = useState(false);
  const [showFullscreenViewer, setShowFullscreenViewer] = useState(false);
  const [showKaraokeViewer, setShowKaraokeViewer] = useState(false);
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [fullscreenLanguage, setFullscreenLanguage] = useState<string>('en');

  // Get available languages from hymns
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    hymns.forEach(hymn => {
      hymn.languages.forEach(lang => languages.add(lang));
    });
    return Array.from(languages).sort();
  }, [hymns]);

  // Filter and search hymns
  const filteredHymns = useMemo(() => {
    return hymns.filter(hymn => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          hymn.title.toLowerCase().includes(searchLower) ||
          hymn.author.toLowerCase().includes(searchLower) ||
          hymn.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
          hymn.doctrines.some(doc => doc.toLowerCase().includes(searchLower)) ||
          hymn.themes.some(theme => theme.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && !hymn.categories.includes(selectedCategory)) {
        return false;
      }

      // Doctrine filter
      if (selectedDoctrine !== 'all' && !hymn.doctrines.includes(selectedDoctrine)) {
        return false;
      }

      // Theme filter
      if (selectedTheme !== 'all' && !hymn.themes.includes(selectedTheme)) {
        return false;
      }

      // Language filter
      if (selectedLanguage !== 'all' && !hymn.languages.includes(selectedLanguage)) {
        return false;
      }

      // Type filter
      if (hymnType !== 'all' && hymn.type !== hymnType) {
        return false;
      }

      // Tab filter
      if (activeTab === 'liked' && !hymn.isLiked) {
        return false;
      }
      if (activeTab === 'my_hymns' && hymn.createdBy !== user?.id) {
        return false;
      }

      return true;
    });
  }, [hymns, searchTerm, selectedCategory, selectedDoctrine, selectedTheme, selectedLanguage, hymnType, activeTab, user?.id]);

  // Fetch hymns
  const fetchHymns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/worship/hymns?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hymns');
      }

      const result = await response.json();
      setHymns(result.data || []);
    } catch (error) {
      console.error('Error fetching hymns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hymn library',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchHymns();
    }
  }, [organizationId]);

  // Handle hymn selection
  const handleHymnSelect = (hymn: Hymn) => {
    if (selectionMode && onHymnSelect) {
      onHymnSelect(hymn);
    } else {
      // Open hymn viewer in non-selection mode
      setSelectedHymn(hymn);
      setShowHymnViewer(true);
    }
  };

  // Handle like/unlike
  const handleToggleLike = async (hymnId: string) => {
    try {
      const response = await fetch(`/api/worship/hymns/${hymnId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setHymns(prev => prev.map(hymn => 
          hymn.id === hymnId 
            ? { 
                ...hymn, 
                isLiked: !hymn.isLiked,
                likeCount: hymn.isLiked ? hymn.likeCount - 1 : hymn.likeCount + 1
              }
            : hymn
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle audio playback
  const handlePlayPause = (hymnId: string) => {
    if (currentlyPlaying === hymnId) {
      setCurrentlyPlaying(null);
      // Stop audio playback
    } else {
      setCurrentlyPlaying(hymnId);
      // Start audio playback
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDoctrine('all');
    setSelectedTheme('all');
    setSelectedLanguage('all');
    setHymnType('all');
  };

  // Handle fullscreen viewer
  const handleFullscreen = (hymn: Hymn, language: string) => {
    setSelectedHymn(hymn);
    setFullscreenLanguage(language);
    setShowFullscreenViewer(true);
    setShowHymnViewer(false);
  };

  // Handle karaoke mode
  const handleKaraokeMode = (hymn: Hymn, language: string) => {
    setSelectedHymn(hymn);
    setFullscreenLanguage(language);
    setShowKaraokeViewer(true);
    setShowHymnViewer(false);
  };

  // Handle language change in viewer
  const handleLanguageChange = (language: string) => {
    // Language switching is handled internally by the viewer components
  };

  // Handle share dialog
  const handleShare = (hymn: Hymn) => {
    setSelectedHymn(hymn);
    setShowSharingDialog(true);
  };

  // Get hymn type badge
  const getHymnTypeBadge = (hymn: Hymn) => {
    switch (hymn.type) {
      case 'official':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Official</Badge>;
      case 'public':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Public</Badge>;
      case 'user_created':
        return hymn.isPublic 
          ? <Badge variant="outline" className="border-green-500 text-green-700">Shared</Badge>
          : <Badge variant="outline">Private</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hymn library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hymn Library</h2>
          <p className="text-muted-foreground">
            Browse, search, and manage your worship hymns
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Hymn
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hymns by title, author, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select value={hymnType} onValueChange={setHymnType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="official">Official</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="user_created">My Hymns</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {COMMON_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDoctrine} onValueChange={setSelectedDoctrine}>
              <SelectTrigger>
                <SelectValue placeholder="Doctrine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctrines</SelectItem>
                {COMMON_DOCTRINES.map(doctrine => (
                  <SelectItem key={doctrine} value={doctrine}>{doctrine}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes</SelectItem>
                {COMMON_THEMES.map(theme => (
                  <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {availableLanguages.map(language => (
                  <SelectItem key={language} value={language}>{language}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Hymns ({hymns.length})</TabsTrigger>
          <TabsTrigger value="liked">Liked ({hymns.filter(h => h.isLiked).length})</TabsTrigger>
          <TabsTrigger value="my_hymns">My Hymns ({hymns.filter(h => h.createdBy === user?.id).length})</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="playlist_creator">Create Playlist</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {/* Results */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredHymns.map((hymn) => (
              <Card 
                key={hymn.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedHymns.includes(hymn.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => !selectionMode && handleHymnSelect(hymn)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{hymn.title}</CardTitle>
                      <CardDescription className="mt-1">
                        by {hymn.author}
                        {hymn.year && ` (${hymn.year})`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {getHymnTypeBadge(hymn)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Categories */}
                  {hymn.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hymn.categories.slice(0, 3).map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {hymn.categories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{hymn.categories.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {hymn.verses} verses
                      </span>
                      {hymn.languages.length > 1 && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {hymn.languages.length} languages
                        </span>
                      )}
                      {hymn.audioFiles.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          Audio
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {hymn.audioFiles.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPause(hymn.id);
                          }}
                        >
                          {currentlyPlaying === hymn.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(hymn.id);
                        }}
                        className={hymn.isLiked ? 'text-red-500 hover:text-red-600' : ''}
                      >
                        <Heart className={`h-4 w-4 ${hymn.isLiked ? 'fill-current' : ''}`} />
                        {hymn.likeCount > 0 && (
                          <span className="ml-1 text-xs">{hymn.likeCount}</span>
                        )}
                      </Button>
                    </div>

                    {selectionMode && (
                      <Button
                        variant={selectedHymns.includes(hymn.id) ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHymnSelect(hymn);
                        }}
                      >
                        {selectedHymns.includes(hymn.id) ? 'Selected' : 'Select'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredHymns.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Music className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hymns found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || selectedCategory !== 'all' || selectedDoctrine !== 'all' || selectedTheme !== 'all' || selectedLanguage !== 'all' || hymnType !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Get started by adding your first hymn to the library'
                  }
                </p>
                {searchTerm || selectedCategory !== 'all' || selectedDoctrine !== 'all' || selectedTheme !== 'all' || selectedLanguage !== 'all' || hymnType !== 'all' ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Hymn
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredHymns.filter(h => h.isLiked).map((hymn) => (
              <Card 
                key={hymn.id} 
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleHymnSelect(hymn)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{hymn.title}</CardTitle>
                      <CardDescription>by {hymn.author}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHymnTypeBadge(hymn)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPause(hymn.id);
                        }}
                      >
                        {currentlyPlaying === hymn.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hymn.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hymn.categories.slice(0, 3).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {hymn.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{hymn.categories.length - 3}</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{hymn.verses} verses</span>
                      {hymn.audioFiles && hymn.audioFiles.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          Audio
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my_hymns" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredHymns.filter(h => h.createdBy === user?.id).map((hymn) => (
              <Card 
                key={hymn.id} 
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleHymnSelect(hymn)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{hymn.title}</CardTitle>
                      <CardDescription>by {hymn.author}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHymnTypeBadge(hymn)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPause(hymn.id);
                        }}
                      >
                        {currentlyPlaying === hymn.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hymn.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hymn.categories.slice(0, 3).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {hymn.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{hymn.categories.length - 3}</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{hymn.verses} verses</span>
                      {hymn.audioFiles && hymn.audioFiles.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          Audio
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="playlists" className="mt-6">
          <PlaylistManager
            organizationId={organizationId}
            availableHymns={hymns}
            onPlaylistCreated={(playlist) => {
              toast({
                title: "Playlist Created",
                description: `"${playlist.name}" has been created successfully`,
              });
            }}
            onPlaylistUpdated={(playlist) => {
              toast({
                title: "Playlist Updated",
                description: `"${playlist.name}" has been updated`,
              });
            }}
            onPlaylistDeleted={(playlistId) => {
              toast({
                title: "Playlist Deleted",
                description: "Playlist has been deleted successfully",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="playlist_creator" className="mt-6">
          <HymnSelector
            availableHymns={hymns}
            selectedHymns={[]}
            onSelectionChange={() => {}}
            onCreatePlaylist={(selectedHymns) => {
              // This would open the create playlist dialog with selected hymns
              setShowPlaylistCreator(true);
            }}
            maxSelection={25}
            showPlaylistCreation={true}
          />
        </TabsContent>
      </Tabs>

      {/* Create Hymn Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <HymnCreationForm
            organizationId={organizationId}
            onSuccess={(newHymn) => {
              setHymns(prev => [newHymn, ...prev]);
              setShowCreateDialog(false);
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Hymn Viewer Dialog */}
      <Dialog open={showHymnViewer} onOpenChange={setShowHymnViewer}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          {selectedHymn && (
            <div className="space-y-6">
              <HymnViewer
                hymn={selectedHymn}
                onClose={() => setShowHymnViewer(false)}
                onLanguageChange={handleLanguageChange}
                onToggleLike={handleToggleLike}
                onPlay={handlePlayPause}
                onFullscreen={handleFullscreen}
                onKaraokeMode={handleKaraokeMode}
                onShare={handleShare}
                isPlaying={currentlyPlaying === selectedHymn.id}
              />
              
              {/* Audio Player Integration */}
              {selectedHymn.audioFiles && selectedHymn.audioFiles.length > 0 && (
                <HymnPlayer
                  hymnId={selectedHymn.id}
                  title={selectedHymn.title}
                  author={selectedHymn.author}
                  audioFiles={selectedHymn.audioFiles.map(af => ({
                    id: af.id,
                    url: af.url || `/api/worship/audio/${af.id}`,
                    filename: af.filename,
                    description: af.description || '',
                    language: af.language,
                    duration: af.duration || 180,
                    format: af.format || 'mp3'
                  }))}
                  lyrics={selectedHymn.lyrics?.reduce((acc, lyric) => {
                    acc[lyric.language] = lyric.content;
                    return acc;
                  }, {} as Record<string, string>) || {}}
                  languages={selectedHymn.languages}
                  onPlayerStateChange={(isPlaying, currentTime) => {
                    if (isPlaying) {
                      setCurrentlyPlaying(selectedHymn.id);
                    } else {
                      setCurrentlyPlaying(null);
                    }
                  }}
                  showLyrics={true}
                  syncMode="auto"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Hymn Viewer */}
      {showFullscreenViewer && selectedHymn && (
        <HymnFullscreenViewer
          hymn={selectedHymn}
          initialLanguage={fullscreenLanguage}
          onClose={() => setShowFullscreenViewer(false)}
          onPlay={handlePlayPause}
          isPlaying={currentlyPlaying === selectedHymn.id}
        />
      )}

      {/* Karaoke Mode Viewer */}
      {showKaraokeViewer && selectedHymn && (
        <HymnKaraokeViewer
          hymn={selectedHymn}
          initialLanguage={fullscreenLanguage}
          onClose={() => setShowKaraokeViewer(false)}
          isFullscreen={true}
          onFullscreenToggle={() => {
            // Toggle between windowed and fullscreen karaoke mode
            setShowKaraokeViewer(false);
            setShowHymnViewer(true);
          }}
        />
      )}

      {/* Sharing Dialog */}
      {showSharingDialog && selectedHymn && (
        <HymnSharingDialog
          hymn={selectedHymn}
          isOpen={showSharingDialog}
          onClose={() => setShowSharingDialog(false)}
          organizationId={organizationId}
          currentUserId={user?.id || ''}
          userRole={user?.publicMetadata?.worshipRole as string || 'member'}
        />
      )}
    </div>
  );
}