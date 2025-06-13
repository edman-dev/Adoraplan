'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { RoleManagementDashboard } from '@/components/worship/role-management-dashboard';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { useUserManagement } from '@/hooks/use-user-management';
import { useWorshipAuth } from '@/hooks/use-worship-auth';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';

const UserManagementPage = () => {
  const { organizationId, userId, canInviteUsers } = useWorshipAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);

  const userManagement = useUserManagement({
    organizationId: organizationId || undefined,
    onSuccess: message => toast.success(message),
    onError: error => toast.error(error),
  });

  // Load members when component mounts
  useEffect(() => {
    if (organizationId) {
      userManagement.fetchMembers(organizationId).finally(() => {
        setIsPageLoading(false);
      });
    } else {
      setIsPageLoading(false);
    }
  }, [organizationId, userManagement]);

  const handleInviteUser = async (email: string, role: ExtendedWorshipRole) => {
    if (!userId) {
      throw new Error('User ID not available');
    }

    await userManagement.inviteUser(email, role, userId);
  };

  const handleUpdateRole = async (targetUserId: string, newRole: ExtendedWorshipRole) => {
    if (!userId) {
      throw new Error('User ID not available');
    }

    await userManagement.updateUserRole(targetUserId, newRole, userId);
  };

  const handleRemoveUser = async (targetUserId: string) => {
    await userManagement.removeUser(targetUserId);
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    await userManagement.revokeInvitation(invitationId);
  };

  // Show loading state while checking permissions and loading data
  if (isPageLoading || userManagement.isLoading) {
    return (
      <div className="space-y-6">
        <TitleBar
          title="Role Management"
          description="Comprehensive role and permission management for your organization"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            <p className="text-muted-foreground">Loading role management...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!canInviteUsers) {
    return (
      <div className="space-y-6">
        <TitleBar
          title="Role Management"
          description="Comprehensive role and permission management for your organization"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 text-4xl">🔒</div>
            <h3 className="mb-2 text-lg font-medium">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access role management features.
              <br />
              Contact your organization administrator to request access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TitleBar
        title="Role Management"
        description="Comprehensive role and permission management for your organization"
      />

      <RoleManagementDashboard
        members={userManagement.members}
        onInviteUser={handleInviteUser}
        onUpdateRole={handleUpdateRole}
        onRemoveUser={handleRemoveUser}
        onRevokeInvitation={handleRevokeInvitation}
        isLoading={userManagement.isLoading}
      />
    </div>
  );
};

export default UserManagementPage;
