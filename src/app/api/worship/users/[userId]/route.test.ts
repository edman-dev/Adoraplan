import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the Clerk client before any imports that use it
vi.mock('@clerk/nextjs/server', () => {
  const mockClerkClient = {
    users: {
      getUser: vi.fn(),
    },
    organizations: {
      getOrganizationMembershipList: vi.fn(),
    },
  };
  return {
    auth: vi.fn(),
    clerkClient: vi.fn(() => Promise.resolve(mockClerkClient)),
    createClerkClient: vi.fn(() => mockClerkClient),
  };
});

// Mock dependencies
vi.mock('@/lib/worship-user-management');

// Mock middleware by replacing it with a simple pass-through
vi.mock('@/middleware/worship-auth', () => ({
  withWorshipAuth: (handler: any) => handler,
}));

// Now import the route handlers
import { PATCH, DELETE } from './route';
import * as userManagement from '@/lib/worship-user-management';

describe('Worship User API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/worship/users/[userId]', () => {
    it('should update user role successfully', async () => {
      const targetUserId = 'user_456';
      const updateData = {
        organizationId: 'org_123',
        newWorshipRole: 'worship_leader',
        assignedBy: 'user_123',
      };

      vi.mocked(userManagement.canAssignRole).mockResolvedValue(true);
      vi.mocked(userManagement.updateUserWorshipRole).mockResolvedValue({
        success: true,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/worship/users/${targetUserId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, { params: { userId: targetUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'User role updated successfully',
      });
      expect(userManagement.canAssignRole).toHaveBeenCalledWith(
        'user_123',
        'org_123',
        'worship_leader'
      );
      expect(userManagement.updateUserWorshipRole).toHaveBeenCalledWith(
        'org_123',
        {
          userId: targetUserId,
          newWorshipRole: 'worship_leader',
          assignedBy: 'user_123',
        }
      );
    });

    it('should reject if user lacks permission to assign role', async () => {
      const targetUserId = 'user_456';
      const updateData = {
        organizationId: 'org_123',
        newWorshipRole: 'admin',
        assignedBy: 'user_123',
      };

      vi.mocked(userManagement.canAssignRole).mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost:3000/api/worship/users/${targetUserId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, { params: { userId: targetUserId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'You do not have permission to assign this role' });
      expect(userManagement.updateUserWorshipRole).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const targetUserId = 'user_456';
      const updateData = {
        organizationId: 'org_123',
        // Missing newWorshipRole and assignedBy
      };

      const request = new NextRequest(
        `http://localhost:3000/api/worship/users/${targetUserId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, { params: { userId: targetUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ 
        error: 'Missing required fields: organizationId, newWorshipRole, assignedBy' 
      });
    });

    it('should validate worship role', async () => {
      const targetUserId = 'user_456';
      const updateData = {
        organizationId: 'org_123',
        newWorshipRole: 'invalid-role',
        assignedBy: 'user_123',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/worship/users/${targetUserId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, { params: { userId: targetUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid worship role' });
    });
  });

  describe('DELETE /api/worship/users/[userId]', () => {
    it('should remove user from organization successfully', async () => {
      const targetUserId = 'user_456';

      vi.mocked(userManagement.removeUserFromOrganization).mockResolvedValue({
        success: true,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/worship/users/${targetUserId}?organizationId=org_123`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { userId: targetUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ 
        success: true,
        message: 'User removed from organization successfully',
      });
      expect(userManagement.removeUserFromOrganization).toHaveBeenCalledWith(
        'org_123',
        targetUserId
      );
    });

    it('should require organization ID', async () => {
      const targetUserId = 'user_456';

      const request = new NextRequest(
        `http://localhost:3000/api/worship/users/${targetUserId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { userId: targetUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Organization ID is required' });
      expect(userManagement.removeUserFromOrganization).not.toHaveBeenCalled();
    });

    it('should handle removal errors', async () => {
      const targetUserId = 'user_456';

      vi.mocked(userManagement.removeUserFromOrganization).mockResolvedValue({
        success: false,
        error: 'User not found in organization',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/worship/users/${targetUserId}?organizationId=org_123`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { userId: targetUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'User not found in organization' });
    });
  });
});