import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SubscriptionLimitCard } from './SubscriptionLimitCard';
import { useResourceLimit } from '@/hooks/use-subscription-limits';

// Mock the hook
const mockUseResourceLimit = vi.fn();
vi.mock('@/hooks/use-subscription-limits', () => ({
  useResourceLimit: mockUseResourceLimit,
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress" data-value={value} {...props}>
      Progress: {value}%
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

describe('SubscriptionLimitCard', () => {
  const mockOnUpgrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly when under limit', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: true,
      current: 2,
      limit: 5,
      percentage: 40,
      warningLevel: 'safe',
    });

    render(<SubscriptionLimitCard resource="ministries" onUpgrade={mockOnUpgrade} />);

    expect(screen.getByText('Ministry Usage')).toBeInTheDocument();
    expect(screen.getByText('2 of 5 ministries used')).toBeInTheDocument();
    expect(screen.getByText('Progress: 40%')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'secondary');
  });

  it('renders correctly when at limit', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: false,
      current: 5,
      limit: 5,
      percentage: 100,
      warningLevel: 'danger',
    });

    render(<SubscriptionLimitCard resource="ministries" onUpgrade={mockOnUpgrade} />);

    expect(screen.getByText('Ministry Usage')).toBeInTheDocument();
    expect(screen.getByText('5 of 5 ministries used')).toBeInTheDocument();
    expect(screen.getByText('Progress: 100%')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByText('At limit')).toBeInTheDocument();
  });

  it('renders correctly for unlimited resources', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: true,
      current: 100,
      limit: -1,
      percentage: 0,
      warningLevel: 'safe',
    });

    render(<SubscriptionLimitCard resource="services" onUpgrade={mockOnUpgrade} />);

    expect(screen.getByText('Service Usage')).toBeInTheDocument();
    expect(screen.getByText('100 services used')).toBeInTheDocument();
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
    expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
  });

  it('shows upgrade button when at limit and showUpgradeButton is true', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: false,
      current: 1,
      limit: 1,
      percentage: 100,
      warningLevel: 'danger',
    });

    render(
      <SubscriptionLimitCard 
        resource="churches" 
        onUpgrade={mockOnUpgrade}
        showUpgradeButton={true}
      />
    );

    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
    expect(screen.getByTestId('button')).not.toBeDisabled();
  });

  it('hides upgrade button when showUpgradeButton is false', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: false,
      current: 1,
      limit: 1,
      percentage: 100,
      warningLevel: 'danger',
    });

    render(
      <SubscriptionLimitCard 
        resource="churches" 
        onUpgrade={mockOnUpgrade}
        showUpgradeButton={false}
      />
    );

    expect(screen.queryByText('Upgrade Plan')).not.toBeInTheDocument();
  });

  it('calls onUpgrade when upgrade button is clicked', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: false,
      current: 5,
      limit: 5,
      percentage: 100,
      warningLevel: 'danger',
    });

    render(<SubscriptionLimitCard resource="ministries" onUpgrade={mockOnUpgrade} />);

    const upgradeButton = screen.getByText('Upgrade Plan');
    fireEvent.click(upgradeButton);

    expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
  });

  it('renders in compact mode', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: true,
      current: 3,
      limit: 5,
      percentage: 60,
      warningLevel: 'safe',
    });

    render(
      <SubscriptionLimitCard 
        resource="ministries" 
        onUpgrade={mockOnUpgrade}
        compact={true}
      />
    );

    // In compact mode, should still show key information but in a smaller format
    expect(screen.getByText('Ministry Usage')).toBeInTheDocument();
    expect(screen.getByText('3 of 5 ministries used')).toBeInTheDocument();
  });

  it('displays correct resource labels', () => {
    const testCases = [
      { resource: 'churches', expected: 'Church Usage' },
      { resource: 'ministries', expected: 'Ministry Usage' },
      { resource: 'collaborators', expected: 'Collaborator Usage' },
      { resource: 'services', expected: 'Service Usage' },
    ];

    testCases.forEach(({ resource, expected }) => {
      mockUseResourceLimit.mockReturnValue({
        loading: false,
        allowed: true,
        current: 1,
        limit: 5,
        percentage: 20,
        warningLevel: 'safe',
      });

      const { unmount } = render(
        <SubscriptionLimitCard 
          resource={resource as any} 
          onUpgrade={mockOnUpgrade} 
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('displays warning level with appropriate styling', () => {
    const warningTestCases = [
      { warningLevel: 'safe', expectedVariant: 'secondary' },
      { warningLevel: 'warning', expectedVariant: 'warning' },
      { warningLevel: 'danger', expectedVariant: 'destructive' },
    ];

    warningTestCases.forEach(({ warningLevel, expectedVariant }) => {
      mockUseResourceLimit.mockReturnValue({
        loading: false,
        allowed: warningLevel !== 'danger',
        current: 3,
        limit: 5,
        percentage: warningLevel === 'danger' ? 100 : warningLevel === 'warning' ? 80 : 60,
        warningLevel: warningLevel as any,
      });

      const { unmount } = render(
        <SubscriptionLimitCard resource="ministries" onUpgrade={mockOnUpgrade} />
      );

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', expectedVariant);
      unmount();
    });
  });

  it('shows loading state', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: true,
      allowed: true,
      current: 0,
      limit: 1,
      percentage: 0,
      warningLevel: 'safe',
    });

    render(<SubscriptionLimitCard resource="churches" onUpgrade={mockOnUpgrade} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays suggestions for approaching limits', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: true,
      current: 4,
      limit: 5,
      percentage: 80,
      warningLevel: 'warning',
    });

    render(<SubscriptionLimitCard resource="ministries" onUpgrade={mockOnUpgrade} />);

    expect(screen.getByText('Ministry Usage')).toBeInTheDocument();
    expect(screen.getByText('4 of 5 ministries used')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'warning');
    expect(screen.getByText('Near limit')).toBeInTheDocument();
  });

  it('handles edge case with zero limits gracefully', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: false,
      current: 0,
      limit: 0,
      percentage: 0,
      warningLevel: 'danger',
    });

    render(<SubscriptionLimitCard resource="churches" onUpgrade={mockOnUpgrade} />);

    expect(screen.getByText('Church Usage')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 churches used')).toBeInTheDocument();
  });

  it('displays proper upgrade messaging based on resource type', () => {
    mockUseResourceLimit.mockReturnValue({
      loading: false,
      allowed: false,
      current: 1,
      limit: 1,
      percentage: 100,
      warningLevel: 'danger',
    });

    render(<SubscriptionLimitCard resource="churches" onUpgrade={mockOnUpgrade} />);

    expect(screen.getByText('Church Usage')).toBeInTheDocument();
    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
    expect(screen.getByText("You've reached your church limit. Upgrade to add more churches.")).toBeInTheDocument();
  });

  it('passes tier override to useResourceLimit hook', () => {
    render(
      <SubscriptionLimitCard 
        resource="ministries" 
        onUpgrade={mockOnUpgrade}
        tier="pro"
      />
    );

    expect(mockUseResourceLimit).toHaveBeenCalledWith('ministries', { tier: 'pro' });
  });
});