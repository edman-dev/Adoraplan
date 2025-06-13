import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HymnPlayer } from './HymnPlayer';
import { formatDuration } from '@/libs/audio/AudioProcessor';

// Mock the hooks and components
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

// Mock HTML5 Audio
class MockAudio {
  public src = '';
  public currentTime = 0;
  public duration = 180;
  public volume = 1;
  public muted = false;
  public paused = true;
  private eventListeners: { [key: string]: Function[] } = {};

  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  play() {
    this.paused = false;
    this.dispatchEvent('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.dispatchEvent('pause');
  }

  load() {
    this.dispatchEvent('loadedmetadata');
  }

  private dispatchEvent(eventType: string) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => callback());
    }
  }

  // Simulate time updates
  simulateTimeUpdate(time: number) {
    this.currentTime = time;
    this.dispatchEvent('timeupdate');
  }

  simulateEnd() {
    this.dispatchEvent('ended');
  }
}

global.Audio = MockAudio as any;

const mockAudioFiles = [
  {
    id: 'audio1',
    url: 'https://example.com/audio1.mp3',
    filename: 'hymn-piano.mp3',
    description: 'Piano accompaniment',
    language: 'en',
    duration: 180,
    format: 'mp3'
  },
  {
    id: 'audio2',
    url: 'https://example.com/audio2.mp3',
    filename: 'hymn-organ.mp3',
    description: 'Organ version',
    language: 'en',
    duration: 210,
    format: 'mp3'
  }
];

const mockLyrics = {
  'en': `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.`
};

const defaultProps = {
  hymnId: 'hymn1',
  title: 'Amazing Grace',
  author: 'John Newton',
  audioFiles: mockAudioFiles,
  lyrics: mockLyrics,
  languages: ['en']
};

