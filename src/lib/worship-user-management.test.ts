import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assignWorshipRole,
  getUserWorshipRole,
  revokeWorshipRole,
} from '@/lib/worship-role-management';

import {
  canAssignRole,
  canManageUsers,
  getOrganizationMembers,
  inviteUserToOrganization,
  processAcceptedInvitation,
  removeUserFromOrganization,
  revokePendingInvitation,
  updateUserWorshipRole,
} from './worship-user-management';

// Mock Clerk
const mockClerkClient = {
  organizations: {
    getOrganizationMembershipList: vi.fn(),
    getOrganizationInvitationList: vi.fn(),
    createOrganizationInvitation: vi.fn(),
    deleteOrganizationMembership: vi.fn(),
    revokeOrganizationInvitation: vi.fn(),
  },
  invitations: {
    updateInvitation: vi.fn(),
  },
  users: {
    getUser: vi.fn(),
  },
};

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(() => Promise.resolve(mockClerkClient)),
}));

// Mock worship role management
vi.mock('@/lib/worship-role-management', () => ({
  getUserWorshipRole: vi.fn(),
  assignWorshipRole: vi.fn(),
  revokeWorshipRole: vi.fn(),
}));

describe('Worship User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrganizationMembers', () => {
    it('should get organization members with worship roles', async () => {
      const mockMemberships = {
        data: [
          {
            id: 'membership_1',
            publicUserData: {
              userId: 'user_1',
              firstName: 'John',
              lastName: 'Doe',
              identifier: 'john@example.com',
              imageUrl: 'https://example.com/avatar.jpg',
            },
            role: 'admin',
            createdAt: 1234567890000,
          },
        ],
      };

      const mockInvitations = {
        data: [
          {
            id: 'invitation_1',
            emailAddress: 'jane@example.com',
            role: 'basic_member',
            createdAt: 1234567890000,
          },
        ],
      };

      mockClerkClient.organizations.getOrganizationMembershipList.mockResolvedValue(mockMemberships);
      mockClerkClient.organizations.getOrganizationInvitationList.mockResolvedValue(mockInvitations);
      (getUserWorshipRole as any).mockResolvedValue('admin');

      const members = await getOrganizationMembers('org_123');

      expect(members).toHaveLength(2);
      expect(members[0]).toMatchObject({
        id: 'membership_1',
        userId: 'user_1',
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
        worshipRole: 'admin',
        status: 'active',
      });
      expect(members[1]).toMatchObject({
        id: 'invitation_1',
        emailAddress: 'jane@example.com',
        worshipRole: 'member',
        status: 'invited',
      });
    });

    it('should handle errors when getting members', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockClerkClient.organizations.getOrganizationMembershipList.mockRejectedValue(
        new Error('Clerk error'),
      );

      await expect(getOrganizationMembers('org_123')).rejects.toThrow(
        'Failed to retrieve organization members',
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get organization members:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('inviteUserToOrganization', () => {
    it('should create organization invitation with worship role metadata', async () => {
      const mockInvitation = {
        id: 'invitation_123',
        emailAddress: 'user@example.com',
      };

      mockClerkClient.organizations.createOrganizationInvitation.mockResolvedValue(mockInvitation);
      mockClerkClient.invitations.updateInvitation.mockResolvedValue({});

      const result = await inviteUserToOrganization(
        'org_123',
        {
          emailAddress: 'user@example.com',
          worshipRole: 'worship_leader',
          redirectUrl: 'https://app.com/dashboard',
        },
        'inviter_123',
      );

      expect(result.success).toBe(true);
      expect(result.invitationId).toBe('invitation_123');
      expect(mockClerkClient.organizations.createOrganizationInvitation).toHaveBeenCalledWith({
        organizationId: 'org_123',
        emailAddress: 'user@example.com',
        role: 'basic_member',
        redirectUrl: 'https://app.com/dashboard',
      });
      expect(mockClerkClient.invitations.updateInvitation).toHaveBeenCalledWith('invitation_123', {
        publicMetadata: {
          intendedWorshipRole: 'worship_leader',
          invitedBy: 'inviter_123',
          organizationId: 'org_123',
        },
      });
    });

    it('should handle invitation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockClerkClient.organizations.createOrganizationInvitation.mockRejectedValue(
        new Error('Clerk error'),
      );

      const result = await inviteUserToOrganization(
        'org_123',
        {
          emailAddress: 'user@example.com',
          worshipRole: 'member',
        },
        'inviter_123',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clerk error');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to invite user to organization:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('updateUserWorshipRole', () => {
    it('should update user worship role', async () => {
      (assignWorshipRole as any).mockResolvedValue(undefined);

      const result = await updateUserWorshipRole('org_123', {
        userId: 'user_123',
        newWorshipRole: 'pastor',
        assignedBy: 'admin_123',
      });

      expect(result.success).toBe(true);
      expect(assignWorshipRole).toHaveBeenCalledWith(
        'user_123',
        'org_123',
        'pastor',
        'admin_123',
      );
    });

    it('should handle role update errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (assignWorshipRole as any).mockRejectedValue(new Error('Role assignment failed'));

      const result = await updateUserWorshipRole('org_123', {
        userId: 'user_123',
        newWorshipRole: 'pastor',
        assignedBy: 'admin_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role assignment failed');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update user worship role:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('removeUserFromOrganization', () => {
    it('should remove user from organization and revoke worship role', async () => {
      mockClerkClient.organizations.deleteOrganizationMembership.mockResolvedValue({});
      (revokeWorshipRole as any).mockResolvedValue(undefined);

      const result = await removeUserFromOrganization('org_123', 'user_123');

      expect(result.success).toBe(true);
      expect(mockClerkClient.organizations.deleteOrganizationMembership).toHaveBeenCalledWith({
        organizationId: 'org_123',
        userId: 'user_123',
      });
      expect(revokeWorshipRole).toHaveBeenCalledWith('user_123', 'org_123');
    });

    it('should handle removal errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockClerkClient.organizations.deleteOrganizationMembership.mockRejectedValue(
        new Error('Clerk error'),
      );

      const result = await removeUserFromOrganization('org_123', 'user_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clerk error');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to remove user from organization:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('revokePendingInvitation', () => {
    it('should revoke organization invitation', async () => {
      mockClerkClient.organizations.revokeOrganizationInvitation.mockResolvedValue({});

      const result = await revokePendingInvitation('org_123', 'invitation_123');

      expect(result.success).toBe(true);
      expect(mockClerkClient.organizations.revokeOrganizationInvitation).toHaveBeenCalledWith({
        organizationId: 'org_123',
        invitationId: 'invitation_123',
      });
    });

    it('should handle revocation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockClerkClient.organizations.revokeOrganizationInvitation.mockRejectedValue(
        new Error('Clerk error'),
      );

      const result = await revokePendingInvitation('org_123', 'invitation_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clerk error');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to revoke invitation:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processAcceptedInvitation', () => {
    it('should assign worship role when invitation is accepted', async () => {
      const mockInvitations = {
        data: [
          {
            id: 'invitation_123',
            emailAddress: 'user@example.com',
            publicMetadata: {
              intendedWorshipRole: 'worship_leader',
              invitedBy: 'admin_123',
            },
          },
        ],
      };

      const mockUser = {
        emailAddresses: [
          {
            id: 'email_123',
            emailAddress: 'user@example.com',
          },
        ],
        primaryEmailAddressId: 'email_123',
      };

      mockClerkClient.organizations.getOrganizationInvitationList.mockResolvedValue(mockInvitations);
      mockClerkClient.users.getUser.mockResolvedValue(mockUser);
      (assignWorshipRole as any).mockResolvedValue(undefined);

      await processAcceptedInvitation('user_123', 'org_123');

      expect(assignWorshipRole).toHaveBeenCalledWith(
        'user_123',
        'org_123',
        'worship_leader',
        'admin_123',
      );
    });

    it('should handle missing invitation metadata gracefully', async () => {
      const mockInvitations = { data: [] };
      const mockUser = {
        emailAddresses: [
          {
            id: 'email_123',
            emailAddress: 'user@example.com',
          },
        ],
        primaryEmailAddressId: 'email_123',
      };

      mockClerkClient.organizations.getOrganizationInvitationList.mockResolvedValue(mockInvitations);
      mockClerkClient.users.getUser.mockResolvedValue(mockUser);

      // Should not throw error
      await expect(processAcceptedInvitation('user_123', 'org_123')).resolves.toBeUndefined();
      expect(assignWorshipRole).not.toHaveBeenCalled();
    });
  });

  describe('canManageUsers', () => {
    it('should return true for admin and pastor roles', async () => {
      (getUserWorshipRole as any).mockResolvedValue('admin');

      const canManage = await canManageUsers('user_123', 'org_123');

      expect(canManage).toBe(true);

      (getUserWorshipRole as any).mockResolvedValue('pastor');

      const canManagePastor = await canManageUsers('user_123', 'org_123');

      expect(canManagePastor).toBe(true);
    });

    it('should return false for other roles', async () => {
      (getUserWorshipRole as any).mockResolvedValue('worship_leader');

      const canManage = await canManageUsers('user_123', 'org_123');

      expect(canManage).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (getUserWorshipRole as any).mockRejectedValue(new Error('Role check failed'));

      const canManage = await canManageUsers('user_123', 'org_123');

      expect(canManage).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to check user management permissions:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('canAssignRole', () => {
    it('should allow role assignment based on hierarchy', async () => {
      (getUserWorshipRole as any).mockResolvedValue('admin');

      // Admin can assign any role
      expect(await canAssignRole('admin_123', 'org_123', 'pastor')).toBe(true);
      expect(await canAssignRole('admin_123', 'org_123', 'admin')).toBe(true);

      (getUserWorshipRole as any).mockResolvedValue('pastor');

      // Pastor can assign pastor and below
      expect(await canAssignRole('pastor_123', 'org_123', 'worship_leader')).toBe(true);
      expect(await canAssignRole('pastor_123', 'org_123', 'admin')).toBe(false);

      (getUserWorshipRole as any).mockResolvedValue('worship_leader');

      // Worship leader can assign worship_leader and below
      expect(await canAssignRole('leader_123', 'org_123', 'collaborator')).toBe(true);
      expect(await canAssignRole('leader_123', 'org_123', 'pastor')).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (getUserWorshipRole as any).mockRejectedValue(new Error('Role check failed'));

      const canAssign = await canAssignRole('user_123', 'org_123', 'member');

      expect(canAssign).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to check role assignment permissions:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
