import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChurchManagement } from './ChurchManagement';

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
    organizationId: 'org_123',
    name: 'First Baptist Church',
    address: '123 Main St, Anytown USA',
    description: 'A welcoming community church',
    contactEmail: 'contact@firstbaptist.com',
    contactPhone: '(555) 123-4567',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'church_2',
    organizationId: 'org_123',
    name: 'Grace Community Church',
    address: '456 Oak Ave, Anytown USA',
    description: 'Growing in grace together',
    contactEmail: 'info@grace.com',
    contactPhone: '(555) 987-6543',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('ChurchManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ChurchManagement organizationId="org_123" />);
    
    expect(screen.getByText('Loading churches...')).toBeInTheDocument();
  });

  it('should render churches list when data is loaded', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(screen.getByText('Church Management')).toBeInTheDocument();
      expect(screen.getByText('First Baptist Church')).toBeInTheDocument();
      expect(screen.getByText('Grace Community Church')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Anytown USA')).toBeInTheDocument();
    });
  });

  it('should render empty state when no churches exist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(screen.getByText('No churches found')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first church')).toBeInTheDocument();
    });
  });

  it('should open create dialog when Add Church button is clicked', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(screen.getByText('Add Church')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Church'));

    expect(screen.getByText('Create New Church')).toBeInTheDocument();
    expect(screen.getByText('Add a new church to your organization')).toBeInTheDocument();
  });

  it('should handle church creation', async () => {
    // Mock initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    // Mock create church request
    const newChurch = {
      id: 'church_new',
      organizationId: 'org_123',
      name: 'New Test Church',
      address: '789 Test St',
      description: 'Test church description',
      contactEmail: 'test@church.com',
      contactPhone: '(555) 000-0000',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: newChurch }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Create Church')).toBeInTheDocument();
    });

    // Click create church button
    fireEvent.click(screen.getByText('Create Church'));

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Church Name *'), {
      target: { value: 'New Test Church' },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: '789 Test St' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test church description' },
    });
    fireEvent.change(screen.getByLabelText('Contact Email'), {
      target: { value: 'test@church.com' },
    });
    fireEvent.change(screen.getByLabelText('Contact Phone'), {
      target: { value: '(555) 000-0000' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create Church'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/worship/churches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'org_123',
          name: 'New Test Church',
          address: '789 Test St',
          description: 'Test church description',
          contactEmail: 'test@church.com',
          contactPhone: '(555) 000-0000',
        }),
      });
    });
  });

  it('should handle church editing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(screen.getByText('First Baptist Church')).toBeInTheDocument();
    });

    // Click edit button for first church
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.classList.contains('lucide-edit');
    });
    
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton!);

    expect(screen.getByText('Edit Church')).toBeInTheDocument();
    expect(screen.getByDisplayValue('First Baptist Church')).toBeInTheDocument();
  });

  it('should handle church deletion', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    } as Response);

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    // Mock delete request
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(screen.getByText('First Baptist Church')).toBeInTheDocument();
    });

    // Click delete button for first church
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.classList.contains('lucide-trash-2');
    });
    
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/worship/churches/church_1?organizationId=org_123',
        { method: 'DELETE' }
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching churches:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should validate required fields in create form', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(screen.getByText('Create Church')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Church'));

    // Try to submit empty form
    fireEvent.click(screen.getByText('Create Church'));

    // Should not call API since name is required
    expect(fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
  });

  it('should display contact information correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    } as Response);

    render(<ChurchManagement organizationId="org_123" />);

    await waitFor(() => {
      expect(screen.getByText('contact@firstbaptist.com')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('info@grace.com')).toBeInTheDocument();
      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
    });
  });
});