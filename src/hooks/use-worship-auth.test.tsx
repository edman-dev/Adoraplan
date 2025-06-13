import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UserContextType } from '@/contexts/user-context';
import { useUserContext } from '@/contexts/user-context';

import {
  useRequireWorshipAuth,
  useWorshipAuth,
  useWorshipPermission,
  useWorshipPermissions,
  useWorshipRole,
  useWorshipRoles,
} from './use-worship-auth';

// Mock the user context
vi.mock('@/contexts/user-context', () => ({
  useUserContext: vi.fn(),
}));

// Create mock user context helper function
const createMockUserContext = (overrides: Partial<UserContextType> = {}): UserContextType => ({
  user: { id: 'user_123' } as any,
  organization: { id: 'org_456' } as any,
  userRole: 'Admin',
  worshipRole: 'admin',
  isLoading: false,
  isSignedIn: true,
  userDisplayName: 'John Doe',
  organizationDisplayName: 'Test Church',
  isAdmin: true,
  isPastor: false,
  isOrganizationManager: false,
  isMinistryLeader: false,
  isWorshipAdmin: true,
  isWorshipLeader: false,
  isWorshipPastor: false,
  isWorshipCollaborator: false,
  permissions: {
    canCreateChurch: true,
    canManageChurch: true,
    canDeleteChurch: true,
    canCreateMinistry: true,
    canManageMinistry: true,
    canDeleteMinistry: true,
    canCreateHymn: true,
    canEditHymn: true,
    canApproveHymn: true,
    canDeleteHymn: true,
    canCreateProgram: true,
    canEditProgram: true,
    canApproveProgram: true,
    canDeleteProgram: true,
    canCreateEvent: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canInviteUsers: true,
    canAssignRoles: true,
    canRemoveUsers: true,
    canViewAllFeedback: true,
    canResolveFeedback: true,
    canManageSubscription: true,
    canViewUsageStats: true,
  },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWorshipAuth basic functionality', () => {
  it('should return authentication state correctly', () => {
    const mockContext = createMockUserContext();
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasOrganization).toBe(true);
    expect(result.current.userId).toBe('user_123');
    expect(result.current.organizationId).toBe('org_456');
    expect(result.current.worshipRole).toBe('admin');
  });

  it('should handle loading state', () => {
    const mockContext = createMockUserContext({ isLoading: true });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle unauthenticated state', () => {
    const mockContext = createMockUserContext({
      isSignedIn: false,
      user: null,
      organization: null,
      worshipRole: 'member',
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.hasOrganization).toBe(false);
    expect(result.current.userId).toBe(null);
    expect(result.current.organizationId).toBe(null);
  });
});

describe('permission checking', () => {
  it('should check permissions correctly for admin', () => {
    const mockContext = createMockUserContext();
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.hasPermission('canCreateChurch')).toBe(true);
    expect(result.current.hasPermission('canManageSubscription')).toBe(true);
    expect(result.current.canCreateChurch).toBe(true);
    expect(result.current.canManageSubscription).toBe(true);
  });

  it('should check permissions correctly for collaborator', () => {
    const mockContext = createMockUserContext({
      worshipRole: 'collaborator',
      isWorshipAdmin: false,
      isWorshipCollaborator: true,
      permissions: {
        canCreateChurch: false,
        canManageChurch: false,
        canDeleteChurch: false,
        canCreateMinistry: false,
        canManageMinistry: false,
        canDeleteMinistry: false,
        canCreateHymn: true,
        canEditHymn: true,
        canApproveHymn: false,
        canDeleteHymn: false,
        canCreateProgram: true,
        canEditProgram: true,
        canApproveProgram: false,
        canDeleteProgram: false,
        canCreateEvent: true,
        canEditEvent: true,
        canDeleteEvent: false,
        canInviteUsers: false,
        canAssignRoles: false,
        canRemoveUsers: false,
        canViewAllFeedback: false,
        canResolveFeedback: false,
        canManageSubscription: false,
        canViewUsageStats: false,
      },
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.canCreateChurch).toBe(false);
    expect(result.current.canCreateHymn).toBe(true);
    expect(result.current.canApproveHymn).toBe(false);
    expect(result.current.canManageSubscription).toBe(false);
  });
});

