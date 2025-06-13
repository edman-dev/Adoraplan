import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrganizationalNavigation } from './use-organizational-navigation';

describe('useOrganizationalNavigation', () => {
  const mockChurch = {
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
  };

  const mockMinistry = {
    id: 1,
    churchId: 1,
    name: 'Worship Ministry',
    description: 'Sunday worship services',
    color: '#3B82F6',
    icon: 'music',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockService = {
    id: 1,
    ministryId: 1,
    name: 'Sunday Morning Service',
    description: 'Main worship service',
    defaultDuration: 90,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('initializes with churches level', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    expect(result.current.currentLevel).toBe('churches');
    expect(result.current.currentChurch).toBeUndefined();
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();
    expect(result.current.canNavigateBack()).toBe(false);
    expect(result.current.hasSelection()).toBe(false);
  });

  it('can initialize with initial state', () => {
    const initialState = {
      church: mockChurch,
      level: 'ministries' as const,
    };

    const { result } = renderHook(() => useOrganizationalNavigation(initialState));

    expect(result.current.currentLevel).toBe('ministries');
    expect(result.current.currentChurch).toEqual(mockChurch);
    expect(result.current.hasSelection()).toBe(true);
  });

  it('selects church and navigates to ministries level', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    act(() => {
      result.current.selectChurch(mockChurch);
    });

    expect(result.current.currentLevel).toBe('ministries');
    expect(result.current.currentChurch).toEqual(mockChurch);
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();
    expect(result.current.canNavigateBack()).toBe(true);
    expect(result.current.hasSelection()).toBe(true);
  });

  it('selects ministry and navigates to services level', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // First select a church
    act(() => {
      result.current.selectChurch(mockChurch);
    });

    // Then select a ministry
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });

    expect(result.current.currentLevel).toBe('services');
    expect(result.current.currentChurch).toEqual(mockChurch);
    expect(result.current.currentMinistry).toEqual(mockMinistry);
    expect(result.current.currentService).toBeUndefined();
    expect(result.current.canNavigateBack()).toBe(true);
  });

  it('selects service at services level', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Navigate to services level
    act(() => {
      result.current.selectChurch(mockChurch);
    });
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });

    // Select a service
    act(() => {
      result.current.selectService(mockService);
    });

    expect(result.current.currentLevel).toBe('services');
    expect(result.current.currentChurch).toEqual(mockChurch);
    expect(result.current.currentMinistry).toEqual(mockMinistry);
    expect(result.current.currentService).toEqual(mockService);
  });

  it('navigates back correctly', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Navigate to services level
    act(() => {
      result.current.selectChurch(mockChurch);
    });
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });

    expect(result.current.currentLevel).toBe('services');

    // Navigate back to ministries
    act(() => {
      result.current.navigateBack();
    });

    expect(result.current.currentLevel).toBe('ministries');
    expect(result.current.currentChurch).toEqual(mockChurch);
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();

    // Navigate back to churches
    act(() => {
      result.current.navigateBack();
    });

    expect(result.current.currentLevel).toBe('churches');
    expect(result.current.currentChurch).toBeUndefined();
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();
    expect(result.current.canNavigateBack()).toBe(false);
  });

  it('navigates directly to specific levels', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Set up full hierarchy
    act(() => {
      result.current.selectChurch(mockChurch);
    });
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });
    act(() => {
      result.current.selectService(mockService);
    });

    // Navigate directly to ministries
    act(() => {
      result.current.navigateToMinistries();
    });

    expect(result.current.currentLevel).toBe('ministries');
    expect(result.current.currentChurch).toEqual(mockChurch);
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();

    // Navigate directly to churches
    act(() => {
      result.current.navigateToChurches();
    });

    expect(result.current.currentLevel).toBe('churches');
    expect(result.current.currentChurch).toBeUndefined();
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();
  });

  it('checks current level correctly', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    expect(result.current.isAtLevel('churches')).toBe(true);
    expect(result.current.isAtLevel('ministries')).toBe(false);
    expect(result.current.isAtLevel('services')).toBe(false);

    act(() => {
      result.current.selectChurch(mockChurch);
    });

    expect(result.current.isAtLevel('churches')).toBe(false);
    expect(result.current.isAtLevel('ministries')).toBe(true);
    expect(result.current.isAtLevel('services')).toBe(false);
  });

  it('generates navigation path correctly', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Empty path initially
    expect(result.current.getNavigationPath()).toEqual({});

    // Path with church
    act(() => {
      result.current.selectChurch(mockChurch);
    });

    expect(result.current.getNavigationPath()).toEqual({
      church: { id: 1, name: 'Main Campus' }
    });

    // Path with church and ministry
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });

    expect(result.current.getNavigationPath()).toEqual({
      church: { id: 1, name: 'Main Campus' },
      ministry: { id: 1, name: 'Worship Ministry', color: '#3B82F6' }
    });

    // Full path
    act(() => {
      result.current.selectService(mockService);
    });

    expect(result.current.getNavigationPath()).toEqual({
      church: { id: 1, name: 'Main Campus' },
      ministry: { id: 1, name: 'Worship Ministry', color: '#3B82F6' },
      service: { id: 1, name: 'Sunday Morning Service' }
    });
  });

  it('generates selection summary correctly', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Empty summary initially
    expect(result.current.getSelectionSummary()).toEqual({});

    // Summary with selections
    act(() => {
      result.current.selectChurch(mockChurch);
    });
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });
    act(() => {
      result.current.selectService(mockService);
    });

    expect(result.current.getSelectionSummary()).toEqual({
      church: 'Main Campus',
      ministry: 'Worship Ministry',
      service: 'Sunday Morning Service'
    });
  });

  it('resets navigation state', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Set up full hierarchy
    act(() => {
      result.current.selectChurch(mockChurch);
    });
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });
    act(() => {
      result.current.selectService(mockService);
    });

    expect(result.current.hasSelection()).toBe(true);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.currentLevel).toBe('churches');
    expect(result.current.currentChurch).toBeUndefined();
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();
    expect(result.current.hasSelection()).toBe(false);
    expect(result.current.canNavigateBack()).toBe(false);
  });

  it('clears ministry and service when selecting new church', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Set up full hierarchy
    act(() => {
      result.current.selectChurch(mockChurch);
    });
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });
    act(() => {
      result.current.selectService(mockService);
    });

    // Select a new church
    const newChurch = { ...mockChurch, id: 2, name: 'West Campus' };
    act(() => {
      result.current.selectChurch(newChurch);
    });

    expect(result.current.currentChurch).toEqual(newChurch);
    expect(result.current.currentMinistry).toBeUndefined();
    expect(result.current.currentService).toBeUndefined();
    expect(result.current.currentLevel).toBe('ministries');
  });

  it('clears service when selecting new ministry', () => {
    const { result } = renderHook(() => useOrganizationalNavigation());

    // Set up full hierarchy
    act(() => {
      result.current.selectChurch(mockChurch);
    });
    act(() => {
      result.current.selectMinistry(mockMinistry);
    });
    act(() => {
      result.current.selectService(mockService);
    });

    // Select a new ministry
    const newMinistry = { ...mockMinistry, id: 2, name: 'Youth Ministry' };
    act(() => {
      result.current.selectMinistry(newMinistry);
    });

    expect(result.current.currentChurch).toEqual(mockChurch);
    expect(result.current.currentMinistry).toEqual(newMinistry);
    expect(result.current.currentService).toBeUndefined();
    expect(result.current.currentLevel).toBe('services');
  });
});