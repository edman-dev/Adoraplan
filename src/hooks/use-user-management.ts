'use client';

import { useCallback, useState } from 'react';

import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import type { OrganizationMember } from '@/lib/worship-user-management';

type UseUserManagementOptions = {
  organizationId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
};

export function useUserManagement(options: UseUserManagementOptions = {}) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { organizationId, onSuccess, onError } = options;

  /**
   * Fetch organization members
   */
  const fetchMembers = useCallback(async (orgId?: string) => {
    const targetOrgId = orgId || organizationId;

    if (!targetOrgId) {
      const errorMsg = 'Organization ID is required';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/worship/users?organizationId=${encodeURIComponent(targetOrgId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch members');
      }

      setMembers(data.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch organization members';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onError]);

  /**
   * Invite a user to the organization
   */
  const inviteUser = useCallback(async (
    email: string,
    worshipRole: ExtendedWorshipRole,
    invitedBy: string,
    orgId?: string,
  ) => {
    const targetOrgId = orgId || organizationId;

    if (!targetOrgId) {
      const errorMsg = 'Organization ID is required';
      setError(errorMsg);
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    setError(null);

    try {
      const response = await fetch('/api/worship/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: targetOrgId,
          emailAddress: email,
          worshipRole,
          invitedBy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      onSuccess?.('Invitation sent successfully');

      // Refresh the members list
      await fetchMembers(targetOrgId);

      return data.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [organizationId, onSuccess, onError, fetchMembers]);

  /**
   * Update a user's worship role
   */
  const updateUserRole = useCallback(async (
    userId: string,
    newWorshipRole: ExtendedWorshipRole,
    assignedBy: string,
    orgId?: string,
  ) => {
    const targetOrgId = orgId || organizationId;

    if (!targetOrgId) {
      const errorMsg = 'Organization ID is required';
      setError(errorMsg);
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    setError(null);

    try {
      const response = await fetch(`/api/worship/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: targetOrgId,
          newWorshipRole,
          assignedBy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      onSuccess?.('User role updated successfully');

      // Refresh the members list
      await fetchMembers(targetOrgId);

      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update user role';
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [organizationId, onSuccess, onError, fetchMembers]);

  /**
   * Remove a user from the organization
   */
  const removeUser = useCallback(async (userId: string, orgId?: string) => {
    const targetOrgId = orgId || organizationId;

    if (!targetOrgId) {
      const errorMsg = 'Organization ID is required';
      setError(errorMsg);
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    setError(null);

    try {
      const response = await fetch(
        `/api/worship/users/${userId}?organizationId=${encodeURIComponent(targetOrgId)}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove user');
      }

      onSuccess?.('User removed from organization successfully');

      // Refresh the members list
      await fetchMembers(targetOrgId);

      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove user';
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [organizationId, onSuccess, onError, fetchMembers]);

  /**
   * Revoke a pending invitation
   */
  const revokeInvitation = useCallback(async (invitationId: string, orgId?: string) => {
    const targetOrgId = orgId || organizationId;

    if (!targetOrgId) {
      const errorMsg = 'Organization ID is required';
      setError(errorMsg);
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    setError(null);

    try {
      const response = await fetch(
        `/api/worship/invitations/${invitationId}?organizationId=${encodeURIComponent(targetOrgId)}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke invitation');
      }

      onSuccess?.('Invitation revoked successfully');

      // Refresh the members list
      await fetchMembers(targetOrgId);

      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to revoke invitation';
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [organizationId, onSuccess, onError, fetchMembers]);

  return {
    // State
    members,
    isLoading,
    error,

    // Actions
    fetchMembers,
    inviteUser,
    updateUserRole,
    removeUser,
    revokeInvitation,

    // Utilities
    clearError: () => setError(null),
  };
}