describe('role checking', () => {
  it('should check minimum role requirements correctly', () => {
    const mockContext = createMockUserContext({
      worshipRole: 'worship_leader',
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.hasMinimumRole('admin')).toBe(false);
    expect(result.current.hasMinimumRole('pastor')).toBe(false);
    expect(result.current.hasMinimumRole('worship_leader')).toBe(true);
    expect(result.current.hasMinimumRole('collaborator')).toBe(true);
    expect(result.current.hasMinimumRole('member')).toBe(true);
  });

  it('should identify role types correctly', () => {
    const mockContext = createMockUserContext({
      worshipRole: 'pastor',
      isWorshipAdmin: false,
      isWorshipPastor: true,
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.isWorshipAdmin).toBe(false);
    expect(result.current.isWorshipPastor).toBe(true);
    expect(result.current.isWorshipLeader).toBe(false);
    expect(result.current.isWorshipCollaborator).toBe(false);
    expect(result.current.isWorshipMember).toBe(false);
  });
});

describe('useWorshipPermission', () => {
  it('should return permission status', () => {
    const mockContext = createMockUserContext();
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipPermission('canCreateChurch'));

    expect(result.current).toBe(true);
  });

  it('should return false for missing permissions', () => {
    const mockContext = createMockUserContext({
      worshipRole: 'member',
      permissions: {
        canCreateChurch: false,
        canManageChurch: false,
        canDeleteChurch: false,
        canCreateMinistry: false,
        canManageMinistry: false,
        canDeleteMinistry: false,
        canCreateHymn: false,
        canEditHymn: false,
        canApproveHymn: false,
        canDeleteHymn: false,
        canCreateProgram: false,
        canEditProgram: false,
        canApproveProgram: false,
        canDeleteProgram: false,
        canCreateEvent: false,
        canEditEvent: false,
        canDeleteEvent: false,
        canInviteUsers: false,
        canAssignRoles: false,
        canRemoveUsers: false,
        canViewAllFeedback: false,
        canResolveFeedback: false,
        canManageSubscription: false,
        canViewUsageStats: false,
      },
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipPermission('canCreateChurch'));

    expect(result.current).toBe(false);
  });
});

describe('useWorshipRole', () => {
  it('should return true for sufficient role', () => {
    const mockContext = createMockUserContext({
      worshipRole: 'admin',
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipRole('pastor'));

    expect(result.current).toBe(true);
  });

  it('should return false for insufficient role', () => {
    const mockContext = createMockUserContext({
      worshipRole: 'collaborator',
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipRole('pastor'));

    expect(result.current).toBe(false);
  });
});

describe('useRequireWorshipAuth', () => {
  it('should return auth result when authenticated', () => {
    const mockContext = createMockUserContext();
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useRequireWorshipAuth());

    expect(result.current).not.toBe(null);
    expect(result.current?.userId).toBe('user_123');
    expect(result.current?.organizationId).toBe('org_456');
  });

  it('should return null when loading', () => {
    const mockContext = createMockUserContext({ isLoading: true });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useRequireWorshipAuth());

    expect(result.current).toBe(null);
  });

  it('should return null when not authenticated', () => {
    const mockContext = createMockUserContext({
      isSignedIn: false,
      user: null,
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useRequireWorshipAuth());

    expect(result.current).toBe(null);
  });

  it('should return null when no organization', () => {
    const mockContext = createMockUserContext({
      organization: null,
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useRequireWorshipAuth());

    expect(result.current).toBe(null);
  });
});

describe('convenience hooks', () => {
  describe('useWorshipRoles', () => {
    it('should provide role checking hooks', () => {
      const mockContext = createMockUserContext({
        worshipRole: 'worship_leader',
      });
      (useUserContext as any).mockReturnValue(mockContext);

      const { result: isAdmin } = renderHook(() => useWorshipRoles.useIsAdmin());
      const { result: isPastor } = renderHook(() => useWorshipRoles.useIsPastor());
      const { result: isWorshipLeader } = renderHook(() => useWorshipRoles.useIsWorshipLeader());
      const { result: isCollaborator } = renderHook(() => useWorshipRoles.useIsCollaborator());

      expect(isAdmin.current).toBe(false);
      expect(isPastor.current).toBe(false);
      expect(isWorshipLeader.current).toBe(true);
      expect(isCollaborator.current).toBe(true); // worship_leader can do collaborator tasks
    });
  });

  describe('useWorshipPermissions', () => {
    it('should provide permission checking hooks', () => {
      const mockContext = createMockUserContext();
      (useUserContext as any).mockReturnValue(mockContext);

      const { result: canCreateChurch } = renderHook(() => useWorshipPermissions.useCanCreateChurch());
      const { result: canCreateHymn } = renderHook(() => useWorshipPermissions.useCanCreateHymn());
      const { result: canManageSubscription } = renderHook(() => useWorshipPermissions.useCanManageSubscription());

      expect(canCreateChurch.current).toBe(true);
      expect(canCreateHymn.current).toBe(true);
      expect(canManageSubscription.current).toBe(true);
    });
  });
});

describe('edge cases and error handling', () => {
  it('should handle missing user context gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (useUserContext as any).mockReturnValue(undefined);

    expect(() => {
      renderHook(() => useWorshipAuth());
    }).toThrow(); // useUserContext throws when context is undefined

    consoleSpy.mockRestore();
  });

  it('should handle partial user context data', () => {
    const mockContext = createMockUserContext({
      user: null,
      organization: null,
      userId: null,
      organizationId: null,
    });
    (useUserContext as any).mockReturnValue(mockContext);

    const { result } = renderHook(() => useWorshipAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.hasOrganization).toBe(false);
    expect(result.current.userId).toBe(null);
    expect(result.current.organizationId).toBe(null);
  });
});
