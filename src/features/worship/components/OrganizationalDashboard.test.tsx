import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useUser } from '@clerk/nextjs';
import { OrganizationalDashboard } from './OrganizationalDashboard';
import { useSubscriptionUsage } from '@/hooks/use-subscription-limits';

// Mock all the child components
vi.mock('./ChurchManagement', () => ({
  ChurchManagement: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="church-management">Church Management for {organizationId}</div>
  ),
}));

vi.mock('./MinistryManagement', () => ({
  MinistryManagement: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="ministry-management">Ministry Management for {organizationId}</div>
  ),
}));

vi.mock('./ServiceManagement', () => ({
  ServiceManagement: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="service-management">Service Management for {organizationId}</div>
  ),
}));

vi.mock('./OrganizationalHierarchy', () => ({
  OrganizationalHierarchy: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="organizational-hierarchy">Hierarchy for {organizationId}</div>
  ),
}));

vi.mock('./SubscriptionLimitCard', () => ({
  SubscriptionLimitCard: ({ resource }: { resource: string }) => (
    <div data-testid={`limit-card-${resource}`}>Limit Card for {resource}</div>
  ),
}));

// Mock hooks
const mockUseUser = vi.fn();
const mockUseSubscriptionUsage = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useUser: mockUseUser,
}));

vi.mock('@/hooks/use-subscription-limits', () => ({
  useSubscriptionUsage: mockUseSubscriptionUsage,
}));

// Mock fetch
global.fetch = vi.fn();

const mockUser = {
  id: 'user-123',
  organizationMemberships: [
    {
      organization: {
        id: 'org-123',
        name: 'Test Organization',
      },
    },
  ],
};

const mockUsage = {
  churches: 1,
  ministries: 3,
  collaborators: 2,
  services: 10,
};

const mockStats = {
  churches: {
    total: 1,
    active: 1,
    inactive: 0,
  },
  ministries: {
    total: 3,
    active: 3,
    byChurch: [
      { churchName: 'Main Church', count: 3 },
    ],
  },
  services: {
    total: 12,
    upcoming: 4,
    thisWeek: 2,
    byType: [
      { type: 'Sunday Service', count: 8 },
      { type: 'Prayer Meeting', count: 4 },
    ],
  },
  users: {
    totalCollaborators: 5,
    byRole: [
      { role: 'admin', count: 1 },
      { role: 'worship_leader', count: 2 },
      { role: 'collaborator', count: 2 },
    ],
    recentActivity: [],
  },
};

describe('OrganizationalDashboard', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseUser.mockReturnValue({
      user: mockUser,
    });

    mockUseSubscriptionUsage.mockReturnValue({
      usage: mockUsage,
      loading: false,
      refetch: mockRefetch,
    });

    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockStats,
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    mockUseSubscriptionUsage.mockReturnValue({
      usage: null,
      loading: true,
      refetch: mockRefetch,
    });

    render(<OrganizationalDashboard organizationId="org-123" />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders dashboard header correctly', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByText('Organizational Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage your worship organization structure and monitor usage')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('displays subscription usage cards', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByText('Churches')).toBeInTheDocument();
    });

    // Check subscription usage display
    expect(screen.getByText('1')).toBeInTheDocument(); // Churches count
    expect(screen.getByText('3')).toBeInTheDocument(); // Ministries count
    expect(screen.getByText('2')).toBeInTheDocument(); // Collaborators count
    
    // Check progress indicators
    expect(screen.getByText('1/1 churches used')).toBeInTheDocument();
    expect(screen.getByText('3/5 ministries used')).toBeInTheDocument();
    expect(screen.getByText('2/5 collaborators used')).toBeInTheDocument();
  });

  it('renders tab navigation correctly', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /churches/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ministries/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /services/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /hierarchy/i })).toBeInTheDocument();
  });

  it('displays analytics cards in overview tab', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByText('Total church locations')).toBeInTheDocument();
    });

    expect(screen.getByText('Active ministry groups')).toBeInTheDocument();
    expect(screen.getByText('Upcoming worship services')).toBeInTheDocument();
    expect(screen.getByText('Active collaborators')).toBeInTheDocument();
  });

  it('shows ministry distribution chart', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByText('Ministry Distribution by Church')).toBeInTheDocument();
    });

    expect(screen.getByText('Main Church')).toBeInTheDocument();
    expect(screen.getByText('3 ministries')).toBeInTheDocument();
  });

  it('displays user role distribution', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Role Distribution')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Worship leader')).toBeInTheDocument();
    expect(screen.getByText('Collaborator')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    });

    // Click on Churches tab
    fireEvent.click(screen.getByRole('tab', { name: /churches/i }));
    expect(screen.getByTestId('church-management')).toBeInTheDocument();

    // Click on Ministries tab
    fireEvent.click(screen.getByRole('tab', { name: /ministries/i }));
    expect(screen.getByTestId('ministry-management')).toBeInTheDocument();

    // Click on Services tab
    fireEvent.click(screen.getByRole('tab', { name: /services/i }));
    expect(screen.getByTestId('service-management')).toBeInTheDocument();

    // Click on Hierarchy tab
    fireEvent.click(screen.getByRole('tab', { name: /hierarchy/i }));
    expect(screen.getByTestId('organizational-hierarchy')).toBeInTheDocument();
  });

  it('handles period selection changes', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // Change period selection
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /last 7 days/i }));

    // Should trigger new API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=7d')
      );
    });
  });

  it('handles refresh action', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    // Click refresh button
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    // Should call refetch function
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('displays subscription limit warnings', async () => {
    // Mock usage at limits
    mockUseSubscriptionUsage.mockReturnValue({
      usage: {
        churches: 1,
        ministries: 5,
        collaborators: 4,
        services: 10,
      },
      loading: false,
      refetch: mockRefetch,
    });

    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(screen.getByText('Approaching Subscription Limits')).toBeInTheDocument();
    });

    expect(screen.getByTestId('limit-card-ministries')).toBeInTheDocument();
    expect(screen.getByTestId('limit-card-collaborators')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching organizational stats:',
        expect.any(Error)
      );
    });

    // Should still render with fallback data
    expect(screen.getByText('Organizational Dashboard')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('fetches stats with correct organization ID', async () => {
    render(<OrganizationalDashboard organizationId="test-org-456" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('organizationId=test-org-456')
      );
    });
  });

  it('calculates efficiency metrics correctly', async () => {
    render(<OrganizationalDashboard organizationId="org-123" />);

    await waitFor(() => {
      // Ministry efficiency: (3 ministries / 1 church) * 100 / 10 = 30/10 = 3/10
      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    // Team utilization: (5 collaborators / 5 max) * 100 = 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});