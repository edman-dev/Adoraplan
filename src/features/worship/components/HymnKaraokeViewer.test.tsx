import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HymnKaraokeViewer } from './HymnKaraokeViewer';
import { formatDuration } from '@/libs/audio/AudioProcessor';

// Mock the dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/libs/audio/AudioProcessor', () => ({
  formatDuration: vi.fn((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  })
}));

vi.mock('./HymnPlayer', () => ({
  HymnPlayer: ({ onPlayerStateChange, showLyrics }: any) => {
    // Simulate player state changes
    React.useEffect(() => {
      onPlayerStateChange?.(false, 0);
    }, [onPlayerStateChange]);
    
    return (
      <div data-testid="hymn-player">
        <button onClick={() => onPlayerStateChange?.(true, 10)}>Play</button>
        <button onClick={() => onPlayerStateChange?.(false, 0)}>Pause</button>
      </div>
    );
  }
}));

const mockHymn = {
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
  languages: ['en', 'es'],
  audioFiles: [
    {
      id: 'audio1',
      filename: 'amazing-grace.mp3',
      description: 'Piano version',
      duration: 240,
      language: 'en',
      url: 'https://example.com/audio1.mp3',
      format: 'mp3'
    }
  ],
  lyrics: [
    {
      language: 'en',
      content: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.`
    },
    {
      language: 'es',
      content: `Sublime gracia del Señor
Que a mí pecador salvó
Fui ciego mas hoy veo yo
Perdido y Él me halló`
    }
  ],
  createdBy: 'user1',
  isLiked: false,
  likeCount: 10
};

describe('HymnKaraokeViewer', () => {
  const defaultProps = {
    hymn: mockHymn,
    onClose: vi.fn(),
    isFullscreen: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders hymn information in header', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('John Newton')).toBeInTheDocument();
      expect(screen.getByText('1779')).toBeInTheDocument();
    });

    it('renders lyrics with proper formatting', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      expect(screen.getByText(/Amazing grace! How sweet the sound/)).toBeInTheDocument();
      expect(screen.getByText(/That saved a wretch like me!/)).toBeInTheDocument();
    });

    it('shows language selector for multi-language hymns', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      const languageSelector = screen.getByDisplayValue(/English/);
      expect(languageSelector).toBeInTheDocument();
    });

    it('displays no lyrics message when lyrics are empty', () => {
      const hymnWithoutLyrics = {
        ...mockHymn,
        lyrics: []
      };
      
      render(<HymnKaraokeViewer {...defaultProps} hymn={hymnWithoutLyrics} />);
      
      expect(screen.getByText('No lyrics available')).toBeInTheDocument();
    });
  });

  describe('Karaoke Features', () => {
    it('highlights current lyric line based on playback time', async () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Show player
      const showPlayerButton = screen.getByText('Show Audio Player');
      fireEvent.click(showPlayerButton);
      
      // Simulate playback
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);
      
      await waitFor(() => {
        const lyricLines = screen.getAllByText(/grace/i);
        expect(lyricLines[0]).toHaveClass('text-primary');
      });
    });

    it('supports different highlight modes', async () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      // Find highlight mode selector
      await waitFor(() => {
        expect(screen.getByText('Highlight Mode')).toBeInTheDocument();
      });
    });

    it('auto-scrolls to current lyric when enabled', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;
      
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Show player and start playback
      const showPlayerButton = screen.getByText('Show Audio Player');
      fireEvent.click(showPlayerButton);
      
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);
      
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });

  describe('Settings Panel', () => {
    it('opens and closes settings panel', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      
      // Open settings
      fireEvent.click(settingsButton);
      expect(screen.getByText('Karaoke Settings')).toBeInTheDocument();
      
      // Close settings
      fireEvent.click(settingsButton);
      expect(screen.queryByText('Karaoke Settings')).not.toBeInTheDocument();
    });

    it('changes font size setting', async () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      // Change font size
      const fontSizeSelect = screen.getByLabelText(/font size/i);
      fireEvent.click(fontSizeSelect);
      
      const extraLargeOption = await screen.findByText('Extra Large');
      fireEvent.click(extraLargeOption);
      
      // Check if lyrics have larger text class
      const lyricText = screen.getByText(/Amazing grace! How sweet the sound/);
      expect(lyricText.parentElement).toHaveClass('text-6xl');
    });

    it('changes theme setting', async () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      // Change theme
      const themeSelect = screen.getByLabelText(/theme/i);
      fireEvent.click(themeSelect);
      
      const contrastOption = await screen.findByText('High Contrast');
      fireEvent.click(contrastOption);
      
      // Check if container has contrast theme class
      const container = screen.getByText('Amazing Grace').closest('.bg-black');
      expect(container).toHaveClass('bg-black', 'text-yellow-400');
    });
  });

  describe('Controls and Navigation', () => {
    it('auto-hides controls during playback', async () => {
      vi.useFakeTimers();
      
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      const header = screen.getByText('Amazing Grace').parentElement?.parentElement;
      expect(header).toHaveClass('opacity-100');
      
      // Show player and start playback
      const showPlayerButton = screen.getByText('Show Audio Player');
      fireEvent.click(showPlayerButton);
      
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);
      
      // Wait for auto-hide timeout
      vi.advanceTimersByTime(4000);
      
      await waitFor(() => {
        expect(header).toHaveClass('opacity-0');
      });
      
      vi.useRealTimers();
    });

    it('shows controls on mouse movement', async () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      const header = screen.getByText('Amazing Grace').parentElement?.parentElement;
      
      // Simulate mouse movement
      fireEvent.mouseMove(document);
      
      expect(header).toHaveClass('opacity-100');
    });

    it('handles keyboard shortcuts', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Test ESC key
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalled();
      
      // Test F key for fullscreen
      const onFullscreenToggle = vi.fn();
      render(
        <HymnKaraokeViewer 
          {...defaultProps} 
          onFullscreenToggle={onFullscreenToggle}
        />
      );
      
      fireEvent.keyDown(document, { key: 'f' });
      expect(onFullscreenToggle).toHaveBeenCalled();
    });

    it('navigates between lyric segments with arrow keys', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      const firstLine = screen.getByText(/Amazing grace! How sweet the sound/);
      
      // Navigate to next segment
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      // Should highlight next line
      const secondLine = screen.getByText(/That saved a wretch like me!/);
      expect(secondLine.parentElement).toHaveClass('text-primary');
    });
  });

  describe('Language Support', () => {
    it('switches between languages', async () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Initially shows English
      expect(screen.getByText(/Amazing grace! How sweet the sound/)).toBeInTheDocument();
      
      // Switch to Spanish
      const languageSelector = screen.getByDisplayValue(/English/);
      fireEvent.click(languageSelector);
      
      const spanishOption = await screen.findByText(/Spanish/);
      fireEvent.click(spanishOption);
      
      // Should show Spanish lyrics
      expect(screen.getByText(/Sublime gracia del Señor/)).toBeInTheDocument();
    });
  });

  describe('Audio Player Integration', () => {
    it('shows/hides audio player', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Initially shows button to display player
      expect(screen.getByText('Show Audio Player')).toBeInTheDocument();
      
      // Click to show player
      fireEvent.click(screen.getByText('Show Audio Player'));
      
      // Player should be visible
      expect(screen.getByTestId('hymn-player')).toBeInTheDocument();
    });

    it('syncs playback state with lyric highlighting', async () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Show player
      fireEvent.click(screen.getByText('Show Audio Player'));
      
      // Start playback
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);
      
      await waitFor(() => {
        // Progress bar should be visible
        const progressBar = document.querySelector('.bg-primary');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides keyboard shortcut hints', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      expect(screen.getByText(/ESC: Exit/)).toBeInTheDocument();
      expect(screen.getByText(/SPACE: Play\/Pause/)).toBeInTheDocument();
    });

    it('supports screen reader announcements for verse numbers', () => {
      render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Verse badges should be present for screen readers
      const verses = screen.getAllByText(/Verse \d/);
      expect(verses.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('handles rapid playback time updates efficiently', async () => {
      const { rerender } = render(<HymnKaraokeViewer {...defaultProps} />);
      
      // Show player
      fireEvent.click(screen.getByText('Show Audio Player'));
      
      // Simulate rapid time updates
      for (let i = 0; i < 100; i++) {
        rerender(<HymnKaraokeViewer {...defaultProps} />);
      }
      
      // Should still be responsive
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    });
  });
});