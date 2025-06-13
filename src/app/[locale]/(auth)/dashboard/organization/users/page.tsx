'use client';

import { useEffect, useState } from 'react';

import { RoleManagementDashboard } from '@/components/worship/role-management-dashboard';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { useUserManagement } from '@/hooks/use-user-management';
import { useWorshipAuth } from '@/hooks/use-worship-auth';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';

const UserManagementPage = () => {
  const { organizationId, userId, canInviteUsers } = useWorshipAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { toast } = useToast();

  const userManagement = useUserManagement({
    organizationId: organizationId || undefined,
    onSuccess: message => toast({ title: 'Success', description: message }),
    onError: error => toast({ title: 'Error', description: error, variant: 'destructive' }),
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

  // Allow viewing but restrict actions based on permissions

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
