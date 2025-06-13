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

// Mock worship user management
vi.mock('@/lib/worship-user-management');

// Mock middleware by replacing it with a simple pass-through
vi.mock('@/middleware/worship-auth', () => ({
  withWorshipAuth: (handler: any) => handler,
}));

// Now import the route handlers
import { GET, POST } from './route';
import * as userManagement from '@/lib/worship-user-management';

describe('Worship Users API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/worship/users', () => {
    it('should return organization members successfully', async () => {
      const mockMembers = {
        members: [
          {
            id: 'user_1',
            email: 'user1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            imageUrl: 'https://example.com/avatar1.jpg',
            worshipRole: 'worship_leader',
          },
          {
            id: 'user_2',
            email: 'user2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            imageUrl: 'https://example.com/avatar2.jpg',
            worshipRole: 'collaborator',
          },
        ],
        invitations: [],
      };

      vi.mocked(userManagement.getOrganizationMembers).mockResolvedValue(mockMembers);

      const request = new NextRequest('http://localhost:3000/api/worship/users?organizationId=org_123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockMembers,
      });
      expect(userManagement.getOrganizationMembers).toHaveBeenCalledWith('org_123');
    });

    it('should require organization ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/worship/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Organization ID is required' });
    });

    it('should handle errors gracefully', async () => {
      // Mock console.error to prevent test failure due to console output
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(userManagement.getOrganizationMembers).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/worship/users?organizationId=org_123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to retrieve organization members' });
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get organization members:',
        expect.any(Error)
      );
    });
  });

  describe('POST /api/worship/users', () => {
    it('should invite a new user successfully', async () => {
      const inviteData = {
        organizationId: 'org_123',
        emailAddress: 'newuser@example.com',
        worshipRole: 'collaborator',
        invitedBy: 'user_123',
      };

      vi.mocked(userManagement.inviteUserToOrganization).mockResolvedValue({
        success: true,
        invitationId: 'inv_123',
      });

      const request = new NextRequest('http://localhost:3000/api/worship/users', {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          invitationId: 'inv_123',
          message: 'Invitation sent successfully',
        },
      });
      expect(userManagement.inviteUserToOrganization).toHaveBeenCalledWith(
        'org_123',
        {
          emailAddress: 'newuser@example.com',
          worshipRole: 'collaborator',
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
        'user_123'
      );
    });

    it('should require all fields', async () => {
      const inviteData = {
        organizationId: 'org_123',
        emailAddress: 'newuser@example.com',
        // Missing worshipRole and invitedBy
      };

      const request = new NextRequest('http://localhost:3000/api/worship/users', {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ 
        error: 'Missing required fields: organizationId, emailAddress, worshipRole, invitedBy' 
      });
    });

    it('should validate email format', async () => {
      const inviteData = {
        organizationId: 'org_123',
        emailAddress: 'invalid-email',
        worshipRole: 'collaborator',
        invitedBy: 'user_123',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/users', {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid email address format' });
    });

    it('should validate worship role', async () => {
      const inviteData = {
        organizationId: 'org_123',
        emailAddress: 'user@example.com',
        worshipRole: 'invalid-role',
        invitedBy: 'user_123',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/users', {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid worship role' });
    });

    it('should handle invitation errors', async () => {
      const inviteData = {
        organizationId: 'org_123',
        emailAddress: 'newuser@example.com',
        worshipRole: 'collaborator',
        invitedBy: 'user_123',
      };

      vi.mocked(userManagement.inviteUserToOrganization).mockResolvedValue({
        success: false,
        error: 'User already exists in organization',
      });

      const request = new NextRequest('http://localhost:3000/api/worship/users', {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'User already exists in organization' });
    });
  });
});