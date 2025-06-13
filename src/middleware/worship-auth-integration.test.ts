import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';

import {
  createWorshipAuthMiddleware,
  withWorshipAuth,
  worshipAuthMiddleware,
} from './worship-auth';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/worship-role-management', () => ({
  getUserWorshipRole: vi.fn(),
}));

// Import mocked functions
import { auth } from '@clerk/nextjs/server';
import { getUserWorshipRole } from '@/lib/worship-role-management';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockGetUserWorshipRole = getUserWorshipRole as ReturnType<typeof vi.fn>;

describe('Worship Auth Middleware Integration Tests', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = new NextRequest('http://localhost:3000/api/test');
  });

  describe('createWorshipAuthMiddleware - Advanced Scenarios', () => {
    it('should handle complex permission combinations', async () => {
      const middleware = createWorshipAuthMiddleware({
        permissions: ['canCreateProgram', 'canManageChurch'],
        requireAll: true,
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('admin');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 200);
    });

    it('should handle permission combinations with OR logic', async () => {
      const middleware = createWorshipAuthMiddleware({
        permissions: ['canCreateProgram', 'canManageChurch'],
        requireAll: false,
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('worship_leader');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 200);
    });

    it('should reject when all permissions required but user lacks some', async () => {
      const middleware = createWorshipAuthMiddleware({
        permissions: ['canCreateChurch', 'canManageChurch'],
        requireAll: true,
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('worship_leader');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 403);
    });

    it('should handle minimum role requirements correctly', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'pastor',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('admin');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 200);
    });

    it('should reject users below minimum role requirement', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'pastor',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('collaborator');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 403);
    });

    it('should handle custom redirect URLs', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'admin',
        unauthorizedRedirect: '/custom-error',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('member');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 302);
      expect(result.headers.get('location')).toBe('/custom-error');
    });

    it('should handle public routes correctly', async () => {
      const middleware = createWorshipAuthMiddleware({
        publicRoutes: ['/api/test'],
      });

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 200);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should handle exact role matching', async () => {
      const middleware = createWorshipAuthMiddleware({
        exactRole: 'worship_leader',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('worship_leader');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 200);
    });

    it('should reject non-exact role matches', async () => {
      const middleware = createWorshipAuthMiddleware({
        exactRole: 'worship_leader',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('admin');

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 403);
    });
  });

  describe('withWorshipAuth - API Route Protection', () => {
    it('should protect API routes with permission requirements', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true }),
      );

      const protectedHandler = withWorshipAuth(mockHandler, {
        permission: 'canCreateProgram',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('worship_leader');

      const result = await protectedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(NextResponse.json({ success: true }));
    });

    it('should reject API requests without required permission', async () => {
      const mockHandler = vi.fn();

      const protectedHandler = withWorshipAuth(mockHandler, {
        permission: 'canCreateChurch',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('member');

      const result = await protectedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 403);
    });

    it('should protect API routes with role requirements', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'sensitive' }),
      );

      const protectedHandler = withWorshipAuth(mockHandler, {
        minimumRole: 'pastor',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('admin');

      const result = await protectedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalled();
      expect(result).toEqual(NextResponse.json({ data: 'sensitive' }));
    });

    it('should handle API authentication failures', async () => {
      const mockHandler = vi.fn();

      const protectedHandler = withWorshipAuth(mockHandler, {
        permission: 'canCreateProgram',
      });

      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const result = await protectedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 401);
    });

    it('should handle organization membership failures', async () => {
      const mockHandler = vi.fn();

      const protectedHandler = withWorshipAuth(mockHandler, {
        permission: 'canCreateProgram',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: null,
      });

      const result = await protectedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 403);
    });
  });

  describe('Role Hierarchy Integration', () => {
    const testRoleHierarchy = [
      { role: 'admin', level: 100 },
      { role: 'pastor', level: 80 },
      { role: 'worship_leader', level: 60 },
      { role: 'collaborator', level: 40 },
      { role: 'member', level: 20 },
    ] as const;

    testRoleHierarchy.forEach(({ role, level }) => {
      testRoleHierarchy.forEach(({ role: requiredRole, level: requiredLevel }) => {
        it(`should ${level >= requiredLevel ? 'allow' : 'deny'} ${role} access to ${requiredRole} endpoints`, async () => {
          const middleware = createWorshipAuthMiddleware({
            minimumRole: requiredRole as ExtendedWorshipRole,
          });

          mockAuth.mockResolvedValue({
            userId: 'user123',
            orgId: 'org456',
          });

          mockGetUserWorshipRole.mockResolvedValue(role as ExtendedWorshipRole);

          const result = await middleware(mockRequest);

          if (level >= requiredLevel) {
            expect(result).toHaveProperty('status', 200);
          } else {
            expect(result).toHaveProperty('status', 403);
          }
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Clerk authentication service errors', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'member',
      });

      mockAuth.mockRejectedValue(new Error('Clerk service unavailable'));

      const result = await middleware(mockRequest);

      expect(result).toHaveProperty('status', 500);
    });

    it('should handle worship role retrieval errors', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'member',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockRejectedValue(new Error('Database error'));

      const result = await middleware(mockRequest);

      // Should default to member role and allow access
      expect(result).toHaveProperty('status', 200);
    });

    it('should handle invalid role data gracefully', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'worship_leader',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue(null);

      const result = await middleware(mockRequest);

      // Should default to member role and deny access
      expect(result).toHaveProperty('status', 403);
    });

    it('should handle malformed request objects', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'member',
      });

      const malformedRequest = {} as NextRequest;

      const result = await middleware(malformedRequest);

      expect(result).toHaveProperty('status', 400);
    });

    it('should handle undefined configuration gracefully', async () => {
      const middleware = createWorshipAuthMiddleware();

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('member');

      const result = await middleware(mockRequest);

      // Should allow access with default configuration
      expect(result).toHaveProperty('status', 200);
    });
  });

  describe('Performance and Caching', () => {
    it('should handle rapid sequential requests efficiently', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'member',
      });

      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('worship_leader');

      const requests = Array(5).fill(null).map(() => middleware(mockRequest));
      const results = await Promise.all(requests);

      results.forEach(result => {
        expect(result).toHaveProperty('status', 200);
      });

      // Should have called auth for each request
      expect(mockAuth).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent requests from different users', async () => {
      const middleware = createWorshipAuthMiddleware({
        minimumRole: 'collaborator',
      });

      const userConfigs = [
        { userId: 'user1', orgId: 'org1', role: 'admin' },
        { userId: 'user2', orgId: 'org2', role: 'pastor' },
        { userId: 'user3', orgId: 'org3', role: 'worship_leader' },
        { userId: 'user4', orgId: 'org4', role: 'member' },
      ];

      const requests = userConfigs.map(async (config, index) => {
        mockAuth.mockResolvedValueOnce({
          userId: config.userId,
          orgId: config.orgId,
        });

        mockGetUserWorshipRole.mockResolvedValueOnce(config.role as ExtendedWorshipRole);

        return middleware(mockRequest);
      });

      const results = await Promise.all(requests);

      // First three should succeed (admin, pastor, worship_leader >= collaborator)
      expect(results[0]).toHaveProperty('status', 200);
      expect(results[1]).toHaveProperty('status', 200);
      expect(results[2]).toHaveProperty('status', 200);
      // Last should fail (member < collaborator)
      expect(results[3]).toHaveProperty('status', 403);
    });
  });

  describe('Default Worship Auth Middleware', () => {
    it('should use default configuration for basic protection', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: 'org456',
      });

      mockGetUserWorshipRole.mockResolvedValue('member');

      const result = await worshipAuthMiddleware(mockRequest);

      expect(result).toHaveProperty('status', 200);
    });

    it('should redirect unauthenticated users to sign-in', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const result = await worshipAuthMiddleware(mockRequest);

      expect(result).toHaveProperty('status', 302);
      expect(result.headers.get('location')).toContain('/sign-in');
    });

    it('should redirect users without organization to dashboard', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user123',
        orgId: null,
      });

      const result = await worshipAuthMiddleware(mockRequest);

      expect(result).toHaveProperty('status', 302);
      expect(result.headers.get('location')).toContain('/dashboard');
    });
  });
});