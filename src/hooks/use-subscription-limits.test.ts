import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscriptionLimits, useResourceLimit, useUpgradePrompt } from './use-subscription-limits';

// Mock fetch
global.fetch = vi.fn();

const mockUsageResponse = {
  success: true,
  data: {
    churches: 1,
    ministries: 3,
    collaborators: 2,
    services: 10,
  },
};

describe('useSubscriptionUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsageResponse),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches usage data successfully', async () => {
    const { result } = renderHook(() => useSubscriptionUsage());

    expect(result.current.loading).toBe(true);
    expect(result.current.usage).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toEqual(mockUsageResponse.data);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('/api/worship/subscription/usage');
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSubscriptionUsage());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toBeNull();
    expect(result.current.error).toBe('Failed to fetch subscription usage');
  });

  it('handles API error responses', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useSubscriptionUsage());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toBeNull();
    expect(result.current.error).toBe('Failed to fetch subscription usage');
  });

  it('provides refetch functionality', async () => {
    const { result } = renderHook(() => useSubscriptionUsage());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    vi.clearAllMocks();

    // Call refetch
    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledWith('/api/worship/subscription/usage');
  });

  it('can be disabled with enabled option', () => {
    const { result } = renderHook(() => useSubscriptionUsage({ enabled: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.usage).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('useResourceLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsageResponse),
    });
  });

  it('returns correct limit check for churches', async () => {
    const { result } = renderHook(() => useResourceLimit('churches'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(false); // 1 church at limit for free tier
    expect(result.current.current).toBe(1);
    expect(result.current.limit).toBe(1);
    expect(result.current.percentage).toBe(100);
    expect(result.current.warningLevel).toBe('danger');
  });

  it('returns correct limit check for ministries', async () => {
    const { result } = renderHook(() => useResourceLimit('ministries'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(true); // 3 ministries under limit of 5
    expect(result.current.current).toBe(3);
    expect(result.current.limit).toBe(5);
    expect(result.current.percentage).toBe(60); // 3/5 = 60%
    expect(result.current.warningLevel).toBe('safe');
  });

  it('returns correct limit check for collaborators', async () => {
    const { result } = renderHook(() => useResourceLimit('collaborators'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(true); // 2 collaborators under limit of 5
    expect(result.current.current).toBe(2);
    expect(result.current.limit).toBe(5);
    expect(result.current.percentage).toBe(40); // 2/5 = 40%
    expect(result.current.warningLevel).toBe('safe');
  });

  it('handles unlimited resources (services)', async () => {
    const { result } = renderHook(() => useResourceLimit('services'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(true);
    expect(result.current.current).toBe(10);
    expect(result.current.limit).toBe(-1); // Unlimited
    expect(result.current.percentage).toBe(0); // Unlimited shows 0%
    expect(result.current.warningLevel).toBe('safe');
  });

  it('calculates warning levels correctly', async () => {
    // Mock usage at warning threshold (4/5 = 80%)
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { ...mockUsageResponse.data, ministries: 4 },
      }),
    });

    const { result } = renderHook(() => useResourceLimit('ministries'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.percentage).toBe(80);
    expect(result.current.warningLevel).toBe('warning');
  });

  it('can override tier for testing', async () => {
    const { result } = renderHook(() => useResourceLimit('churches', { tier: 'pro' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(true); // Pro tier has unlimited churches
    expect(result.current.limit).toBe(-1);
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useResourceLimit('churches'));

    expect(result.current.loading).toBe(true);
    expect(result.current.allowed).toBe(true); // Default to true while loading
    expect(result.current.current).toBe(0);
    expect(result.current.limit).toBe(1);
  });
});

describe('useMultipleResourceLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsageResponse),
    });
  });

  it('returns limit checks for multiple resources', async () => {
    const { result } = renderHook(() => 
      useMultipleResourceLimits(['churches', 'ministries', 'collaborators'])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.limits).toHaveProperty('churches');
    expect(result.current.limits).toHaveProperty('ministries');
    expect(result.current.limits).toHaveProperty('collaborators');

    expect(result.current.limits.churches.allowed).toBe(false);
    expect(result.current.limits.ministries.allowed).toBe(true);
    expect(result.current.limits.collaborators.allowed).toBe(true);
  });

  it('calculates overall allowed status correctly', async () => {
    const { result } = renderHook(() => 
      useMultipleResourceLimits(['ministries', 'collaborators'])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Both ministries and collaborators are under limit
    expect(result.current.allAllowed).toBe(true);
  });

  it('returns false for allAllowed when any resource is at limit', async () => {
    const { result } = renderHook(() => 
      useMultipleResourceLimits(['churches', 'ministries'])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Churches is at limit, so allAllowed should be false
    expect(result.current.allAllowed).toBe(false);
  });

  it('identifies resources at limits', async () => {
    const { result } = renderHook(() => 
      useMultipleResourceLimits(['churches', 'ministries', 'collaborators'])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.atLimits).toEqual(['churches']);
  });

  it('identifies resources approaching limits', async () => {
    // Mock usage with ministries at warning threshold
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { ...mockUsageResponse.data, ministries: 4 }, // 4/5 = 80%
      }),
    });

    const { result } = renderHook(() => 
      useMultipleResourceLimits(['churches', 'ministries', 'collaborators'])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.approachingLimits).toEqual(['ministries']);
  });

  it('handles empty resource array', async () => {
    const { result } = renderHook(() => useMultipleResourceLimits([]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.limits).toEqual({});
    expect(result.current.allAllowed).toBe(true);
    expect(result.current.atLimits).toEqual([]);
    expect(result.current.approachingLimits).toEqual([]);
  });

  it('can override tier for testing', async () => {
    const { result } = renderHook(() => 
      useMultipleResourceLimits(['churches', 'ministries'], { tier: 'team' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Team tier: 1 church (at limit), 25 ministries (under limit)
    expect(result.current.limits.churches.allowed).toBe(false);
    expect(result.current.limits.ministries.allowed).toBe(true);
    expect(result.current.limits.ministries.limit).toBe(25);
  });
});