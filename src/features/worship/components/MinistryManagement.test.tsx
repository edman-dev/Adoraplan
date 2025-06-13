import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MinistryManagement } from './MinistryManagement';

// Mock Clerk
const mockUser = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
};

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockUser }),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const mockChurches = [
  {
    id: 'church_1',
    name: 'First Baptist Church',
  },
  {
    id: 'church_2',
    name: 'Grace Community Church',
  },
];

const mockMinistries = [
  {
    id: 'ministry_1',
    churchId: 'church_1',
    name: 'Worship Team',
    description: 'Leading worship through music',
    color: '#6366f1',
    icon: 'music',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    church: {
      id: 'church_1',
      name: 'First Baptist Church',
    },
  },
  {
    id: 'ministry_2',
    churchId: 'church_1',
    name: 'Youth Ministry',
    description: 'Engaging youth in faith',
    color: '#22c55e',
    icon: 'gamepad-2',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    church: {
      id: 'church_1',
      name: 'First Baptist Church',
    },
  },
];

describe('MinistryManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );
    
    expect(screen.getByText('Loading ministries...')).toBeInTheDocument();
  });

  it('should render ministries list when data is loaded', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ministry Management')).toBeInTheDocument();
      expect(screen.getByText('Worship Team')).toBeInTheDocument();
      expect(screen.getByText('Youth Ministry')).toBeInTheDocument();
      expect(screen.getByText('Leading worship through music')).toBeInTheDocument();
    });
  });

  it('should render empty state when no churches exist', () => {
    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={[]}
      />
    );

    expect(screen.getByText('No churches available')).toBeInTheDocument();
    expect(screen.getByText('Please create a church before adding ministries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add ministry/i })).toBeDisabled();
  });

  it('should render empty state when no ministries exist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No ministries found')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first ministry')).toBeInTheDocument();
    });
  });

  it('should open create dialog when Add Ministry button is clicked', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Add Ministry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Ministry'));

    expect(screen.getByText('Create New Ministry')).toBeInTheDocument();
    expect(screen.getByText('Add a new ministry to organize your church activities')).toBeInTheDocument();
  });

  it('should handle ministry creation', async () => {
    // Mock initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    // Mock create ministry request
    const newMinistry = {
      id: 'ministry_new',
      churchId: 'church_1',
      name: 'New Test Ministry',
      description: 'Test ministry description',
      color: '#ef4444',
      icon: 'heart',
      isActive: true,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
      church: {
        id: 'church_1',
        name: 'First Baptist Church',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: newMinistry }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Create Ministry')).toBeInTheDocument();
    });

    // Click create ministry button
    fireEvent.click(screen.getByText('Create Ministry'));

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Ministry Name *'), {
      target: { value: 'New Test Ministry' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test ministry description' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Ministry' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/worship/ministries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'org_123',
          churchId: '',
          name: 'New Test Ministry',
          description: 'Test ministry description',
          color: '#6366f1',
          icon: 'church',
        }),
      });
    });
  });

  it('should handle ministry editing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Worship Team')).toBeInTheDocument();
    });

    // Click edit button for first ministry
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.classList.contains('lucide-edit');
    });
    
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton!);

    expect(screen.getByText('Edit Ministry')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Worship Team')).toBeInTheDocument();
  });

  it('should handle ministry deletion', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    } as Response);

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    // Mock delete request
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Worship Team')).toBeInTheDocument();
    });

    // Click delete button for first ministry
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.classList.contains('lucide-trash-2');
    });
    
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/worship/ministries/ministry_1?organizationId=org_123',
        { method: 'DELETE' }
      );
    });
  });

  it('should display ministry with custom color and icon', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Worship Team')).toBeInTheDocument();
      expect(screen.getByText('Youth Ministry')).toBeInTheDocument();
    });

    // Check that ministry cards are rendered with colored icons
    const ministryCards = screen.getAllByRole('article');
    expect(ministryCards).toHaveLength(2);
  });

  it('should filter ministries by selected church', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
        selectedChurchId="church_1"
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('churchId=church_1')
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching ministries:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should show church name for each ministry', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('First Baptist Church')).toHaveLength(2);
    });
  });

  it('should validate required fields in create form', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(
      <MinistryManagement 
        organizationId="org_123" 
        churches={mockChurches}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create Ministry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Ministry'));

    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: 'Create Ministry' }));

    // Should not call API since required fields are missing
    expect(fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
  });
});