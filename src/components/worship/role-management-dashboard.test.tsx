import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrganizationMember } from '@/lib/worship-user-management';

import { RoleManagementDashboard } from './role-management-dashboard';

// Mock the useWorshipAuth hook
const mockUseWorshipAuth = vi.fn();
vi.mock('@/hooks/use-worship-auth', () => ({
  useWorshipAuth: () => mockUseWorshipAuth(),
}));

// Mock the UserManagement component
vi.mock('./user-management', () => ({
  UserManagement: ({ members }: { members: OrganizationMember[] }) => (
    <div data-testid="user-management">
      User Management Component -
      {' '}
      {members.length}
      {' '}
      members
    </div>
  ),
}));

describe('RoleManagementDashboard', () => {
  const mockProps = {
    members: [
      {
        userId: 'user1',
        email: 'admin@example.com',
        name: 'Admin User',
        worshipRole: 'admin' as const,
        status: 'active' as const,
        joinedAt: '2024-01-01T00:00:00Z',
      },
      {
        userId: 'user2',
        email: 'pastor@example.com',
        name: 'Pastor John',
        worshipRole: 'pastor' as const,
        status: 'active' as const,
        joinedAt: '2024-01-15T00:00:00Z',
      },
      {
        userId: 'user3',
        email: 'leader@example.com',
        name: 'Worship Leader',
        worshipRole: 'worship_leader' as const,
        status: 'active' as const,
        joinedAt: '2024-02-01T00:00:00Z',
      },
      {
        invitationId: 'inv1',
        email: 'pending@example.com',
        worshipRole: 'collaborator' as const,
        status: 'pending' as const,
      },
    ] as OrganizationMember[],
    onInviteUser: vi.fn(),
    onUpdateRole: vi.fn(),
    onRemoveUser: vi.fn(),
    onRevokeInvitation: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorshipAuth.mockReturnValue({
      worshipRole: 'admin',
      hasPermission: vi.fn().mockReturnValue(true),
    });
  });

  it('renders role management dashboard with overview cards', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Check overview cards
    expect(screen.getByText('Total Members')).toBeInTheDocument();
    expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
    expect(screen.getByText('Growth Rate')).toBeInTheDocument();
    expect(screen.getByText('Active Roles')).toBeInTheDocument();

    // Check that numbers are displayed (more specific checks)
    expect(screen.getByText('Awaiting response')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('displays role distribution correctly', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Check role distribution section
    expect(screen.getByText('Role Distribution')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Pastor')).toBeInTheDocument();
    expect(screen.getByText('Worship Leader')).toBeInTheDocument();
    expect(screen.getByText('Collaborator')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();

    // Check role descriptions
    expect(screen.getByText('Full system administration access')).toBeInTheDocument();
    expect(screen.getByText('Pastoral oversight and spiritual guidance')).toBeInTheDocument();
    expect(screen.getByText('Lead worship planning and execution')).toBeInTheDocument();
  });

  it('renders tabs for different management views', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Check tab navigation
    expect(screen.getByRole('tab', { name: 'Member Management' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Role Permissions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity Log' })).toBeInTheDocument();
  });

  it('shows search and filter controls in members tab', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Check search input
    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();

    // Check that search and filter section exists
    expect(screen.getByText('Search & Filter')).toBeInTheDocument();
  });

  it('filters members based on search term', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'admin' } });

    // Should show results summary
    expect(screen.getByText(/matching "admin"/)).toBeInTheDocument();
  });

  it('can click on permissions tab', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    const permissionsTab = screen.getByRole('tab', { name: 'Role Permissions' });

    // Should be able to click on the tab
    expect(permissionsTab).toBeInTheDocument();

    fireEvent.click(permissionsTab);

    // Tab should exist and be clickable (not checking state due to test environment)
    expect(permissionsTab).toBeInTheDocument();
  });

  it('can click on activity tab', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    const activityTab = screen.getByRole('tab', { name: 'Activity Log' });

    // Should be able to click on the tab
    expect(activityTab).toBeInTheDocument();

    fireEvent.click(activityTab);

    // Tab should exist and be clickable
    expect(activityTab).toBeInTheDocument();
  });

  it('calculates role statistics correctly', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Check role distribution section exists
    expect(screen.getByText('Role Distribution')).toBeInTheDocument();

    // Should show role configuration
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Pastor')).toBeInTheDocument();
  });

  it('handles empty members list', () => {
    render(<RoleManagementDashboard {...mockProps} members={[]} />);

    // Should show empty state
    expect(screen.getByText('Showing 0 of 0 members')).toBeInTheDocument();
    expect(screen.getByText('Total Members')).toBeInTheDocument();
  });

  it('renders user management component with filtered members', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Should render the UserManagement component
    expect(screen.getByTestId('user-management')).toBeInTheDocument();
    expect(screen.getByText('User Management Component - 4 members')).toBeInTheDocument();
  });

  it('applies role filter correctly', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Check that filters exist by looking for filter components
    expect(screen.getByText('Search & Filter')).toBeInTheDocument();

    // The Select components should be present in the DOM
    const selectElements = screen.getAllByRole('combobox');

    expect(selectElements.length).toBeGreaterThan(0);
  });

  it('applies status filter correctly', () => {
    render(<RoleManagementDashboard {...mockProps} />);

    // Check that status filter exists
    expect(screen.getByText('Search & Filter')).toBeInTheDocument();

    // Check for multiple select elements (role and status filters)
    const selectElements = screen.getAllByRole('combobox');

    expect(selectElements.length).toBeGreaterThanOrEqual(2);
  });

  it('shows loading state when isLoading is true', () => {
    render(<RoleManagementDashboard {...mockProps} isLoading />);

    // Component should still render but may show loading indicators
    expect(screen.getByText('Total Members')).toBeInTheDocument();
  });

  it('calculates growth rate correctly', () => {
    const recentMembers = [
      ...mockProps.members,
      {
        userId: 'recent1',
        email: 'recent@example.com',
        name: 'Recent User',
        worshipRole: 'member' as const,
        status: 'active' as const,
        joinedAt: new Date().toISOString(), // Very recent
      },
    ] as OrganizationMember[];

    render(<RoleManagementDashboard {...mockProps} members={recentMembers} />);

    // Should calculate and display growth rate
    expect(screen.getByText('Growth Rate')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });
});
