import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrganizationalHierarchy } from './OrganizationalHierarchy';

// Mock console methods to avoid warnings in tests
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// Mock the custom hooks and components
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, onClick, ...props }: any) => (
    <div data-testid="card" onClick={onClick} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OrganizationalHierarchy', () => {
  const mockOrganizationId = 'org_123';
  
  const mockChurches = [
    {
      id: 1,
      organizationId: 'org_123',
      name: 'Main Campus',
      description: 'Primary church location',
      address: '123 Main St',
      contactEmail: 'info@church.org',
      contactPhone: '555-0123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      organizationId: 'org_123',
      name: 'West Campus',
      description: 'Secondary location',
      address: '456 West Ave',
      contactEmail: 'west@church.org',
      contactPhone: '555-0124',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockMinistries = [
    {
      id: 1,
      churchId: 1,
      name: 'Worship Ministry',
      description: 'Sunday worship services',
      color: '#3B82F6',
      icon: 'music',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      churchId: 1,
      name: 'Youth Ministry',
      description: 'Teen and young adult programs',
      color: '#10B981',
      icon: 'users',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockServices = [
    {
      id: 1,
      ministryId: 1,
      name: 'Sunday Morning Service',
      description: 'Main worship service',
      defaultDuration: 90,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      ministryId: 1,
      name: 'Wednesday Prayer',
      description: 'Mid-week prayer meeting',
      defaultDuration: 60,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders without crashing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChurches,
      }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);
    
    expect(screen.getByText('Organizational Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Navigate through your churches, ministries, and services')).toBeInTheDocument();
  });

  it('loads and displays churches on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChurches,
      }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);

    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
      expect(screen.getByText('West Campus')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(`/api/worship/churches?organizationId=${mockOrganizationId}`);
  });

  it('navigates to ministries when church is selected', async () => {
    // Mock churches load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChurches,
      }),
    });

    // Mock ministries load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockMinistries,
      }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);

    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
    });

    // Click on the first church
    const churchCard = screen.getByText('Main Campus').closest('[data-testid="card"]');
    fireEvent.click(churchCard!);

    await waitFor(() => {
      expect(screen.getByText('Ministries in Main Campus')).toBeInTheDocument();
      expect(screen.getByText('Worship Ministry')).toBeInTheDocument();
      expect(screen.getByText('Youth Ministry')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/worship/ministries?churchId=1');
  });

  it('navigates to services when ministry is selected', async () => {
    // Mock initial churches load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChurches,
      }),
    });

    // Mock ministries load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockMinistries,
      }),
    });

    // Mock services load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockServices,
      }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);

    // Wait for churches to load and select one
    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
    });

    const churchCard = screen.getByText('Main Campus').closest('[data-testid="card"]');
    fireEvent.click(churchCard!);

    // Wait for ministries to load and select one
    await waitFor(() => {
      expect(screen.getByText('Worship Ministry')).toBeInTheDocument();
    });

    const ministryCard = screen.getByText('Worship Ministry').closest('[data-testid="card"]');
    fireEvent.click(ministryCard!);

    await waitFor(() => {
      expect(screen.getByText('Services in Worship Ministry')).toBeInTheDocument();
      expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
      expect(screen.getByText('Wednesday Prayer')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/worship/services?ministryId=1');
  });

  it('displays breadcrumbs correctly', async () => {
    // Mock all API calls
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);

    // Navigate to a church
    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
    });

    const churchCard = screen.getByText('Main Campus').closest('[data-testid="card"]');
    fireEvent.click(churchCard!);

    // Check breadcrumbs
    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
      // The breadcrumb should show the church name
      const breadcrumbButtons = screen.getAllByText('Main Campus');
      expect(breadcrumbButtons.length).toBeGreaterThan(1); // One in title, one in breadcrumb
    });
  });

  it('calls onSelectionChange callback when selections are made', async () => {
    const mockOnSelectionChange = vi.fn();
    
    // Mock API calls
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    });

    render(
      <OrganizationalHierarchy 
        organizationId={mockOrganizationId} 
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Select a church
    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
    });

    const churchCard = screen.getByText('Main Campus').closest('[data-testid="card"]');
    fireEvent.click(churchCard!);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        church: mockChurches[0],
        ministry: undefined,
        service: undefined,
      });
    });
  });

  it('shows back button and allows navigation back', async () => {
    // Mock API calls
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);

    // Navigate to a church
    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
    });

    const churchCard = screen.getByText('Main Campus').closest('[data-testid="card"]');
    fireEvent.click(churchCard!);

    // Check back button appears
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Should be back to churches view
    await waitFor(() => {
      expect(screen.getByText('Churches')).toBeInTheDocument();
    });
  });

  it('displays current selection summary', async () => {
    // Mock API calls
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockServices }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);

    // Navigate through hierarchy
    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
    });

    const churchCard = screen.getByText('Main Campus').closest('[data-testid="card"]');
    fireEvent.click(churchCard!);

    await waitFor(() => {
      expect(screen.getByText('Worship Ministry')).toBeInTheDocument();
    });

    const ministryCard = screen.getByText('Worship Ministry').closest('[data-testid="card"]');
    fireEvent.click(ministryCard!);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
    });

    const serviceCard = screen.getByText('Sunday Morning Service').closest('[data-testid="card"]');
    fireEvent.click(serviceCard!);

    // Check selection summary
    await waitFor(() => {
      expect(screen.getByText('Current Selection')).toBeInTheDocument();
      expect(screen.getByText('Church:')).toBeInTheDocument();
      expect(screen.getByText('Ministry:')).toBeInTheDocument();
      expect(screen.getByText('Service:')).toBeInTheDocument();
    });
  });

  it('formats duration correctly', async () => {
    // Mock API calls to get to services
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockServices }),
    });

    render(<OrganizationalHierarchy organizationId={mockOrganizationId} />);

    // Navigate to services
    await waitFor(() => {
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
    });

    const churchCard = screen.getByText('Main Campus').closest('[data-testid="card"]');
    fireEvent.click(churchCard!);

    await waitFor(() => {
      expect(screen.getByText('Worship Ministry')).toBeInTheDocument();
    });

    const ministryCard = screen.getByText('Worship Ministry').closest('[data-testid="card"]');
    fireEvent.click(ministryCard!);

    // Check duration formatting
    await waitFor(() => {
      expect(screen.getByText('Default: 1h 30m')).toBeInTheDocument(); // 90 minutes
      expect(screen.getByText('Default: 1h')).toBeInTheDocument(); // 60 minutes
    });
  });

  it('handles initial selection prop', async () => {
    const mockOnSelectionChange = vi.fn();
    
    // Mock all API calls
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockChurches }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMinistries }),
    });

    render(
      <OrganizationalHierarchy 
        organizationId={mockOrganizationId}
        onSelectionChange={mockOnSelectionChange}
        initialSelection={{ churchId: 1, ministryId: 1 }}
      />
    );

    // Should automatically navigate to the specified church and ministry
    await waitFor(() => {
      expect(screen.getByText('Ministries in Main Campus')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/worship/ministries?churchId=1');
  });
});