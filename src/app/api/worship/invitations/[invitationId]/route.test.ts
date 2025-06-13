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
import { DELETE } from './route';
import * as userManagement from '@/lib/worship-user-management';

describe('Worship Invitations API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE /api/worship/invitations/[invitationId]', () => {
    it('should revoke invitation successfully', async () => {
      const invitationId = 'inv_456';

      vi.mocked(userManagement.revokePendingInvitation).mockResolvedValue({
        success: true,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/worship/invitations/${invitationId}?organizationId=org_123`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { invitationId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ 
        success: true,
        message: 'Invitation revoked successfully',
      });
      expect(userManagement.revokePendingInvitation).toHaveBeenCalledWith(
        'org_123',
        invitationId
      );
    });

    it('should require organization ID', async () => {
      const invitationId = 'inv_456';

      const request = new NextRequest(
        `http://localhost:3000/api/worship/invitations/${invitationId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { invitationId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Organization ID is required' });
      expect(userManagement.revokePendingInvitation).not.toHaveBeenCalled();
    });

    it('should handle non-existent invitation gracefully', async () => {
      const invitationId = 'inv_nonexistent';

      vi.mocked(userManagement.revokePendingInvitation).mockResolvedValue({
        success: false,
        error: 'Invitation not found',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/worship/invitations/${invitationId}?organizationId=org_123`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { invitationId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invitation not found' });
    });

    it('should handle database errors', async () => {
      // Mock console.error to prevent test failure due to console output
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const invitationId = 'inv_456';

      vi.mocked(userManagement.revokePendingInvitation).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/worship/invitations/${invitationId}?organizationId=org_123`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { invitationId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to revoke invitation' });
    });
  });
});