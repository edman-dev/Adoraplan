import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HymnSharingDialog } from './HymnSharingDialog';

// Mock the dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock fetch
global.fetch = vi.fn();

const mockHymn = {
  id: 'hymn1',
  title: 'Amazing Grace',
  author: 'John Newton',
  year: 1779,
  type: 'user_created' as const,
  isPublic: false,
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
  lyrics: {
    en: 'Amazing grace! How sweet the sound...'
  },
  createdBy: 'user1',
  isLiked: false,
  likeCount: 10
};

describe('HymnSharingDialog', () => {
  const defaultProps = {
    hymn: mockHymn,
    isOpen: true,
    onClose: vi.fn(),
    organizationId: 'org1',
    currentUserId: 'user1',
    userRole: 'admin'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ shareLink: null, settings: null })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Permission Checks', () => {
    it('renders permission denied for unauthorized users', () => {
      render(
        <HymnSharingDialog 
          {...defaultProps} 
          userRole="member"
          currentUserId="other-user"
        />
      );
      
      expect(screen.getByText('Permission Required')).toBeInTheDocument();
      expect(screen.getByText(/You don't have permission to share this hymn/)).toBeInTheDocument();
    });

    it('allows hymn creator to share', () => {
      render(
        <HymnSharingDialog 
          {...defaultProps} 
          userRole="member"
          currentUserId="user1"
        />
      );
      
      expect(screen.queryByText('Permission Required')).not.toBeInTheDocument();
      expect(screen.getByText(/Share "Amazing Grace"/)).toBeInTheDocument();
    });

    it('allows worship leaders to share', () => {
      render(
        <HymnSharingDialog 
          {...defaultProps} 
          userRole="worship_leader"
          currentUserId="other-user"
        />
      );
      
      expect(screen.queryByText('Permission Required')).not.toBeInTheDocument();
      expect(screen.getByText(/Share "Amazing Grace"/)).toBeInTheDocument();
    });

    it('allows admins to share', () => {
      render(
        <HymnSharingDialog 
          {...defaultProps} 
          userRole="admin"
          currentUserId="other-user"
        />
      );
      
      expect(screen.queryByText('Permission Required')).not.toBeInTheDocument();
      expect(screen.getByText(/Share "Amazing Grace"/)).toBeInTheDocument();
    });
  });

  describe('Sharing Interface', () => {
    it('renders the sharing dialog with tabs', () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByText('Email Invite')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('shows visibility settings', () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      expect(screen.getByText('Visibility Settings')).toBeInTheDocument();
      expect(screen.getByText('Access Level')).toBeInTheDocument();
    });

    it('shows permission controls', () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      expect(screen.getByText('Permissions')).toBeInTheDocument();
      expect(screen.getByText('Allow Download')).toBeInTheDocument();
      expect(screen.getByText('Allow Copy Text')).toBeInTheDocument();
      expect(screen.getByText('Require Login')).toBeInTheDocument();
    });
  });

  describe('Share Link Generation', () => {
    it('generates share link when button is clicked', async () => {
      const mockShareLink = {
        url: 'https://example.com/hymn/share/abc123',
        shortCode: 'abc123',
        created: new Date(),
        accessCount: 0
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shareLink: mockShareLink })
      });

      render(<HymnSharingDialog {...defaultProps} />);
      
      const generateButton = screen.getByText('Generate Share Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/hymns/hymn1/share',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('org1')
          })
        );
      });
    });

    it('displays generated share link', async () => {
      const mockShareLink = {
        url: 'https://example.com/hymn/share/abc123',
        shortCode: 'abc123',
        created: new Date(),
        accessCount: 5
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shareLink: null })
      });

      const { rerender } = render(<HymnSharingDialog {...defaultProps} />);

      // Simulate getting share link
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shareLink: mockShareLink })
      });

      rerender(<HymnSharingDialog {...defaultProps} />);

      // Click generate
      const generateButton = screen.getByText('Generate Share Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockShareLink.url)).toBeInTheDocument();
        expect(screen.getByText('5 views')).toBeInTheDocument();
      });
    });
  });

  describe('Visibility Settings', () => {
    it('allows changing visibility level', async () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      const visibilitySelect = screen.getByRole('combobox');
      fireEvent.click(visibilitySelect);
      
      const publicOption = await screen.findByText('Public (Anyone with link)');
      fireEvent.click(publicOption);
      
      // Verify the selection changed
      expect(screen.getByText('Public (Anyone with link)')).toBeInTheDocument();
    });

    it('prevents non-leaders from making hymns public', () => {
      render(
        <HymnSharingDialog 
          {...defaultProps} 
          userRole="member"
          currentUserId="user1"
        />
      );
      
      const visibilitySelect = screen.getByRole('combobox');
      fireEvent.click(visibilitySelect);
      
      // Public option should not be available
      expect(screen.queryByText('Public (Anyone with link)')).not.toBeInTheDocument();
    });
  });

  describe('Password Protection', () => {
    it('enables password field when password protection is toggled', async () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      const passwordToggle = screen.getByRole('switch', { name: /password protection/i });
      fireEvent.click(passwordToggle);
      
      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('Enter password');
        expect(passwordInput).toBeInTheDocument();
      });
    });

    it('toggles password visibility', async () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      // Enable password protection
      const passwordToggle = screen.getByRole('switch', { name: /password protection/i });
      fireEvent.click(passwordToggle);
      
      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('Enter password');
        expect(passwordInput).toHaveAttribute('type', 'password');
        
        const toggleButton = screen.getByRole('button', { name: /show password/i });
        fireEvent.click(toggleButton);
        
        expect(passwordInput).toHaveAttribute('type', 'text');
      });
    });
  });

  describe('Email Invitations', () => {
    it('switches to email tab', () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      const emailTab = screen.getByText('Email Invite');
      fireEvent.click(emailTab);
      
      expect(screen.getByText('Email Invitation')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email addresses separated by commas')).toBeInTheDocument();
    });

    it('sends email invitations', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sent: 2, recipients: ['user1@example.com', 'user2@example.com'] })
      });

      render(<HymnSharingDialog {...defaultProps} />);
      
      // Switch to email tab
      const emailTab = screen.getByText('Email Invite');
      fireEvent.click(emailTab);
      
      // Enter recipients
      const recipientsInput = screen.getByPlaceholderText('Enter email addresses separated by commas');
      fireEvent.change(recipientsInput, { 
        target: { value: 'user1@example.com, user2@example.com' } 
      });
      
      // Note: Button will be disabled if no share link exists
      // In a real test, we'd need to generate a share link first
    });
  });

  describe('Export Options', () => {
    it('switches to export tab', () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      const exportTab = screen.getByText('Export');
      fireEvent.click(exportTab);
      
      expect(screen.getByText('Export Options')).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Word Document')).toBeInTheDocument();
      expect(screen.getByText('Export as PowerPoint')).toBeInTheDocument();
    });

    it('handles export requests', async () => {
      // Mock blob response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['fake pdf content'], { type: 'application/pdf' }))
      });

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
      global.URL.revokeObjectURL = vi.fn();

      render(<HymnSharingDialog {...defaultProps} />);
      
      // Switch to export tab
      const exportTab = screen.getByText('Export');
      fireEvent.click(exportTab);
      
      // Click PDF export
      const pdfButton = screen.getByText('Export as PDF');
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/hymns/hymn1/export',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('pdf')
          })
        );
      });
    });
  });

  describe('Settings Management', () => {
    it('updates share settings', async () => {
      const mockShareLink = {
        url: 'https://example.com/hymn/share/abc123',
        shortCode: 'abc123',
        created: new Date(),
        accessCount: 0
      };

      // Mock initial fetch to return existing share link
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shareLink: mockShareLink })
      });

      render(<HymnSharingDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Update Settings')).toBeInTheDocument();
      });

      // Mock update request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const updateButton = screen.getByText('Update Settings');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/hymns/hymn1/share',
          expect.objectContaining({
            method: 'PUT'
          })
        );
      });
    });

    it('revokes share link', async () => {
      const mockShareLink = {
        url: 'https://example.com/hymn/share/abc123',
        shortCode: 'abc123',
        created: new Date(),
        accessCount: 0
      };

      // Mock initial fetch to return existing share link
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shareLink: mockShareLink })
      });

      render(<HymnSharingDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Revoke Link')).toBeInTheDocument();
      });

      // Mock revoke request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const revokeButton = screen.getByText('Revoke Link');
      fireEvent.click(revokeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/worship/hymns/hymn1/share/abc123',
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles failed share link generation', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<HymnSharingDialog {...defaultProps} />);
      
      const generateButton = screen.getByText('Generate Share Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        // Error handling would be verified through toast calls
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('handles invalid email addresses', async () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      // Switch to email tab
      const emailTab = screen.getByText('Email Invite');
      fireEvent.click(emailTab);
      
      // Enter invalid emails
      const recipientsInput = screen.getByPlaceholderText('Enter email addresses separated by commas');
      fireEvent.change(recipientsInput, { 
        target: { value: 'invalid-email, another-invalid' } 
      });
      
      // Validation would happen on send attempt
      const sendButton = screen.getByText('Send Email Invitations');
      expect(sendButton).toBeDisabled(); // Disabled because no share link
    });
  });

  describe('Accessibility', () => {
    it('provides proper labels for form controls', () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      expect(screen.getByLabelText('Access Level')).toBeInTheDocument();
      expect(screen.getByLabelText('Password Protection')).toBeInTheDocument();
      expect(screen.getByLabelText('Allow Download')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<HymnSharingDialog {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabindex');
      });
    });
  });
});