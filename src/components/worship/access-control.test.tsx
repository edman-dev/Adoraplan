/* eslint-disable jsx-a11y/aria-role */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminGuard,
  AuthGuard,
  ChurchManagementGuard,
  CollaboratorGuard,
  HymnCreationGuard,
  MultiPermissionGuard,
  MultiRoleGuard,
  OrganizationGuard,
  PastorGuard,
  PermissionGuard,
  ProgramCreationGuard,
  RoleGuard,
  UserManagementGuard,
  WorshipGuard,
  WorshipLeaderGuard,
} from './access-control';

// Mock the useWorshipAuth hook
const mockUseWorshipAuth = vi.fn();
vi.mock('@/hooks/use-worship-auth', () => ({
  useWorshipAuth: () => mockUseWorshipAuth(),
}));

describe('Access Control Components', () => {
  const TestContent = () => <div>Protected Content</div>;
  const TestFallback = () => <div>Access Denied</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PermissionGuard', () => {
    it('renders children when user has required permission', () => {
      mockUseWorshipAuth.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        <PermissionGuard permission="canCreateChurch">
          <TestContent />
        </PermissionGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders fallback when user lacks permission', () => {
      mockUseWorshipAuth.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <PermissionGuard permission="canCreateChurch" fallback={<TestFallback />}>
          <TestContent />
        </PermissionGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders nothing when user lacks permission and no fallback provided', () => {
      mockUseWorshipAuth.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
      });

      const { container } = render(
        <PermissionGuard permission="canCreateChurch">
          <TestContent />
        </PermissionGuard>,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('RoleGuard', () => {
    it('renders children when user has minimum role', () => {
      mockUseWorshipAuth.mockReturnValue({
        worshipRole: 'admin',
        hasMinimumRole: vi.fn().mockReturnValue(true),
      });

      render(
        <RoleGuard role="pastor">
          <TestContent />
        </RoleGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders children when user has exact role match', () => {
      mockUseWorshipAuth.mockReturnValue({
        worshipRole: 'pastor',
        hasMinimumRole: vi.fn().mockReturnValue(false),
      });

      render(
        <RoleGuard role="pastor" exact>
          <TestContent />
        </RoleGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders fallback when user lacks minimum role', () => {
      mockUseWorshipAuth.mockReturnValue({
        worshipRole: 'member',
        hasMinimumRole: vi.fn().mockReturnValue(false),
      });

      render(
        <RoleGuard role="admin" fallback={<TestFallback />}>
          <TestContent />
        </RoleGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders fallback when exact role does not match', () => {
      mockUseWorshipAuth.mockReturnValue({
        worshipRole: 'admin',
        hasMinimumRole: vi.fn().mockReturnValue(true),
      });

      render(
        <RoleGuard role="pastor" exact fallback={<TestFallback />}>
          <TestContent />
        </RoleGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('MultiPermissionGuard', () => {
    it('renders children when user has all required permissions (AND logic)', () => {
      mockUseWorshipAuth.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
      });

      render(
        <MultiPermissionGuard
          permissions={['canCreateChurch', 'canManageChurch']}
          requireAll
        >
          <TestContent />
        </MultiPermissionGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders children when user has any required permission (OR logic)', () => {
      const hasPermission = vi.fn()
        .mockReturnValueOnce(false) // canCreateChurch
        .mockReturnValueOnce(true); // canManageChurch

      mockUseWorshipAuth.mockReturnValue({
        hasPermission,
      });

      render(
        <MultiPermissionGuard
          permissions={['canCreateChurch', 'canManageChurch']}
          requireAll={false}
        >
          <TestContent />
        </MultiPermissionGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders fallback when user lacks all permissions (AND logic)', () => {
      const hasPermission = vi.fn()
        .mockReturnValueOnce(true) // canCreateChurch
        .mockReturnValueOnce(false); // canManageChurch

      mockUseWorshipAuth.mockReturnValue({
        hasPermission,
      });

      render(
        <MultiPermissionGuard
          permissions={['canCreateChurch', 'canManageChurch']}
          requireAll
          fallback={<TestFallback />}
        >
          <TestContent />
        </MultiPermissionGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders fallback when user lacks any permissions (OR logic)', () => {
      mockUseWorshipAuth.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
      });

      render(
        <MultiPermissionGuard
          permissions={['canCreateChurch', 'canManageChurch']}
          requireAll={false}
          fallback={<TestFallback />}
        >
          <TestContent />
        </MultiPermissionGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('MultiRoleGuard', () => {
    it('renders children when user has any required role (OR logic default)', () => {
      const hasMinimumRole = vi.fn()
        .mockReturnValueOnce(false) // admin
        .mockReturnValueOnce(true); // pastor

      mockUseWorshipAuth.mockReturnValue({
        hasMinimumRole,
      });

      render(
        <MultiRoleGuard roles={['admin', 'pastor']}>
          <TestContent />
        </MultiRoleGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders fallback when user lacks all roles (AND logic)', () => {
      const hasMinimumRole = vi.fn()
        .mockReturnValueOnce(true) // admin
        .mockReturnValueOnce(false); // pastor

      mockUseWorshipAuth.mockReturnValue({
        hasMinimumRole,
      });

      render(
        <MultiRoleGuard
          roles={['admin', 'pastor']}
          requireAll
          fallback={<TestFallback />}
        >
          <TestContent />
        </MultiRoleGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('AuthGuard', () => {
    it('renders children when user is authenticated and not loading', () => {
      mockUseWorshipAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AuthGuard>
          <TestContent />
        </AuthGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders fallback when user is not authenticated', () => {
      mockUseWorshipAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <AuthGuard fallback={<TestFallback />}>
          <TestContent />
        </AuthGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders fallback when loading', () => {
      mockUseWorshipAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: true,
      });

      render(
        <AuthGuard fallback={<TestFallback />}>
          <TestContent />
        </AuthGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('OrganizationGuard', () => {
    it('renders children when user has organization and not loading', () => {
      mockUseWorshipAuth.mockReturnValue({
        hasOrganization: true,
        isLoading: false,
      });

      render(
        <OrganizationGuard>
          <TestContent />
        </OrganizationGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders fallback when user has no organization', () => {
      mockUseWorshipAuth.mockReturnValue({
        hasOrganization: false,
        isLoading: false,
      });

      render(
        <OrganizationGuard fallback={<TestFallback />}>
          <TestContent />
        </OrganizationGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('WorshipGuard', () => {
    it('renders children when user is authenticated and has organization', () => {
      mockUseWorshipAuth.mockReturnValue({
        isAuthenticated: true,
        hasOrganization: true,
        isLoading: false,
      });

      render(
        <WorshipGuard>
          <TestContent />
        </WorshipGuard>,
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders fallback when user is not authenticated', () => {
      mockUseWorshipAuth.mockReturnValue({
        isAuthenticated: false,
        hasOrganization: true,
        isLoading: false,
      });

      render(
        <WorshipGuard fallback={<TestFallback />}>
          <TestContent />
        </WorshipGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders fallback when user has no organization', () => {
      mockUseWorshipAuth.mockReturnValue({
        isAuthenticated: true,
        hasOrganization: false,
        isLoading: false,
      });

      render(
        <WorshipGuard fallback={<TestFallback />}>
          <TestContent />
        </WorshipGuard>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Role-specific Guards', () => {
    describe('AdminGuard', () => {
      it('renders children for exact admin role', () => {
        mockUseWorshipAuth.mockReturnValue({
          worshipRole: 'admin',
          hasMinimumRole: vi.fn().mockReturnValue(true),
        });

        render(
          <AdminGuard>
            <TestContent />
          </AdminGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      it('renders fallback for non-admin roles', () => {
        mockUseWorshipAuth.mockReturnValue({
          worshipRole: 'pastor',
          hasMinimumRole: vi.fn().mockReturnValue(false),
        });

        render(
          <AdminGuard fallback={<TestFallback />}>
            <TestContent />
          </AdminGuard>,
        );

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    describe('PastorGuard', () => {
      it('renders children for pastor or higher role', () => {
        mockUseWorshipAuth.mockReturnValue({
          worshipRole: 'pastor',
          hasMinimumRole: vi.fn().mockReturnValue(true),
        });

        render(
          <PastorGuard>
            <TestContent />
          </PastorGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    describe('WorshipLeaderGuard', () => {
      it('renders children for worship leader or higher role', () => {
        mockUseWorshipAuth.mockReturnValue({
          worshipRole: 'worship_leader',
          hasMinimumRole: vi.fn().mockReturnValue(true),
        });

        render(
          <WorshipLeaderGuard>
            <TestContent />
          </WorshipLeaderGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    describe('CollaboratorGuard', () => {
      it('renders children for collaborator or higher role', () => {
        mockUseWorshipAuth.mockReturnValue({
          worshipRole: 'collaborator',
          hasMinimumRole: vi.fn().mockReturnValue(true),
        });

        render(
          <CollaboratorGuard>
            <TestContent />
          </CollaboratorGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-specific Guards', () => {
    describe('ChurchManagementGuard', () => {
      it('renders children when user has church management permission', () => {
        mockUseWorshipAuth.mockReturnValue({
          hasPermission: vi.fn().mockImplementation(permission =>
            permission === 'canManageChurch',
          ),
        });

        render(
          <ChurchManagementGuard>
            <TestContent />
          </ChurchManagementGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      it('renders fallback when user lacks church management permission', () => {
        mockUseWorshipAuth.mockReturnValue({
          hasPermission: vi.fn().mockReturnValue(false),
        });

        render(
          <ChurchManagementGuard fallback={<TestFallback />}>
            <TestContent />
          </ChurchManagementGuard>,
        );

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    describe('HymnCreationGuard', () => {
      it('renders children when user has hymn creation permission', () => {
        mockUseWorshipAuth.mockReturnValue({
          hasPermission: vi.fn().mockImplementation(permission =>
            permission === 'canCreateHymn',
          ),
        });

        render(
          <HymnCreationGuard>
            <TestContent />
          </HymnCreationGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    describe('ProgramCreationGuard', () => {
      it('renders children when user has program creation permission', () => {
        mockUseWorshipAuth.mockReturnValue({
          hasPermission: vi.fn().mockImplementation(permission =>
            permission === 'canCreateProgram',
          ),
        });

        render(
          <ProgramCreationGuard>
            <TestContent />
          </ProgramCreationGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    describe('UserManagementGuard', () => {
      it('renders children when user has user invitation permission', () => {
        mockUseWorshipAuth.mockReturnValue({
          hasPermission: vi.fn().mockImplementation(permission =>
            permission === 'canInviteUsers',
          ),
        });

        render(
          <UserManagementGuard>
            <TestContent />
          </UserManagementGuard>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });
});
