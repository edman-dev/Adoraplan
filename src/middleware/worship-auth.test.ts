import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { getUserWorshipRole } from '@/lib/worship-role-management';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';

import {
  checkUserPermission,
  createWorshipAuthMiddleware,
  getCurrentUserWorshipRole,
  withWorshipAuth,
  worshipAuthMiddleware,
} from './worship-auth';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock worship role management
vi.mock('@/lib/worship-role-management', () => ({
  getUserWorshipRole: vi.fn(),
}));

// Mock Next.js
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    })),
    redirect: vi.fn(url => ({
      redirect: url,
      status: 302,
    })),
    next: vi.fn(() => ({
      status: 200,
      continue: true,
    })),
  },
}));

describe('Worship Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorshipAuthMiddleware', () => {
    it('should redirect unauthenticated users to sign-in', async () => {
      const mockAuth = auth as any;
      mockAuth.mockResolvedValue({ userId: null, orgId: null });

      const middleware = createWorshipAuthMiddleware();
      const mockRequest = { url: 'http://localhost/dashboard' } as any;

      await middleware(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/sign-in', mockRequest.url),
      );
    });

    it('should redirect users without organization to organization selection', async () => {
      const mockAuth = auth as any;
      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: null });

      const middleware = createWorshipAuthMiddleware();
      const mockRequest = { url: 'http://localhost/dashboard' } as any;

      await middleware(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/onboarding/organization-selection', mockRequest.url),
      );
    });

    it('should return JSON error for API routes when unauthenticated', async () => {
      const mockAuth = auth as any;
      mockAuth.mockResolvedValue({ userId: null, orgId: null });

      const middleware = createWorshipAuthMiddleware({ returnJson: true });
      const mockRequest = { url: 'http://localhost/api/worship/churches' } as any;

      await middleware(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        { status: 401 },
      );
    });

    it('should allow authenticated users with organization to continue', async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue('admin');

      const middleware = createWorshipAuthMiddleware();
      const mockRequest = { url: 'http://localhost/dashboard' } as any;

      await middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should check specific permissions when configured', async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue('collaborator');

      const middleware = createWorshipAuthMiddleware({
        permission: 'canCreateChurch',
      });
      const mockRequest = { url: 'http://localhost/dashboard/churches/new' } as any;

      await middleware(mockRequest);

      // Collaborator cannot create churches, should redirect
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/dashboard?error=insufficient-permissions', mockRequest.url),
      );
    });

    it('should allow users with sufficient permissions', async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue('admin');

      const middleware = createWorshipAuthMiddleware({
        permission: 'canCreateChurch',
      });
      const mockRequest = { url: 'http://localhost/dashboard/churches/new' } as any;

      await middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should check minimum role requirements', async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue('collaborator');

      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'pastor',
      });
      const mockRequest = { url: 'http://localhost/dashboard/admin' } as any;

      await middleware(mockRequest);

      // Collaborator does not meet pastor minimum role
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/dashboard?error=insufficient-role', mockRequest.url),
      );
    });
  });

  describe('worshipAuthMiddleware factory functions', () => {
    it('should create middleware for church managers', async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue('pastor');

      const middleware = worshipAuthMiddleware.churchManager();
      const mockRequest = { url: 'http://localhost/dashboard/churches' } as any;

      await middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should create API middleware with JSON responses', async () => {
      const mockAuth = auth as any;
      mockAuth.mockResolvedValue({ userId: null, orgId: null });

      const middleware = worshipAuthMiddleware.api.basic();
      const mockRequest = { url: 'http://localhost/api/worship/hymns' } as any;

      await middleware(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        { status: 401 },
      );
    });
  });

  describe('withWorshipAuth wrapper', () => {
    it('should wrap API handlers with authentication', async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue('admin');

      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true }),
      );

      const wrappedHandler = withWorshipAuth(mockHandler, {
        permission: 'canManageChurch',
      });

      const mockRequest = { url: 'http://localhost/api/worship/churches' } as any;

      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    });

    it('should block unauthorized requests in wrapped handlers', async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue('member');

      const mockHandler = vi.fn();

      const wrappedHandler = withWorshipAuth(mockHandler, {
        permission: 'canManageChurch',
      });

      const mockRequest = { url: 'http://localhost/api/worship/churches' } as any;

      await wrappedHandler(mockRequest);

      // Handler should not be called for unauthorized users
      expect(mockHandler).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
    });
  });

  describe('utility functions', () => {
    describe('checkUserPermission', () => {
      it('should return true for users with permission', async () => {
        const mockAuth = auth as any;
        const mockGetUserWorshipRole = getUserWorshipRole as any;

        mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
        mockGetUserWorshipRole.mockResolvedValue('admin');

        const hasPermission = await checkUserPermission('canCreateChurch');

        expect(hasPermission).toBe(true);
      });

      it('should return false for users without permission', async () => {
        const mockAuth = auth as any;
        const mockGetUserWorshipRole = getUserWorshipRole as any;

        mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
        mockGetUserWorshipRole.mockResolvedValue('member');

        const hasPermission = await checkUserPermission('canCreateChurch');

        expect(hasPermission).toBe(false);
      });

      it('should return false for unauthenticated users', async () => {
        const mockAuth = auth as any;
        mockAuth.mockResolvedValue({ userId: null, orgId: null });

        const hasPermission = await checkUserPermission('canCreateChurch');

        expect(hasPermission).toBe(false);
      });
    });

    describe('getCurrentUserWorshipRole', () => {
      it('should return user worship role', async () => {
        const mockAuth = auth as any;
        const mockGetUserWorshipRole = getUserWorshipRole as any;

        mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
        mockGetUserWorshipRole.mockResolvedValue('worship_leader');

        const role = await getCurrentUserWorshipRole();

        expect(role).toBe('worship_leader');
      });

      it('should return member for unauthenticated users', async () => {
        const mockAuth = auth as any;
        mockAuth.mockResolvedValue({ userId: null, orgId: null });

        const role = await getCurrentUserWorshipRole();

        expect(role).toBe('member');
      });

      it('should handle errors gracefully', async () => {
        const mockAuth = auth as any;
        const mockGetUserWorshipRole = getUserWorshipRole as any;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
        mockGetUserWorshipRole.mockRejectedValue(new Error('Database error'));

        const role = await getCurrentUserWorshipRole();

        expect(role).toBe('member');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to get user worship role:',
          expect.any(Error),
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const mockAuth = auth as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuth.mockRejectedValue(new Error('Clerk error'));

      const middleware = createWorshipAuthMiddleware();
      const mockRequest = { url: 'http://localhost/dashboard' } as any;

      await middleware(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/dashboard?error=auth-failed', mockRequest.url),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Worship auth middleware error:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should return JSON errors for API routes when authentication fails', async () => {
      const mockAuth = auth as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuth.mockRejectedValue(new Error('Clerk error'));

      const middleware = createWorshipAuthMiddleware({ returnJson: true });
      const mockRequest = { url: 'http://localhost/api/worship/churches' } as any;

      await middleware(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Authentication failed' },
        { status: 500 },
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Worship auth middleware error:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});

// Test role hierarchy and permissions
describe('Role Permission Integration', () => {
  const testCases: Array<{
    role: ExtendedWorshipRole;
    permission: string;
    expected: boolean;
  }> = [
    { role: 'admin', permission: 'canCreateChurch', expected: true },
    { role: 'pastor', permission: 'canCreateChurch', expected: true },
    { role: 'worship_leader', permission: 'canCreateChurch', expected: false },
    { role: 'collaborator', permission: 'canCreateChurch', expected: false },
    { role: 'member', permission: 'canCreateChurch', expected: false },

    { role: 'admin', permission: 'canCreateHymn', expected: true },
    { role: 'pastor', permission: 'canCreateHymn', expected: true },
    { role: 'worship_leader', permission: 'canCreateHymn', expected: true },
    { role: 'collaborator', permission: 'canCreateHymn', expected: true },
    { role: 'member', permission: 'canCreateHymn', expected: false },

    { role: 'admin', permission: 'canManageSubscription', expected: true },
    { role: 'pastor', permission: 'canManageSubscription', expected: false },
    { role: 'worship_leader', permission: 'canManageSubscription', expected: false },
    { role: 'collaborator', permission: 'canManageSubscription', expected: false },
    { role: 'member', permission: 'canManageSubscription', expected: false },
  ];

  testCases.forEach(({ role, permission, expected }) => {
    it(`should ${expected ? 'allow' : 'deny'} ${role} to ${permission}`, async () => {
      const mockAuth = auth as any;
      const mockGetUserWorshipRole = getUserWorshipRole as any;

      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      mockGetUserWorshipRole.mockResolvedValue(role);

      const hasPermission = await checkUserPermission(permission as any);

      expect(hasPermission).toBe(expected);
    });
  });
});
