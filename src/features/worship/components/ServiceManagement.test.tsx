import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceManagement } from './ServiceManagement';

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
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

// Dialog state for testing
let dialogOpen = false;

// Mock dialog with proper state management
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => {
    if (open !== undefined) {
      dialogOpen = open;
    }
    return <div data-testid="dialog-wrapper">{children}</div>;
  },
  DialogContent: ({ children }: any) => 
    dialogOpen ? <div data-testid="dialog-content">{children}</div> : null,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h4 data-testid="dialog-title">{children}</h4>,
  DialogTrigger: ({ children, asChild }: any) => (
    <div 
      data-testid="dialog-trigger" 
      onClick={() => { dialogOpen = true; }}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select-container">
      <select
        data-testid="select"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {/* Extract option values from children */}
        <option value="">Select...</option>
        <option value="1">Worship Ministry</option>
        <option value="2">Youth Ministry</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid={`select-item-${value}`}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-placeholder">{placeholder}</span>,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock confirm
global.confirm = vi.fn();

describe('ServiceManagement', () => {
  // Mock console methods to avoid warnings in tests
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const mockMinistries = [
    {
      id: 1,
      name: 'Worship Ministry',
      color: '#3B82F6',
      icon: 'music',
    },
    {
      id: 2,
      name: 'Youth Ministry',
      color: '#10B981',
      icon: 'users',
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
      createdBy: 'user1',
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
      createdBy: 'user1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    dialogOpen = false;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders without crashing', () => {
    render(<ServiceManagement ministries={mockMinistries} />);
    expect(screen.getByText('Service Management')).toBeInTheDocument();
  });

  it('displays ministry selection dropdown', () => {
    render(<ServiceManagement ministries={mockMinistries} />);
    
    expect(screen.getByText('Select Ministry')).toBeInTheDocument();
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });

  it('loads services when ministry is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockServices,
      }),
    });

    const { rerender } = render(
      <ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/worship/services?ministryId=1');
    });
  });

  it('displays services list when ministry is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockServices,
      }),
    });

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
      expect(screen.getByText('Wednesday Prayer')).toBeInTheDocument();
    });
  });

  it('shows empty state when no services exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
    });
  });

  it('opens create dialog when Add Service button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockServices,
      }),
    });

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Services for Worship Ministry')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Service');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Service')).toBeInTheDocument();
    });
  });

  it('creates a new service successfully', async () => {
    // Mock initial services load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    // Mock service creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 3,
          ministryId: 1,
          name: 'Youth Service',
          description: 'Weekly youth gathering',
          defaultDuration: 90,
          isActive: true,
          createdBy: 'user1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      }),
    });

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Services for Worship Ministry')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Service');
    fireEvent.click(addButton);

    // Fill out the form
    const nameInput = screen.getAllByTestId('input')[0];
    fireEvent.change(nameInput, { target: { value: 'Youth Service' } });

    const descriptionTextarea = screen.getByTestId('textarea');
    fireEvent.change(descriptionTextarea, { target: { value: 'Weekly youth gathering' } });

    const createButton = screen.getByText('Create Service');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/worship/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ministryId: 1,
          name: 'Youth Service',
          description: 'Weekly youth gathering',
          defaultDuration: 90,
        }),
      });
    });
  });

  it('handles service update', async () => {
    // Mock initial services load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockServices,
      }),
    });

    // Mock service update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ...mockServices[0],
          name: 'Updated Service Name',
        },
      }),
    });

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Service')).toBeInTheDocument();

    const nameInput = screen.getAllByTestId('input')[0];
    fireEvent.change(nameInput, { target: { value: 'Updated Service Name' } });

    const updateButton = screen.getByText('Update Service');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/worship/services/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Service Name',
          description: 'Main worship service',
          defaultDuration: 90,
        }),
      });
    });
  });

  it('handles service deletion', async () => {
    // Mock initial services load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockServices,
      }),
    });

    // Mock service deletion
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    (global.confirm as any).mockReturnValue(true);

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/worship/services/1', {
        method: 'DELETE',
      });
    });
  });

  it('formats duration correctly', async () => {
    const servicesWithDifferentDurations = [
      { ...mockServices[0], defaultDuration: 90 }, // 1h 30m
      { ...mockServices[1], defaultDuration: 60 }, // 1h
      { ...mockServices[0], id: 3, defaultDuration: 45 }, // 45m
      { ...mockServices[0], id: 4, defaultDuration: 120 }, // 2h
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: servicesWithDifferentDurations,
      }),
    });

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Default Duration: 1h 30m')).toBeInTheDocument();
      expect(screen.getByText('Default Duration: 1h')).toBeInTheDocument();
      expect(screen.getByText('Default Duration: 45m')).toBeInTheDocument();
      expect(screen.getByText('Default Duration: 2h')).toBeInTheDocument();
    });
  });

  it('calls onMinistryChange when ministry selection changes', () => {
    const mockOnMinistryChange = vi.fn();
    
    render(
      <ServiceManagement
        ministries={mockMinistries}
        onMinistryChange={mockOnMinistryChange}
      />
    );

    const select = screen.getByTestId('select');
    fireEvent.change(select, { target: { value: '2' } });

    expect(mockOnMinistryChange).toHaveBeenCalledWith(2);
  });

  it('shows common service type quick buttons', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<ServiceManagement ministries={mockMinistries} selectedMinistryId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Services for Worship Ministry')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Service');
    fireEvent.click(addButton);

    expect(screen.getByText('Common Service Types')).toBeInTheDocument();
    expect(screen.getByText('Sunday Morning Service')).toBeInTheDocument();
    expect(screen.getByText('Wednesday Prayer Meeting')).toBeInTheDocument();
  });
});