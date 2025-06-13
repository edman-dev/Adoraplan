import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks
const mockClerkClient = vi.hoisted(() => ({
  users: {
    updateUserMetadata: vi.fn(),
    getUser: vi.fn(),
  },
  organizations: {
    updateOrganizationMembership: vi.fn(),
  },
}));

const mockCreateWorshipRoleMetadata = vi.hoisted(() => vi.fn());
const mockGetWorshipRoleFromMetadata = vi.hoisted(() => vi.fn());
const mockMergeWorshipRoleMetadata = vi.hoisted(() => vi.fn());
const mockRevokeWorshipRole = vi.hoisted(() => vi.fn());

// Mock the createClerkClient function
vi.mock('@clerk/nextjs/server', () => ({
  createClerkClient: vi.fn(() => mockClerkClient()),
}));

// Mock the worship role utils
vi.mock('./worship-role-utils', () => ({
  createWorshipRoleMetadata: mockCreateWorshipRoleMetadata(),
  getWorshipRoleFromMetadata: mockGetWorshipRoleFromMetadata(),
  mergeWorshipRoleMetadata: mockMergeWorshipRoleMetadata(),
  revokeWorshipRole: mockRevokeWorshipRole(),
}));

import type { WorshipRole } from '@/features/worship/types';

import {
  assignWorshipRole,
  getUserWorshipRole,
  removeWorshipRole,
  updateWorshipRole,
} from './worship-role-management';

