import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrganizationMember } from '@/lib/worship-user-management';

import { useUserManagement } from './use-user-management';

// Mock fetch
globalThis.fetch = vi.fn();

const mockFetch = fetch as any;

describe('useUserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  const mockMembers: OrganizationMember[] = [
    {
      id: 'member_1',
      userId: 'user_1',
      organizationId: 'org_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddress: 'john@example.com',
      imageUrl: 'https://example.com/avatar.jpg',
      role: 'admin',
      worshipRole: 'admin',
      joinedAt: new Date('2024-01-01'),
      status: 'active',
    },
    {
      id: 'invitation_1',
      userId: '',
      organizationId: 'org_123',
      firstName: null,
      lastName: null,
      emailAddress: 'jane@example.com',
      imageUrl: '',
      role: 'basic_member',
      worshipRole: 'member',
      joinedAt: new Date('2024-01-02'),
      invitedAt: new Date('2024-01-02'),
      status: 'invited',
    },
  ];

  describe('fetchMembers', () => {
    it('should fetch organization members successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMembers,
        }),
      });

      const { result } = renderHook(() =>
        useUserManagement({ organizationId: 'org_123' }),
      );

      await act(async () => {
        await result.current.fetchMembers();
      });

      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith('/api/worship/users?organizationId=org_123');
    });

    it('should handle fetch errors', async () => {
      const mockError = 'Failed to fetch members';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: mockError,
        }),
      });

      const mockOnError = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onError: mockOnError,
        }),
      );

      await act(async () => {
        await result.current.fetchMembers();
      });

      expect(result.current.members).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(mockError);
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    it('should require organization ID', async () => {
      const mockOnError = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({ onError: mockOnError }),
      );

      await act(async () => {
        await result.current.fetchMembers();
      });

      expect(result.current.error).toBe('Organization ID is required');
      expect(mockOnError).toHaveBeenCalledWith('Organization ID is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('inviteUser', () => {
    it('should invite user successfully', async () => {
      // Mock successful invitation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { invitationId: 'invitation_123' },
        }),
      });

      // Mock successful members fetch after invitation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMembers,
        }),
      });

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onSuccess: mockOnSuccess,
        }),
      );

      await act(async () => {
        await result.current.inviteUser('user@example.com', 'collaborator', 'admin_123');
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('Invitation sent successfully');
      expect(mockFetch).toHaveBeenCalledWith('/api/worship/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'org_123',
          emailAddress: 'user@example.com',
          worshipRole: 'collaborator',
          invitedBy: 'admin_123',
        }),
      });
    });

    it('should handle invitation errors', async () => {
      const mockError = 'Invalid email address';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: mockError,
        }),
      });

      const mockOnError = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onError: mockOnError,
        }),
      );

      await act(async () => {
        await expect(
          result.current.inviteUser('invalid-email', 'member', 'admin_123'),
        ).rejects.toThrow(mockError);
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      // Mock successful role update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'User role updated successfully',
        }),
      });

      // Mock successful members fetch after update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMembers,
        }),
      });

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onSuccess: mockOnSuccess,
        }),
      );

      await act(async () => {
        await result.current.updateUserRole('user_123', 'pastor', 'admin_123');
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('User role updated successfully');
      expect(mockFetch).toHaveBeenCalledWith('/api/worship/users/user_123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'org_123',
          newWorshipRole: 'pastor',
          assignedBy: 'admin_123',
        }),
      });
    });

    it('should handle role update errors', async () => {
      const mockError = 'Insufficient permissions';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: mockError,
        }),
      });

      const mockOnError = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onError: mockOnError,
        }),
      );

      await act(async () => {
        await expect(
          result.current.updateUserRole('user_123', 'admin', 'collaborator_123'),
        ).rejects.toThrow(mockError);
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('removeUser', () => {
    it('should remove user successfully', async () => {
      // Mock successful user removal
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'User removed from organization successfully',
        }),
      });

      // Mock successful members fetch after removal
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMembers.filter(m => m.userId !== 'user_123'),
        }),
      });

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onSuccess: mockOnSuccess,
        }),
      );

      await act(async () => {
        await result.current.removeUser('user_123');
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('User removed from organization successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/worship/users/user_123?organizationId=org_123',
        {
          method: 'DELETE',
        },
      );
    });

    it('should handle user removal errors', async () => {
      const mockError = 'User not found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: mockError,
        }),
      });

      const mockOnError = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onError: mockOnError,
        }),
      );

      await act(async () => {
        await expect(result.current.removeUser('user_123')).rejects.toThrow(mockError);
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('revokeInvitation', () => {
    it('should revoke invitation successfully', async () => {
      // Mock successful invitation revocation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Invitation revoked successfully',
        }),
      });

      // Mock successful members fetch after revocation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMembers.filter(m => m.id !== 'invitation_123'),
        }),
      });

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onSuccess: mockOnSuccess,
        }),
      );

      await act(async () => {
        await result.current.revokeInvitation('invitation_123');
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('Invitation revoked successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/worship/invitations/invitation_123?organizationId=org_123',
        {
          method: 'DELETE',
        },
      );
    });

    it('should handle invitation revocation errors', async () => {
      const mockError = 'Invitation not found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: mockError,
        }),
      });

      const mockOnError = vi.fn();
      const { result } = renderHook(() =>
        useUserManagement({
          organizationId: 'org_123',
          onError: mockOnError,
        }),
      );

      await act(async () => {
        await expect(result.current.revokeInvitation('invitation_123')).rejects.toThrow(mockError);
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useUserManagement());

      // Set an error first
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});
