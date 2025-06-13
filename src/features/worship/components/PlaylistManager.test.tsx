import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlaylistManager } from './PlaylistManager';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock fetch
global.fetch = vi.fn();

const mockHymns = [
  {
    id: 'hymn1',
    title: 'Amazing Grace',
    author: 'John Newton',
    year: 1779,
    type: 'public' as const,
    isPublic: true,
    categories: ['Traditional', 'Grace'],
    doctrines: ['Salvation', 'Grace'],
    themes: ['Redemption', 'Love'],
    verses: 4,
    languages: ['en'],
    audioFiles: [
      {
        id: 'audio1',
        filename: 'amazing-grace.mp3',
        description: 'Piano version',
        duration: 240,
        language: 'en'
      }
    ],
    lyrics: { en: 'Amazing grace! How sweet the sound...' },
    createdBy: 'user1',
    isLiked: false,
    likeCount: 10
  },
  {
    id: 'hymn2',
    title: 'How Great Thou Art',
    author: 'Carl Boberg',
    year: 1885,
    type: 'public' as const,
    isPublic: true,
    categories: ['Praise', 'Traditional'],
    doctrines: ['Trinity', 'Creation'],
    themes: ['Worship', 'Majesty'],
    verses: 4,
    languages: ['en', 'sv'],
    audioFiles: [],
    lyrics: { 
      en: 'O Lord my God, when I in awesome wonder...',
      sv: 'Store Gud, när jag den värld betraktar...'
    },
    createdBy: 'user2',
    isLiked: true,
    likeCount: 25
  }
];

