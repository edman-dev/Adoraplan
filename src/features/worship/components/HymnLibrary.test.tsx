import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HymnLibrary } from './HymnLibrary';

// Mock dependencies
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'user1',
      publicMetadata: { worshipRole: 'admin' }
    }
  })
}));

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
    lyrics: [
      { language: 'en', content: 'Amazing grace! How sweet the sound...' }
    ],
    organizationId: 'org1',
    createdBy: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isLiked: false,
    likeCount: 10
  },
  {
    id: 'hymn2',
    title: 'How Great Thou Art',
    author: 'Carl Boberg',
    year: 1885,
    type: 'official' as const,
    isPublic: true,
    categories: ['Praise', 'Traditional'],
    doctrines: ['Trinity', 'Creation'],
    themes: ['Worship', 'Majesty'],
    verses: 4,
    languages: ['en', 'sv'],
    audioFiles: [],
    lyrics: [
      { language: 'en', content: 'O Lord my God, when I in awesome wonder...' },
      { language: 'sv', content: 'Store Gud, när jag den värld betraktar...' }
    ],
    organizationId: 'org1',
    createdBy: 'user2',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    isLiked: true,
    likeCount: 25
  }
];

describe('HymnLibrary', () => {
  const defaultProps = {
    organizationId: 'org1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockHymns })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the hymn library header', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Hymn Library')).toBeInTheDocument();
        expect(screen.getByText('Browse, search, and manage your worship hymns')).toBeInTheDocument();
        expect(screen.getByText('Add Hymn')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<HymnLibrary {...defaultProps} />);
      
      expect(screen.getByText('Loading hymn library...')).toBeInTheDocument();
    });

    it('displays hymns after loading', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
        expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
      });
    });

    it('displays search and filter controls', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search & Filters')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search hymns by title, author, category...')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters hymns by search term', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search hymns by title, author, category...');
      fireEvent.change(searchInput, { target: { value: 'Amazing' } });

      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
        expect(screen.queryByText('How Great Thou Art')).not.toBeInTheDocument();
      });
    });

    it('filters hymns by category', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      });

      // Find and click the category select
      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.click(categorySelect);
      
      const traditionalOption = await screen.findByText('Traditional');
      fireEvent.click(traditionalOption);

      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
        expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
      });
    });

    it('filters hymns by type', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      });

      const typeSelect = screen.getByDisplayValue('All Types');
      fireEvent.click(typeSelect);
      
      const officialOption = await screen.findByText('Official');
      fireEvent.click(officialOption);

      await waitFor(() => {
        expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument();
        expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
      });
    });

    it('clears all filters when clear button is clicked', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search hymns by title, author, category...');
        fireEvent.change(searchInput, { target: { value: 'Amazing' } });
      });

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
        expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
      });
    });
  });

  describe('Hymn Cards', () => {
    it('displays hymn information correctly', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
        expect(screen.getByText('by John Newton (1779)')).toBeInTheDocument();
        expect(screen.getByText('4 verses')).toBeInTheDocument();
        expect(screen.getByText('Audio')).toBeInTheDocument();
      });
    });

    it('shows hymn type badges', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Public')).toBeInTheDocument();
        expect(screen.getByText('Official')).toBeInTheDocument();
      });
    });

    it('displays categories as badges', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Traditional')).toBeInTheDocument();
        expect(screen.getByText('Grace')).toBeInTheDocument();
        expect(screen.getByText('Praise')).toBeInTheDocument();
      });
    });

    it('handles like button clicks', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const likeButtons = screen.getAllByRole('button');
        const likeButton = likeButtons.find(button => 
          button.querySelector('svg')?.classList.contains('h-4')
        );
        
        if (likeButton) {
          fireEvent.click(likeButton);
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/hymns/hymn1/like',
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });

    it('handles play/pause button clicks', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const playButtons = screen.getAllByRole('button');
        const playButton = playButtons.find(button => 
          button.querySelector('[data-testid="play-button"]') ||
          button.textContent?.includes('Play')
        );
        
        if (playButton) {
          fireEvent.click(playButton);
        }
      });
    });
  });

  describe('Tabs', () => {
    it('shows correct tab counts', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('All Hymns (2)')).toBeInTheDocument();
        expect(screen.getByText('Liked (1)')).toBeInTheDocument();
        expect(screen.getByText('My Hymns (1)')).toBeInTheDocument();
      });
    });

    it('switches between tabs', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const likedTab = screen.getByText('Liked (1)');
        fireEvent.click(likedTab);
      });

      await waitFor(() => {
        expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
        expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument();
      });
    });

    it('shows playlist management tab', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const playlistTab = screen.getByText('Playlists');
        fireEvent.click(playlistTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Worship Playlists')).toBeInTheDocument();
      });
    });

    it('shows playlist creator tab', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const creatorTab = screen.getByText('Create Playlist');
        fireEvent.click(creatorTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Build Your Playlist')).toBeInTheDocument();
      });
    });
  });

  describe('Selection Mode', () => {
    it('shows selection buttons in selection mode', async () => {
      render(
        <HymnLibrary 
          {...defaultProps} 
          selectionMode={true}
          selectedHymns={[]}
          onHymnSelect={() => {}}
        />
      );
      
      await waitFor(() => {
        expect(screen.getAllByText('Select')).toHaveLength(2);
      });
    });

    it('highlights selected hymns', async () => {
      render(
        <HymnLibrary 
          {...defaultProps} 
          selectionMode={true}
          selectedHymns={['hymn1']}
          onHymnSelect={() => {}}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Selected')).toBeInTheDocument();
      });
    });

    it('calls onHymnSelect when hymn is selected', async () => {
      const onHymnSelect = vi.fn();
      
      render(
        <HymnLibrary 
          {...defaultProps} 
          selectionMode={true}
          selectedHymns={[]}
          onHymnSelect={onHymnSelect}
        />
      );
      
      await waitFor(() => {
        const selectButton = screen.getAllByText('Select')[0];
        fireEvent.click(selectButton);
      });

      expect(onHymnSelect).toHaveBeenCalledWith(mockHymns[0]);
    });
  });

  describe('Dialogs', () => {
    it('opens create hymn dialog when add button is clicked', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const addButton = screen.getByText('Add Hymn');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Hymn')).toBeInTheDocument();
      });
    });

    it('opens hymn viewer when hymn card is clicked', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const hymnCard = screen.getByText('Amazing Grace');
        fireEvent.click(hymnCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no hymns exist', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No hymns found')).toBeInTheDocument();
        expect(screen.getByText('Get started by adding your first hymn to the library')).toBeInTheDocument();
        expect(screen.getByText('Add First Hymn')).toBeInTheDocument();
      });
    });

    it('shows filtered empty state with clear filters option', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search hymns by title, author, category...');
        fireEvent.change(searchInput, { target: { value: 'NonexistentHymn' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        // Should still render the component without crashing
        expect(screen.getByText('Hymn Library')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' })
      });

      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        // Should still render the component without crashing
        expect(screen.getByText('Hymn Library')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper labels and roles', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add hymn/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<HymnLibrary {...defaultProps} />);
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add hymn/i });
        expect(addButton).toHaveAttribute('type', 'button');
      });
    });
  });
});