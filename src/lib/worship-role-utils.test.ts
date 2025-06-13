import { describe, expect, it } from 'vitest';

import type { WorshipRole } from '@/features/worship/types';

import type { WorshipUserMetadata } from './worship-role-utils';
import {
  createWorshipRoleMetadata,
  getAvailableWorshipRoles,
  getEffectiveWorshipRole,
  getWorshipRoleFromMetadata,
  hasWorshipPermission,
  mergeWorshipRoleMetadata,
  revokeWorshipRole,
  WorshipRoleDisplayNames,
  WorshipRoleHierarchy,
  WorshipRolePermissions,
} from './worship-role-utils';

describe('Worship Role Utilities', () => {
  describe('WorshipRoleDisplayNames', () => {
    it('should have display names for all worship roles', () => {
      expect(WorshipRoleDisplayNames.admin).toBe('Admin');
      expect(WorshipRoleDisplayNames.worship_leader).toBe('Worship Leader');
      expect(WorshipRoleDisplayNames.pastor).toBe('Pastor');
      expect(WorshipRoleDisplayNames.collaborator).toBe('Collaborator');
      expect(WorshipRoleDisplayNames.member).toBe('Member');
    });
  });

  describe('WorshipRoleHierarchy', () => {
    it('should have correct hierarchy levels', () => {
      expect(WorshipRoleHierarchy.admin).toBe(100);
      expect(WorshipRoleHierarchy.pastor).toBe(80);
      expect(WorshipRoleHierarchy.worship_leader).toBe(60);
      expect(WorshipRoleHierarchy.collaborator).toBe(40);
      expect(WorshipRoleHierarchy.member).toBe(20);
    });

    it('should maintain proper role ordering', () => {
      expect(WorshipRoleHierarchy.admin).toBeGreaterThan(WorshipRoleHierarchy.pastor);
      expect(WorshipRoleHierarchy.pastor).toBeGreaterThan(WorshipRoleHierarchy.worship_leader);
      expect(WorshipRoleHierarchy.worship_leader).toBeGreaterThan(WorshipRoleHierarchy.collaborator);
      expect(WorshipRoleHierarchy.collaborator).toBeGreaterThan(WorshipRoleHierarchy.member);
    });
  });

  describe('WorshipRolePermissions', () => {
    describe('Church management permissions', () => {
      it('should allow admins and pastors to create churches', () => {
        expect(WorshipRolePermissions.canCreateChurch('admin')).toBe(true);
        expect(WorshipRolePermissions.canCreateChurch('pastor')).toBe(true);
        expect(WorshipRolePermissions.canCreateChurch('worship_leader')).toBe(false);
        expect(WorshipRolePermissions.canCreateChurch('collaborator')).toBe(false);
        expect(WorshipRolePermissions.canCreateChurch('member')).toBe(false);
      });

      it('should only allow admins to delete churches', () => {
        expect(WorshipRolePermissions.canDeleteChurch('admin')).toBe(true);
        expect(WorshipRolePermissions.canDeleteChurch('pastor')).toBe(false);
        expect(WorshipRolePermissions.canDeleteChurch('worship_leader')).toBe(false);
        expect(WorshipRolePermissions.canDeleteChurch('collaborator')).toBe(false);
        expect(WorshipRolePermissions.canDeleteChurch('member')).toBe(false);
      });
    });

    describe('Ministry management permissions', () => {
      it('should allow appropriate roles to create ministries', () => {
        expect(WorshipRolePermissions.canCreateMinistry('admin')).toBe(true);
        expect(WorshipRolePermissions.canCreateMinistry('pastor')).toBe(true);
        expect(WorshipRolePermissions.canCreateMinistry('worship_leader')).toBe(true);
        expect(WorshipRolePermissions.canCreateMinistry('collaborator')).toBe(false);
        expect(WorshipRolePermissions.canCreateMinistry('member')).toBe(false);
      });
    });

    describe('Hymn management permissions', () => {
      it('should allow all active roles to create hymns', () => {
        expect(WorshipRolePermissions.canCreateHymn('admin')).toBe(true);
        expect(WorshipRolePermissions.canCreateHymn('pastor')).toBe(true);
        expect(WorshipRolePermissions.canCreateHymn('worship_leader')).toBe(true);
        expect(WorshipRolePermissions.canCreateHymn('collaborator')).toBe(true);
        expect(WorshipRolePermissions.canCreateHymn('member')).toBe(false);
      });

      it('should restrict hymn approval to leadership roles', () => {
        expect(WorshipRolePermissions.canApproveHymn('admin')).toBe(true);
        expect(WorshipRolePermissions.canApproveHymn('pastor')).toBe(true);
        expect(WorshipRolePermissions.canApproveHymn('worship_leader')).toBe(true);
        expect(WorshipRolePermissions.canApproveHymn('collaborator')).toBe(false);
        expect(WorshipRolePermissions.canApproveHymn('member')).toBe(false);
      });
    });

    describe('User management permissions', () => {
      it('should restrict user invitation to leadership roles', () => {
        expect(WorshipRolePermissions.canInviteUsers('admin')).toBe(true);
        expect(WorshipRolePermissions.canInviteUsers('pastor')).toBe(true);
        expect(WorshipRolePermissions.canInviteUsers('worship_leader')).toBe(true);
        expect(WorshipRolePermissions.canInviteUsers('collaborator')).toBe(false);
        expect(WorshipRolePermissions.canInviteUsers('member')).toBe(false);
      });

      it('should restrict role assignment to admins and pastors', () => {
        expect(WorshipRolePermissions.canAssignRoles('admin')).toBe(true);
        expect(WorshipRolePermissions.canAssignRoles('pastor')).toBe(true);
        expect(WorshipRolePermissions.canAssignRoles('worship_leader')).toBe(false);
        expect(WorshipRolePermissions.canAssignRoles('collaborator')).toBe(false);
        expect(WorshipRolePermissions.canAssignRoles('member')).toBe(false);
      });
    });

    describe('Subscription management permissions', () => {
      it('should only allow admins to manage subscriptions', () => {
        expect(WorshipRolePermissions.canManageSubscription('admin')).toBe(true);
        expect(WorshipRolePermissions.canManageSubscription('pastor')).toBe(false);
        expect(WorshipRolePermissions.canManageSubscription('worship_leader')).toBe(false);
        expect(WorshipRolePermissions.canManageSubscription('collaborator')).toBe(false);
        expect(WorshipRolePermissions.canManageSubscription('member')).toBe(false);
      });
    });
  });

  describe('getWorshipRoleFromMetadata', () => {
    const organizationId = 'org_123';

    it('should return default role when no metadata exists', () => {
      expect(getWorshipRoleFromMetadata(undefined, organizationId)).toBe('member');
    });

    it('should return default role when no worship roles exist', () => {
      const metadata: WorshipUserMetadata = {
        defaultRole: 'collaborator',
      };

      expect(getWorshipRoleFromMetadata(metadata, organizationId)).toBe('collaborator');
    });

    it('should return member when role is inactive', () => {
      const metadata: WorshipUserMetadata = {
        worshipRoles: {
          [organizationId]: {
            role: 'worship_leader',
            assignedBy: 'user_admin',
            assignedAt: '2024-01-01T00:00:00Z',
            isActive: false,
          },
        },
      };

      expect(getWorshipRoleFromMetadata(metadata, organizationId)).toBe('member');
    });

    it('should return active worship role', () => {
      const metadata: WorshipUserMetadata = {
        worshipRoles: {
          [organizationId]: {
            role: 'worship_leader',
            assignedBy: 'user_admin',
            assignedAt: '2024-01-01T00:00:00Z',
            isActive: true,
          },
        },
      };

      expect(getWorshipRoleFromMetadata(metadata, organizationId)).toBe('worship_leader');
    });
  });

  describe('hasWorshipPermission', () => {
    it('should grant permission when user role is sufficient', () => {
      expect(hasWorshipPermission('admin', 'pastor')).toBe(true);
      expect(hasWorshipPermission('pastor', 'worship_leader')).toBe(true);
      expect(hasWorshipPermission('worship_leader', 'collaborator')).toBe(true);
    });

    it('should deny permission when user role is insufficient', () => {
      expect(hasWorshipPermission('collaborator', 'worship_leader')).toBe(false);
      expect(hasWorshipPermission('member', 'collaborator')).toBe(false);
      expect(hasWorshipPermission('pastor', 'admin')).toBe(false);
    });

    it('should grant permission for equal roles', () => {
      expect(hasWorshipPermission('admin', 'admin')).toBe(true);
      expect(hasWorshipPermission('pastor', 'pastor')).toBe(true);
      expect(hasWorshipPermission('worship_leader', 'worship_leader')).toBe(true);
    });
  });

  describe('getAvailableWorshipRoles', () => {
    it('should return all roles for admin', () => {
      const roles = getAvailableWorshipRoles('admin');

      expect(roles).toContain('admin');
      expect(roles).toContain('pastor');
      expect(roles).toContain('worship_leader');
      expect(roles).toContain('collaborator');
      expect(roles).not.toContain('member' as WorshipRole);
    });

    it('should return limited roles for pastor', () => {
      const roles = getAvailableWorshipRoles('pastor');

      expect(roles).not.toContain('admin');
      expect(roles).toContain('pastor');
      expect(roles).toContain('worship_leader');
      expect(roles).toContain('collaborator');
    });

    it('should return no roles for member', () => {
      const roles = getAvailableWorshipRoles('member');

      expect(roles).toHaveLength(0);
    });
  });

  describe('createWorshipRoleMetadata', () => {
    it('should create proper metadata structure', () => {
      const organizationId = 'org_123';
      const role: WorshipRole = 'worship_leader';
      const assignedBy = 'user_admin';
      const churchId = 456;

      const metadata = createWorshipRoleMetadata(organizationId, role, assignedBy, churchId);

      expect(metadata.worshipRoles?.[organizationId]).toEqual({
        role,
        churchId,
        assignedBy,
        assignedAt: expect.any(String),
        isActive: true,
      });

      // Verify assignedAt is a valid ISO date string
      const assignedAt = metadata.worshipRoles?.[organizationId]?.assignedAt;

      expect(assignedAt).toBeDefined();

      if (assignedAt) {
        expect(new Date(assignedAt).toISOString()).toBe(assignedAt);
      }
    });

    it('should work without church ID', () => {
      const organizationId = 'org_123';
      const role: WorshipRole = 'collaborator';
      const assignedBy = 'user_admin';

      const metadata = createWorshipRoleMetadata(organizationId, role, assignedBy);

      expect(metadata.worshipRoles?.[organizationId]).toEqual({
        role,
        assignedBy,
        assignedAt: expect.any(String),
        isActive: true,
      });
    });
  });

  describe('mergeWorshipRoleMetadata', () => {
    it('should merge new role data with existing metadata', () => {
      const existing: WorshipUserMetadata = {
        defaultRole: 'member',
        worshipRoles: {
          org_111: {
            role: 'collaborator',
            assignedBy: 'user_admin1',
            assignedAt: '2024-01-01T00:00:00Z',
            isActive: true,
          },
        },
      };

      const newRole = createWorshipRoleMetadata('org_222', 'worship_leader', 'user_admin2');
      const merged = mergeWorshipRoleMetadata(existing, newRole);

      expect(merged.defaultRole).toBe('member');
      expect(merged.worshipRoles?.org_111).toEqual(existing.worshipRoles?.org_111);
      expect(merged.worshipRoles?.org_222).toEqual(newRole.worshipRoles?.org_222);
    });

    it('should work with undefined existing metadata', () => {
      const newRole = createWorshipRoleMetadata('org_123', 'pastor', 'user_admin');
      const merged = mergeWorshipRoleMetadata(undefined, newRole);

      expect(merged.worshipRoles?.org_123).toEqual(newRole.worshipRoles?.org_123);
    });
  });

  describe('revokeWorshipRole', () => {
    it('should mark role as inactive', () => {
      const organizationId = 'org_123';
      const existing: WorshipUserMetadata = {
        worshipRoles: {
          [organizationId]: {
            role: 'worship_leader',
            assignedBy: 'user_admin',
            assignedAt: '2024-01-01T00:00:00Z',
            isActive: true,
          },
        },
      };

      const revoked = revokeWorshipRole(existing, organizationId);

      expect(revoked.worshipRoles?.[organizationId]?.isActive).toBe(false);
      expect(revoked.worshipRoles?.[organizationId]?.role).toBe('worship_leader');
    });

    it('should handle undefined metadata gracefully', () => {
      const revoked = revokeWorshipRole(undefined, 'org_123');

      expect(revoked).toEqual({});
    });

    it('should handle non-existent organization gracefully', () => {
      const existing: WorshipUserMetadata = {
        worshipRoles: {
          org_111: {
            role: 'admin',
            assignedBy: 'user_admin',
            assignedAt: '2024-01-01T00:00:00Z',
            isActive: true,
          },
        },
      };

      const revoked = revokeWorshipRole(existing, 'org_222');

      expect(revoked.worshipRoles?.org_111?.isActive).toBe(true);
    });
  });

  describe('getEffectiveWorshipRole', () => {
    const organizationId = 'org_123';

    it('should prefer worship metadata over Clerk role', () => {
      const metadata: WorshipUserMetadata = {
        worshipRoles: {
          [organizationId]: {
            role: 'worship_leader',
            assignedBy: 'user_admin',
            assignedAt: '2024-01-01T00:00:00Z',
            isActive: true,
          },
        },
      };

      const effective = getEffectiveWorshipRole('org:member', metadata, organizationId);

      expect(effective).toBe('worship_leader');
    });

    it('should fall back to Clerk role when no worship metadata', () => {
      const effective = getEffectiveWorshipRole('org:admin', undefined, organizationId);

      expect(effective).toBe('admin');
    });

    it('should map Clerk roles correctly', () => {
      expect(getEffectiveWorshipRole('org:admin', undefined, organizationId)).toBe('admin');
      expect(getEffectiveWorshipRole('org:pastor', undefined, organizationId)).toBe('pastor');
      expect(getEffectiveWorshipRole('org:worship_leader', undefined, organizationId)).toBe('worship_leader');
      expect(getEffectiveWorshipRole('org:collaborator', undefined, organizationId)).toBe('collaborator');
      expect(getEffectiveWorshipRole('org:member', undefined, organizationId)).toBe('member');
      expect(getEffectiveWorshipRole(undefined, undefined, organizationId)).toBe('member');
    });

    it('should return member for inactive worship roles', () => {
      const metadata: WorshipUserMetadata = {
        worshipRoles: {
          [organizationId]: {
            role: 'admin',
            assignedBy: 'user_admin',
            assignedAt: '2024-01-01T00:00:00Z',
            isActive: false,
          },
        },
      };

      const effective = getEffectiveWorshipRole('org:member', metadata, organizationId);

      expect(effective).toBe('member');
    });
  });
});