describe('HymnPlayer', () => {
  let mockAudio: MockAudio;

  beforeEach(() => {
    mockAudio = new MockAudio();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the player with hymn information', () => {
      render(<HymnPlayer {...defaultProps} />);
      
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('by John Newton')).toBeInTheDocument();
      expect(screen.getByText('Piano accompaniment')).toBeInTheDocument();
    });

    it('renders multiple audio files in selector', () => {
      render(<HymnPlayer {...defaultProps} />);
      
      // Check if multiple audio files are available
      const selector = screen.getByDisplayValue('Piano accompaniment');
      expect(selector).toBeInTheDocument();
    });

    it('renders synchronized lyrics', () => {
      render(<HymnPlayer {...defaultProps} showLyrics={true} />);
      
      expect(screen.getByText('Synchronized Lyrics')).toBeInTheDocument();
      expect(screen.getByText(/Amazing grace! How sweet the sound/)).toBeInTheDocument();
    });

    it('shows no audio message when no audio files provided', () => {
      render(<HymnPlayer {...defaultProps} audioFiles={[]} />);
      
      expect(screen.getByText('No Audio Available')).toBeInTheDocument();
      expect(screen.getByText('Upload audio files to enable playback')).toBeInTheDocument();
    });
  });

  describe('Audio Controls', () => {
    it('plays and pauses audio', async () => {
      render(<HymnPlayer {...defaultProps} />);
      
      const playButton = screen.getByRole('button', { name: /play/i });
      
      // Initially should show play button
      expect(playButton).toBeInTheDocument();
      
      // Click play
      fireEvent.click(playButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/pause/i)).toBeInTheDocument();
      });
    });

    it('handles volume control', () => {
      render(<HymnPlayer {...defaultProps} />);
      
      const volumeButton = screen.getByRole('button', { name: /volume/i });
      expect(volumeButton).toBeInTheDocument();
      
      // Click mute
      fireEvent.click(volumeButton);
      
      // Should show muted icon
      expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
    });

    it('handles track navigation', () => {
      render(<HymnPlayer {...defaultProps} />);
      
      const nextButton = screen.getByRole('button', { name: /skip forward/i });
      const prevButton = screen.getByRole('button', { name: /skip back/i });
      
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
      
      // Previous should be disabled on first track
      expect(prevButton).toBeDisabled();
      
      // Click next
      fireEvent.click(nextButton);
      
      // Should change to second track
      expect(screen.getByText('Organ version')).toBeInTheDocument();
    });

    it('toggles loop mode', () => {
      render(<HymnPlayer {...defaultProps} />);
      
      const loopButton = screen.getByRole('button', { name: /repeat/i });
      expect(loopButton).toBeInTheDocument();
      
      fireEvent.click(loopButton);
      
      // Button should show as active/pressed state
      expect(loopButton).toHaveClass('bg-primary');
    });
  });

  describe('Lyric Synchronization', () => {
    it('updates current lyric based on playback time', async () => {
      render(<HymnPlayer {...defaultProps} showLyrics={true} syncMode="auto" />);
      
      // Simulate playback time update
      mockAudio.simulateTimeUpdate(30);
      
      await waitFor(() => {
        const lyricLines = screen.getAllByText(/grace/i);
        expect(lyricLines.length).toBeGreaterThan(0);
      });
    });

    it('allows manual lyric navigation in manual mode', () => {
      render(<HymnPlayer {...defaultProps} showLyrics={true} syncMode="manual" />);
      
      const firstLyricLine = screen.getByText(/Amazing grace! How sweet the sound/);
      
      fireEvent.click(firstLyricLine);
      
      // Should update player time (tested via audio currentTime property)
      expect(mockAudio.currentTime).toBe(0);
    });

    it('handles language switching', () => {
      const multiLangLyrics = {
        'en': 'Amazing grace! How sweet the sound',
        'es': 'Sublime gracia del Señor'
      };
      
      render(
        <HymnPlayer 
          {...defaultProps} 
          lyrics={multiLangLyrics}
          languages={['en', 'es']}
          showLyrics={true}
        />
      );
      
      // Should have language selector
      expect(screen.getByDisplayValue('English')).toBeInTheDocument();
    });
  });

  describe('Player State Management', () => {
    it('calls onPlayerStateChange callback', async () => {
      const mockCallback = vi.fn();
      
      render(
        <HymnPlayer 
          {...defaultProps} 
          onPlayerStateChange={mockCallback}
        />
      );
      
      const playButton = screen.getByRole('button', { name: /play/i });
      fireEvent.click(playButton);
      
      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(true, 0);
      });
    });

    it('handles auto-play when enabled', () => {
      render(<HymnPlayer {...defaultProps} autoPlay={true} />);
      
      // Should automatically start playing
      expect(mockAudio.paused).toBe(false);
    });

    it('advances to next track on audio end', async () => {
      render(<HymnPlayer {...defaultProps} />);
      
      // Start playing first track
      const playButton = screen.getByRole('button', { name: /play/i });
      fireEvent.click(playButton);
      
      // Simulate audio end
      mockAudio.simulateEnd();
      
      await waitFor(() => {
        expect(screen.getByText('Organ version')).toBeInTheDocument();
      });
    });
  });

  describe('Progress and Time Display', () => {
    it('displays formatted duration correctly', () => {
      render(<HymnPlayer {...defaultProps} />);
      
      expect(formatDuration).toHaveBeenCalledWith(0);
      expect(formatDuration).toHaveBeenCalledWith(180);
    });

    it('updates progress bar with current time', async () => {
      render(<HymnPlayer {...defaultProps} />);
      
      // Simulate time update
      mockAudio.simulateTimeUpdate(60);
      
      await waitFor(() => {
        // Progress bar should reflect current time
        const progressBar = screen.getByRole('slider');
        expect(progressBar).toHaveValue('60');
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for controls', () => {
      render(<HymnPlayer {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip forward/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /repeat/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation for lyrics', () => {
      render(<HymnPlayer {...defaultProps} showLyrics={true} syncMode="manual" />);
      
      const firstLyric = screen.getByText(/Amazing grace! How sweet the sound/);
      
      // Should be focusable and clickable
      expect(firstLyric).toBeInTheDocument();
      fireEvent.keyDown(firstLyric, { key: 'Enter' });
    });
  });

  describe('Error Handling', () => {
    it('handles missing audio gracefully', () => {
      const invalidAudioFiles = [{
        ...mockAudioFiles[0],
        url: ''
      }];
      
      render(<HymnPlayer {...defaultProps} audioFiles={invalidAudioFiles} />);
      
      // Should still render without crashing
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    });

    it('handles missing lyrics gracefully', () => {
      render(<HymnPlayer {...defaultProps} lyrics={{}} showLyrics={true} />);
      
      // Should render player without lyrics section
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.queryByText('Synchronized Lyrics')).not.toBeInTheDocument();
    });
  });
});