const mockPlaylists = [
  {
    id: 'playlist1',
    name: 'Sunday Morning Service',
    description: 'Hymns for our regular Sunday service',
    createdBy: 'user1',
    organizationId: 'org1',
    isPublic: false,
    tags: ['Sunday Service', 'Traditional'],
    hymns: [
      {
        id: 'ph1',
        hymnId: 'hymn1',
        position: 0,
        hymn: mockHymns[0]
      }
    ],
    duration: 240,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

describe('PlaylistManager', () => {
  const defaultProps = {
    organizationId: 'org1',
    availableHymns: mockHymns,
    onPlaylistCreated: vi.fn(),
    onPlaylistUpdated: vi.fn(),
    onPlaylistDeleted: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ playlists: mockPlaylists })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the playlist manager with header', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      expect(screen.getByText('Worship Playlists')).toBeInTheDocument();
      expect(screen.getByText('Create and manage playlists for your worship services')).toBeInTheDocument();
      expect(screen.getByText('Create Playlist')).toBeInTheDocument();
    });

    it('displays search and filter controls', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search & Filter')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search by name or description...')).toBeInTheDocument();
        expect(screen.getByText('Filter by Tag')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<PlaylistManager {...defaultProps} />);
      
      expect(screen.getByText('Loading playlists...')).toBeInTheDocument();
    });

    it('displays playlists after loading', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
        expect(screen.getByText('Hymns for our regular Sunday service')).toBeInTheDocument();
      });
    });
  });

  describe('Playlist Cards', () => {
    it('displays playlist information correctly', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
        expect(screen.getByText('1 hymns')).toBeInTheDocument();
        expect(screen.getByText('4 min')).toBeInTheDocument();
      });
    });

    it('shows playlist tags', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sunday Service')).toBeInTheDocument();
        expect(screen.getByText('Traditional')).toBeInTheDocument();
      });
    });

    it('handles play/pause button clicks', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const playButton = screen.getByRole('button', { name: /play/i });
        fireEvent.click(playButton);
        
        // Should show pause button after clicking play
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });
    });

    it('handles delete button clicks', async () => {
      // Mock window.confirm
      window.confirm = vi.fn(() => true);
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/playlists/playlist1',
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });

      expect(defaultProps.onPlaylistDeleted).toHaveBeenCalledWith('playlist1');
    });
  });

  describe('Search and Filtering', () => {
    it('filters playlists by search term', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or description...');
      fireEvent.change(searchInput, { target: { value: 'Evening' } });

      // Should hide the playlist since it doesn't match
      await waitFor(() => {
        expect(screen.queryByText('Sunday Morning Service')).not.toBeInTheDocument();
      });
    });

    it('filters playlists by tag', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
      });

      const tagSelect = screen.getByDisplayValue('All Tags');
      fireEvent.click(tagSelect);
      
      const christmasOption = await screen.findByText('Christmas');
      fireEvent.click(christmasOption);

      // Should hide the playlist since it doesn't have Christmas tag
      await waitFor(() => {
        expect(screen.queryByText('Sunday Morning Service')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Playlist Dialog', () => {
    it('opens create dialog when button is clicked', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      const createButton = screen.getByText('Create Playlist');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Playlist')).toBeInTheDocument();
        expect(screen.getByLabelText('Playlist Name *')).toBeInTheDocument();
      });
    });

    it('creates playlist with valid data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          playlist: {
            id: 'new-playlist',
            name: 'Test Playlist',
            organizationId: 'org1',
            createdBy: 'user1',
            hymns: []
          }
        })
      });

      render(<PlaylistManager {...defaultProps} />);
      
      const createButton = screen.getByText('Create Playlist');
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('Playlist Name *');
        fireEvent.change(nameInput, { target: { value: 'Test Playlist' } });

        const saveButton = screen.getByText('Create Playlist');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/playlists',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Test Playlist')
          })
        );
      });

      expect(defaultProps.onPlaylistCreated).toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      const createButton = screen.getByText('Create Playlist');
      fireEvent.click(createButton);

      await waitFor(() => {
        const saveButton = screen.getByText('Create Playlist');
        expect(saveButton).toBeDisabled();
      });
    });

    it('allows tag selection', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      const createButton = screen.getByText('Create Playlist');
      fireEvent.click(createButton);

      await waitFor(() => {
        const sundayServiceTag = screen.getByText('Sunday Service');
        fireEvent.click(sundayServiceTag);

        // Tag should appear selected
        expect(sundayServiceTag).toHaveClass('bg-primary');
      });
    });
  });

  describe('Playlist Detail View', () => {
    it('opens playlist detail when card is clicked', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const playlistCard = screen.getByText('Sunday Morning Service');
        fireEvent.click(playlistCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Hymns in this playlist')).toBeInTheDocument();
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      });
    });

    it('displays playlist statistics', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const playlistCard = screen.getByText('Sunday Morning Service');
        fireEvent.click(playlistCard);
      });

      await waitFor(() => {
        expect(screen.getByText('1 hymns')).toBeInTheDocument();
        expect(screen.getByText('4 minutes')).toBeInTheDocument();
      });
    });

    it('enables edit mode', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const playlistCard = screen.getByText('Sunday Morning Service');
        fireEvent.click(playlistCard);
      });

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        expect(screen.getByDisplayValue('Sunday Morning Service')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('saves playlist changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          playlist: {
            ...mockPlaylists[0],
            name: 'Updated Playlist Name'
          }
        })
      });

      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const playlistCard = screen.getByText('Sunday Morning Service');
        fireEvent.click(playlistCard);
      });

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        const nameInput = screen.getByDisplayValue('Sunday Morning Service');
        fireEvent.change(nameInput, { target: { value: 'Updated Playlist Name' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/playlists/playlist1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });

      expect(defaultProps.onPlaylistUpdated).toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no playlists exist', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ playlists: [] })
      });

      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No playlists found')).toBeInTheDocument();
        expect(screen.getByText('Create your first playlist to get started')).toBeInTheDocument();
        expect(screen.getByText('Create First Playlist')).toBeInTheDocument();
      });
    });

    it('shows filtered empty state', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by name or description...');
        fireEvent.change(searchInput, { target: { value: 'NonexistentPlaylist' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        // Should still render the component without crashing
        expect(screen.getByText('Worship Playlists')).toBeInTheDocument();
      });
    });

    it('handles playlist creation errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Creation failed' })
      });

      render(<PlaylistManager {...defaultProps} />);
      
      const createButton = screen.getByText('Create Playlist');
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('Playlist Name *');
        fireEvent.change(nameInput, { target: { value: 'Test Playlist' } });

        const saveButton = screen.getByText('Create Playlist');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        // Error handling would be verified through toast calls
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper labels and roles', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/search playlists/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create playlist/i })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<PlaylistManager {...defaultProps} />);
      
      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create playlist/i });
        expect(createButton).toHaveAttribute('tabindex');
      });
    });
  });
});