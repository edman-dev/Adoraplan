'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, 
  Music, 
  Play, 
  Pause,
  ListMusic,
  Clock,
  Users,
  Calendar,
  Save,
  Shuffle,
  RotateCw,
  Trash2,
  GripVertical,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Hymn } from './HymnLibrary';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  organizationId: string;
  isPublic: boolean;
  tags: string[];
  hymns: PlaylistHymn[];
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistHymn {
  id: string;
  hymnId: string;
  position: number;
  hymn: Hymn;
  notes?: string;
  customTitle?: string;
  selectedLanguage?: string;
}

interface PlaylistManagerProps {
  organizationId: string;
  availableHymns: Hymn[];
  onPlaylistCreated?: (playlist: Playlist) => void;
  onPlaylistUpdated?: (playlist: Playlist) => void;
  onPlaylistDeleted?: (playlistId: string) => void;
}

interface CreatePlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => void;
  selectedHymns?: Hymn[];
  organizationId: string;
}

const playlistTags = [
  'Sunday Service',
  'Evening Service', 
  'Christmas',
  'Easter',
  'Communion',
  'Baptism',
  'Wedding',
  'Funeral',
  'Youth Service',
  'Prayer Meeting',
  'Contemporary',
  'Traditional',
  'Multilingual'
];

export function PlaylistManager({
  organizationId,
  availableHymns,
  onPlaylistCreated,
  onPlaylistUpdated,
  onPlaylistDeleted
}: PlaylistManagerProps) {
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, [organizationId]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/worship/playlists?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }

      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(playlist => {
      const matchesSearch = searchTerm === '' || 
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = selectedTag === 'all' || playlist.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [playlists, searchTerm, selectedTag]);

  const handleCreatePlaylist = async (playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/worship/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playlistData),
      });

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      const data = await response.json();
      const newPlaylist = data.playlist;
      
      setPlaylists(prev => [...prev, newPlaylist]);
      setShowCreateDialog(false);
      
      toast({
        title: 'Success',
        description: 'Playlist created successfully',
      });

      onPlaylistCreated?.(newPlaylist);
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      const response = await fetch(`/api/worship/playlists/${playlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
      
      toast({
        title: 'Success',
        description: 'Playlist deleted successfully',
      });

      onPlaylistDeleted?.(playlistId);
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete playlist',
        variant: 'destructive',
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Worship Playlists</h2>
          <p className="text-muted-foreground">
            Create and manage playlists for your worship services
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Playlist
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Playlists</Label>
              <Input
                id="search"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Filter by Tag</Label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {playlistTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onSelect={() => setSelectedPlaylist(playlist)}
            onPlay={() => setCurrentlyPlaying(playlist.id)}
            onDelete={() => handleDeletePlaylist(playlist.id)}
            isPlaying={currentlyPlaying === playlist.id}
          />
        ))}
        
        {filteredPlaylists.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No playlists found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || selectedTag !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'Create your first playlist to get started'
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Playlist
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Selected Playlist Detail */}
      {selectedPlaylist && (
        <PlaylistDetail
          playlist={selectedPlaylist}
          availableHymns={availableHymns}
          onUpdate={(updatedPlaylist) => {
            setPlaylists(prev => prev.map(p => 
              p.id === updatedPlaylist.id ? updatedPlaylist : p
            ));
            setSelectedPlaylist(updatedPlaylist);
            onPlaylistUpdated?.(updatedPlaylist);
          }}
          onClose={() => setSelectedPlaylist(null)}
        />
      )}

      {/* Create Playlist Dialog */}
      <CreatePlaylistDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={handleCreatePlaylist}
        organizationId={organizationId}
      />
    </div>
  );
}

function PlaylistCard({ 
  playlist, 
  onSelect, 
  onPlay, 
  onDelete, 
  isPlaying 
}: {
  playlist: Playlist;
  onSelect: () => void;
  onPlay: () => void;
  onDelete: () => void;
  isPlaying: boolean;
}) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{playlist.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {playlist.description || 'No description'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music className="h-3 w-3" />
              {playlist.hymns.length} hymns
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(playlist.duration)}
            </span>
          </div>

          {playlist.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {playlist.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {playlist.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{playlist.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Created {new Date(playlist.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlaylistDetail({ 
  playlist, 
  availableHymns, 
  onUpdate, 
  onClose 
}: {
  playlist: Playlist;
  availableHymns: Hymn[];
  onUpdate: (playlist: Playlist) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editedPlaylist, setEditedPlaylist] = useState(playlist);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/worship/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedPlaylist),
      });

      if (!response.ok) {
        throw new Error('Failed to update playlist');
      }

      const data = await response.json();
      onUpdate(data.playlist);
      setEditMode(false);
      
      toast({
        title: 'Success',
        description: 'Playlist updated successfully',
      });
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update playlist',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              {editMode ? (
                <Input
                  value={editedPlaylist.name}
                  onChange={(e) => setEditedPlaylist(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-bold"
                />
              ) : (
                playlist.name
              )}
            </CardTitle>
            <CardDescription>
              {editMode ? (
                <Textarea
                  value={editedPlaylist.description || ''}
                  onChange={(e) => setEditedPlaylist(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add description..."
                  rows={2}
                />
              ) : (
                playlist.description || 'No description'
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Playlist Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music className="h-4 w-4" />
              {playlist.hymns.length} hymns
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.floor(playlist.duration / 60)} minutes
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(playlist.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Tags */}
          {playlist.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {playlist.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Hymn List */}
          <div className="space-y-2">
            <h4 className="font-medium">Hymns in this playlist</h4>
            {playlist.hymns.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hymns in this playlist yet</p>
            ) : (
              <div className="space-y-2">
                {playlist.hymns.map((playlistHymn, index) => (
                  <div
                    key={playlistHymn.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {playlistHymn.customTitle || playlistHymn.hymn.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {playlistHymn.hymn.author}
                      </div>
                      {playlistHymn.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {playlistHymn.notes}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePlaylistDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedHymns = [],
  organizationId 
}: CreatePlaylistDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    const playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      createdBy: 'current-user', // This would come from auth context
      organizationId,
      isPublic,
      tags: selectedTags,
      hymns: selectedHymns.map((hymn, index) => ({
        id: `${hymn.id}-${index}`,
        hymnId: hymn.id,
        position: index,
        hymn,
      })),
      duration: selectedHymns.reduce((total, hymn) => {
        // Calculate duration based on hymn audio files or estimate
        const estimatedDuration = hymn.audioFiles?.[0]?.duration || 180; // Default 3 minutes
        return total + estimatedDuration;
      }, 0)
    };

    onSave(playlist);
    
    // Reset form
    setName('');
    setDescription('');
    setIsPublic(false);
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
          <DialogDescription>
            Create a new worship playlist from your hymn collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sunday Morning Service"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose or theme of this playlist..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {playlistTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {selectedHymns.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Hymns ({selectedHymns.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedHymns.map((hymn, index) => (
                  <div key={hymn.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span className="font-medium">{hymn.title}</span>
                    <span className="text-muted-foreground">by {hymn.author}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Create Playlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}