describe('worship-role-management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignWorshipRole', () => {
    it('should assign worship role to user successfully', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const role: WorshipRole = 'worship_leader';
      const assignedBy = 'admin123';
      const churchId = 789;

      const mockMetadata = {
        organizationId,
        role,
        assignedBy,
        assignedAt: expect.any(String),
        churchId,
      };

      mockCreateWorshipRoleMetadata().mockReturnValue(mockMetadata);
      mockClerkClient().users.updateUserMetadata.mockResolvedValue({});

      await assignWorshipRole(userId, organizationId, role, assignedBy, churchId);

      expect(mockCreateWorshipRoleMetadata()).toHaveBeenCalledWith(
        organizationId,
        role,
        assignedBy,
        churchId,
      );

      expect(mockClerkClient().users.updateUserMetadata).toHaveBeenCalledWith(userId, {
        publicMetadata: {
          worshipRole: mockMetadata,
        },
      });
    });

    it('should handle errors when assigning worship role', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const role: WorshipRole = 'pastor';
      const assignedBy = 'admin123';

      mockCreateWorshipRoleMetadata.mockReturnValue({});
      mockClerkClient.users.updateUserMetadata.mockRejectedValue(
        new Error('Clerk API error'),
      );

      await expect(
        assignWorshipRole(userId, organizationId, role, assignedBy),
      ).rejects.toThrow('Failed to assign worship role: Clerk API error');

      expect(mockCreateWorshipRoleMetadata).toHaveBeenCalledWith(
        organizationId,
        role,
        assignedBy,
        undefined,
      );
    });

    it('should assign role without churchId when not provided', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const role: WorshipRole = 'collaborator';
      const assignedBy = 'admin123';

      mockCreateWorshipRoleMetadata.mockReturnValue({});
      mockClerkClient.users.updateUserMetadata.mockResolvedValue({});

      await assignWorshipRole(userId, organizationId, role, assignedBy);

      expect(mockCreateWorshipRoleMetadata).toHaveBeenCalledWith(
        organizationId,
        role,
        assignedBy,
        undefined,
      );
    });
  });

  describe('getUserWorshipRole', () => {
    it('should get user worship role successfully', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const mockUser = {
        publicMetadata: {
          worshipRole: {
            organizationId: 'org456',
            role: 'worship_leader',
          },
        },
      };

      const expectedRole = 'worship_leader';

      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      mockGetWorshipRoleFromMetadata.mockReturnValue(expectedRole);

      const result = await getUserWorshipRole(userId, organizationId);

      expect(mockClerkClient.users.getUser).toHaveBeenCalledWith(userId);
      expect(mockGetWorshipRoleFromMetadata).toHaveBeenCalledWith(
        mockUser.publicMetadata,
        organizationId,
      );
      expect(result).toBe(expectedRole);
    });

    it('should return null when user not found', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      mockClerkClient.users.getUser.mockRejectedValue(new Error('User not found'));

      const result = await getUserWorshipRole(userId, organizationId);

      expect(result).toBeNull();
    });

    it('should return null when worship role not found in metadata', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const mockUser = {
        publicMetadata: {},
      };

      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      mockGetWorshipRoleFromMetadata.mockReturnValue(null);

      const result = await getUserWorshipRole(userId, organizationId);

      expect(result).toBeNull();
    });

    it('should handle Clerk API errors gracefully', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      mockClerkClient.users.getUser.mockRejectedValue(new Error('Network error'));

      const result = await getUserWorshipRole(userId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('updateWorshipRole', () => {
    it('should update worship role successfully', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const newRole: WorshipRole = 'pastor';
      const updatedBy = 'admin123';

      const mockUser = {
        publicMetadata: {
          worshipRole: {
            organizationId: 'org456',
            role: 'worship_leader',
          },
        },
      };

      const mockUpdatedMetadata = {
        organizationId,
        role: newRole,
        assignedBy: updatedBy,
        assignedAt: expect.any(String),
      };

      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      mockMergeWorshipRoleMetadata.mockReturnValue(mockUpdatedMetadata);
      mockClerkClient.users.updateUserMetadata.mockResolvedValue({});

      await updateWorshipRole(userId, organizationId, newRole, updatedBy);

      expect(mockClerkClient.users.getUser).toHaveBeenCalledWith(userId);
      expect(mockMergeWorshipRoleMetadata).toHaveBeenCalledWith(
        mockUser.publicMetadata,
        organizationId,
        {
          role: newRole,
          assignedBy: updatedBy,
          assignedAt: expect.any(String),
        },
      );
      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(userId, {
        publicMetadata: {
          worshipRole: mockUpdatedMetadata,
        },
      });
    });

    it('should handle errors when updating worship role', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const newRole: WorshipRole = 'admin';
      const updatedBy = 'superadmin123';

      mockClerkClient.users.getUser.mockRejectedValue(new Error('User not found'));

      await expect(
        updateWorshipRole(userId, organizationId, newRole, updatedBy),
      ).rejects.toThrow('Failed to update worship role: User not found');
    });

    it('should create new role metadata if user has no existing worship role', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const newRole: WorshipRole = 'collaborator';
      const updatedBy = 'admin123';

      const mockUser = {
        publicMetadata: {},
      };

      const mockNewMetadata = {
        organizationId,
        role: newRole,
        assignedBy: updatedBy,
        assignedAt: expect.any(String),
      };

      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      mockMergeWorshipRoleMetadata.mockReturnValue(mockNewMetadata);
      mockClerkClient.users.updateUserMetadata.mockResolvedValue({});

      await updateWorshipRole(userId, organizationId, newRole, updatedBy);

      expect(mockMergeWorshipRoleMetadata).toHaveBeenCalledWith(
        mockUser.publicMetadata,
        organizationId,
        {
          role: newRole,
          assignedBy: updatedBy,
          assignedAt: expect.any(String),
        },
      );
    });
  });

  describe('removeWorshipRole', () => {
    it('should remove worship role successfully', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const mockUser = {
        publicMetadata: {
          worshipRole: {
            organizationId: 'org456',
            role: 'worship_leader',
          },
        },
      };

      const mockUpdatedMetadata = {};

      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      mockRevokeWorshipRole.mockReturnValue(mockUpdatedMetadata);
      mockClerkClient.users.updateUserMetadata.mockResolvedValue({});

      await removeWorshipRole(userId, organizationId);

      expect(mockClerkClient.users.getUser).toHaveBeenCalledWith(userId);
      expect(mockRevokeWorshipRole).toHaveBeenCalledWith(
        mockUser.publicMetadata,
        organizationId,
      );
      expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(userId, {
        publicMetadata: mockUpdatedMetadata,
      });
    });

    it('should handle errors when removing worship role', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      mockClerkClient.users.getUser.mockRejectedValue(new Error('Permission denied'));

      await expect(
        removeWorshipRole(userId, organizationId),
      ).rejects.toThrow('Failed to remove worship role: Permission denied');
    });

    it('should handle case when user has no worship role to remove', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const mockUser = {
        publicMetadata: {},
      };

      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      mockRevokeWorshipRole.mockReturnValue({});
      mockClerkClient.users.updateUserMetadata.mockResolvedValue({});

      await removeWorshipRole(userId, organizationId);

      expect(mockRevokeWorshipRole).toHaveBeenCalledWith(
        mockUser.publicMetadata,
        organizationId,
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      mockClerkClient.users.getUser.mockRejectedValue(new Error('Network timeout'));

      const result = await getUserWorshipRole(userId, organizationId);
      expect(result).toBeNull();
    });

    it('should handle invalid user IDs', async () => {
      const userId = '';
      const organizationId = 'org456';

      mockClerkClient.users.getUser.mockRejectedValue(new Error('Invalid user ID'));

      const result = await getUserWorshipRole(userId, organizationId);
      expect(result).toBeNull();
    });

    it('should handle invalid organization IDs', async () => {
      const userId = 'user123';
      const organizationId = '';
      const role: WorshipRole = 'collaborator';
      const assignedBy = 'admin123';

      mockCreateWorshipRoleMetadata.mockReturnValue({});
      mockClerkClient.users.updateUserMetadata.mockRejectedValue(
        new Error('Invalid organization ID'),
      );

      await expect(
        assignWorshipRole(userId, organizationId, role, assignedBy),
      ).rejects.toThrow('Failed to assign worship role: Invalid organization ID');
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent role updates', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const role: WorshipRole = 'worship_leader';
      const assignedBy = 'admin123';

      mockCreateWorshipRoleMetadata.mockReturnValue({});
      mockClerkClient.users.updateUserMetadata
        .mockRejectedValueOnce(new Error('Resource conflict'))
        .mockResolvedValueOnce({});

      // Should retry on conflict
      await expect(
        assignWorshipRole(userId, organizationId, role, assignedBy),
      ).rejects.toThrow('Failed to assign worship role: Resource conflict');
    });

    it('should handle malformed metadata gracefully', async () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const mockUser = {
        publicMetadata: {
          worshipRole: 'invalid-format',
        },
      };

      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      mockGetWorshipRoleFromMetadata.mockReturnValue(null);

      const result = await getUserWorshipRole(userId, organizationId);
      expect(result).toBeNull();
    });
  });
});