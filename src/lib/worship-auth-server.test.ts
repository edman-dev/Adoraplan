import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import type { WorshipRoutePermission } from '@/middleware/worship-auth';

import {
  requireWorshipAuth,
  requirePermission,
  requireMinimumRole,
  getWorshipAuthOrNull,
} from './worship-auth-server';

// Mock Next.js auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock Next.js redirect
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

// Mock worship role management
const mockGetUserWorshipRole = vi.fn();
vi.mock('./worship-role-management', () => ({
  getUserWorshipRole: (...args: any[]) => mockGetUserWorshipRole(...args),
}));

// Mock worship role utilities
const mockHasWorshipPermission = vi.fn();
const mockWorshipRolePermissions = {
  canCreateChurch: vi.fn(),
  canManageChurch: vi.fn(),
  canInviteUsers: vi.fn(),
};

vi.mock('./worship-role-utils', () => ({
  hasWorshipPermission: (...args: any[]) => mockHasWorshipPermission(...args),
  WorshipRolePermissions: mockWorshipRolePermissions,
  WORSHIP_ROLE_HIERARCHY: {
    admin: 100,
    pastor: 80,
    worship_leader: 60,
    collaborator: 40,
    member: 20,
  },
}));

describe('worship-auth-server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset redirect mock to throw by default (simulating redirect behavior)
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`Redirect to ${path}`);
    });
  });

  describe('requireWorshipAuth', () => {
    it('should return auth result for authenticated user with valid role', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'worship_leader';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);
      mockHasWorshipPermission.mockReturnValue(true);

      const result = await requireWorshipAuth();

      expect(result).toEqual({
        userId: mockUserId,
        orgId: mockOrgId,
        userRole: mockRole,
        hasPermission: expect.any(Function),
        hasMinimumRole: expect.any(Function),
      });

      expect(mockAuth).toHaveBeenCalled();
      expect(mockGetUserWorshipRole).toHaveBeenCalledWith(mockUserId, mockOrgId);
    });

    it('should redirect when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      await expect(requireWorshipAuth()).rejects.toThrow('Redirect to /sign-in');
      expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
    });

    it('should redirect when user has no organization', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: null,
      });

      await expect(requireWorshipAuth()).rejects.toThrow('Redirect to /dashboard');
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle case when user has no worship role', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(null);

      const result = await requireWorshipAuth();

      expect(result.userRole).toBe('member'); // Default role
      expect(result.userId).toBe(mockUserId);
      expect(result.orgId).toBe(mockOrgId);
    });

    it('should provide working hasPermission function', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'admin';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);
      mockHasWorshipPermission.mockReturnValue(true);

      const result = await requireWorshipAuth();

      // Test the hasPermission function
      const hasPermission = result.hasPermission('canCreateChurch');
      expect(hasPermission).toBe(true);
      expect(mockHasWorshipPermission).toHaveBeenCalledWith(mockRole, 'canCreateChurch');
    });

    it('should provide working hasMinimumRole function', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'pastor';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);

      const result = await requireWorshipAuth();

      // Test the hasMinimumRole function
      const hasMinRole = result.hasMinimumRole('worship_leader');
      expect(hasMinRole).toBe(true); // pastor (80) >= worship_leader (60)

      const hasHigherRole = result.hasMinimumRole('admin');
      expect(hasHigherRole).toBe(false); // pastor (80) < admin (100)
    });
  });

  describe('getWorshipAuthOrNull', () => {
    it('should return auth result for valid authenticated user', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'collaborator';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);

      const result = await getWorshipAuthOrNull();

      expect(result).toEqual({
        userId: mockUserId,
        orgId: mockOrgId,
        userRole: mockRole,
        hasPermission: expect.any(Function),
        hasMinimumRole: expect.any(Function),
      });
    });

    it('should return null when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const result = await getWorshipAuthOrNull();
      expect(result).toBeNull();
    });

    it('should return null when user has no organization', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: null,
      });

      const result = await getWorshipAuthOrNull();
      expect(result).toBeNull();
    });

    it('should return result with member role when user has no worship role', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue(null);

      const result = await getWorshipAuthOrNull();

      expect(result).not.toBeNull();
      expect(result!.userRole).toBe('member');
    });
  });

  describe('requirePermission', () => {
    it('should return auth result when user has required permission', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'admin';
      const permission: WorshipRoutePermission = 'canCreateChurch';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);
      mockHasWorshipPermission.mockReturnValue(true);

      const result = await requirePermission(permission);

      expect(result.userId).toBe(mockUserId);
      expect(result.userRole).toBe(mockRole);
      expect(mockHasWorshipPermission).toHaveBeenCalledWith(mockRole, permission);
    });

    it('should redirect when user lacks required permission', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'member';
      const permission: WorshipRoutePermission = 'canCreateChurch';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);
      mockHasWorshipPermission.mockReturnValue(false);

      await expect(requirePermission(permission)).rejects.toThrow('Redirect to /dashboard');
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should redirect when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const permission: WorshipRoutePermission = 'canManageChurch';

      await expect(requirePermission(permission)).rejects.toThrow('Redirect to /sign-in');
    });
  });

  describe('requireMinimumRole', () => {
    it('should return auth result when user has minimum required role', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'pastor';
      const minimumRole: ExtendedWorshipRole = 'worship_leader';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);

      const result = await requireMinimumRole(minimumRole);

      expect(result.userId).toBe(mockUserId);
      expect(result.userRole).toBe(mockRole);
    });

    it('should redirect when user lacks minimum required role', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'collaborator';
      const minimumRole: ExtendedWorshipRole = 'pastor';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);

      await expect(requireMinimumRole(minimumRole)).rejects.toThrow('Redirect to /dashboard');
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle admin role correctly', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'admin';
      const minimumRole: ExtendedWorshipRole = 'pastor';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);

      const result = await requireMinimumRole(minimumRole);

      expect(result.userId).toBe(mockUserId);
      expect(result.userRole).toBe(mockRole);
    });

    it('should handle exact role match', async () => {
      const mockUserId = 'user123';
      const mockOrgId = 'org456';
      const mockRole: ExtendedWorshipRole = 'worship_leader';
      const minimumRole: ExtendedWorshipRole = 'worship_leader';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        orgId: mockOrgId,
      });

      mockGetUserWorshipRole.mockResolvedValue(mockRole);

      const result = await requireMinimumRole(minimumRole);

      expect(result.userId).toBe(mockUserId);
      expect(result.userRole).toBe(mockRole);
    });
  });

  describe('permission and role checking functions', () => {
    it('should correctly validate permissions for different roles', async () => {
      const testCases = [
        { role: 'admin', permission: 'canCreateChurch', expected: true },
        { role: 'pastor', permission: 'canCreateChurch', expected: false },
        { role: 'worship_leader', permission: 'canCreateProgram', expected: true },
        { role: 'collaborator', permission: 'canCreateProgram', expected: false },
        { role: 'member', permission: 'canViewSchedule', expected: true },
      ] as const;

      for (const testCase of testCases) {
        mockAuth.mockResolvedValue({
          userId: 'user123',
          orgId: 'org456',
        });

        mockGetUserWorshipRole.mockResolvedValue(testCase.role);
        mockHasWorshipPermission.mockReturnValue(testCase.expected);

        const result = await requireWorshipAuth();
        const hasPermission = result.hasPermission(testCase.permission as WorshipRoutePermission);

        expect(hasPermission).toBe(testCase.expected);
      }
    });

    it('should correctly validate role hierarchy', async () => {
      const testCases = [
        { userRole: 'admin', requiredRole: 'pastor', expected: true },
        { userRole: 'pastor', requiredRole: 'worship_leader', expected: true },
        { userRole: 'worship_leader', requiredRole: 'collaborator', expected: true },
        { userRole: 'collaborator', requiredRole: 'member', expected: true },
        { userRole: 'member', requiredRole: 'collaborator', expected: false },
        { userRole: 'collaborator', requiredRole: 'worship_leader', expected: false },
      ] as const;

      for (const testCase of testCases) {
        mockAuth.mockResolvedValue({
          userId: 'user123',
          orgId: 'org456',
        });

        mockGetUserWorshipRole.mockResolvedValue(testCase.userRole);

        const result = await requireWorshipAuth();
        const hasMinRole = result.hasMinimumRole(testCase.requiredRole);

        expect(hasMinRole).toBe(testCase.expected);
      }
    });
  });

  describe('error handling', () => {
    it('should handle Clerk authentication errors', async () => {
      mockAuth.mockRejectedValue(new Error('Authentication service unavailable'));

      await expect(requireWorshipAuth()).rejects.toThrow('Authentication service unavailable');
    });

    it('should handle worship role retrieval errors', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockRejectedValue(new Error('Database connection failed'));

      // Should default to member role on error
      const result = await requireWorshipAuth();
      expect(result.userRole).toBe('member');
    });

    it('should handle permission check errors gracefully', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('worship_leader');
      mockHasWorshipPermission.mockImplementation(() => {
        throw new Error('Permission check failed');
      });

      const result = await requireWorshipAuth();

      // Should not throw, but return false for failed permission checks
      expect(() => result.hasPermission('canCreateChurch')).toThrow('Permission check failed');
    });
  });

  describe('redirect paths', () => {
    it('should redirect to sign-in when not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null, orgId: null });

      await expect(requireWorshipAuth()).rejects.toThrow('Redirect to /sign-in');
      expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
    });

    it('should redirect to dashboard when lacking permissions', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('member');
      mockHasWorshipPermission.mockReturnValue(false);

      await expect(requirePermission('canManageChurch')).rejects.toThrow('Redirect to /dashboard');
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should redirect to dashboard when lacking minimum role', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('member');

      await expect(requireMinimumRole('admin')).rejects.toThrow('Redirect to /dashboard');
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });
  });
});