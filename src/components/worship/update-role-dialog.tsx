'use client';

import { Shield, User, UserCheck, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorshipAuth } from '@/hooks/use-worship-auth';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import type { OrganizationMember } from '@/lib/worship-user-management';

type UpdateRoleDialogProps = {
  open: boolean;
  onClose: () => void;
  onUpdateRole: (newRole: ExtendedWorshipRole) => Promise<void>;
  currentMember?: OrganizationMember;
};

export function UpdateRoleDialog({
  open,
  onClose,
  onUpdateRole,
  currentMember,
}: UpdateRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<ExtendedWorshipRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { worshipRole } = useWorshipAuth();

  // Reset form when dialog opens with new member
  useEffect(() => {
    if (currentMember) {
      setSelectedRole(currentMember.worshipRole);
      setError(null);
    }
  }, [currentMember]);

  // Define available roles based on current user's role
  const getAvailableRoles = (): Array<{
    value: ExtendedWorshipRole;
    label: string;
    description: string;
    icon: React.ReactNode;
    level: number;
  }> => {
    const allRoles = [
      {
        value: 'member' as ExtendedWorshipRole,
        label: 'Member',
        description: 'Basic access to view content',
        icon: <Users className="size-4" />,
        level: 20,
      },
      {
        value: 'collaborator' as ExtendedWorshipRole,
        label: 'Collaborator',
        description: 'Can create and edit hymns and programs',
        icon: <UserPlus className="size-4" />,
        level: 40,
      },
      {
        value: 'worship_leader' as ExtendedWorshipRole,
        label: 'Worship Leader',
        description: 'Can manage worship services and approve content',
        icon: <User className="size-4" />,
        level: 60,
      },
      {
        value: 'pastor' as ExtendedWorshipRole,
        label: 'Pastor',
        description: 'Can manage church and ministry settings',
        icon: <UserCheck className="size-4" />,
        level: 80,
      },
      {
        value: 'admin' as ExtendedWorshipRole,
        label: 'Admin',
        description: 'Full access to all features and user management',
        icon: <Shield className="size-4" />,
        level: 100,
      },
    ];

    // Role hierarchy - users can only assign roles equal to or below their own level
    const roleHierarchy: Record<ExtendedWorshipRole, number> = {
      admin: 100,
      pastor: 80,
      worship_leader: 60,
      collaborator: 40,
      member: 20,
    };

    const currentUserLevel = roleHierarchy[worshipRole];

    return allRoles.filter(role => role.level <= currentUserLevel);
  };

  const availableRoles = getAvailableRoles();

  const formatRoleName = (role: ExtendedWorshipRole) => {
    switch (role) {
      case 'worship_leader':
        return 'Worship Leader';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    if (!currentMember) {
      setError('No member selected');
      return;
    }

    if (selectedRole === currentMember.worshipRole) {
      setError('User already has this role');
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateRole(selectedRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  if (!currentMember) {
    return null;
  }

  const memberName = currentMember.firstName && currentMember.lastName
    ? `${currentMember.firstName} ${currentMember.lastName}`
    : currentMember.emailAddress;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Update User Role
          </DialogTitle>
          <DialogDescription>
            Change the worship role for
            {' '}
            {memberName}
            .
            <br />
            <span className="mt-1 block text-sm text-muted-foreground">
              Current role:
              {' '}
              <strong>{formatRoleName(currentMember.worshipRole)}</strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-role">New Worship Role</Label>
            <Select
              value={selectedRole}
              onValueChange={value => setSelectedRole(value as ExtendedWorshipRole)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    disabled={role.value === currentMember.worshipRole}
                  >
                    <div className="flex items-center gap-2">
                      {role.icon}
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {role.label}
                          {role.value === currentMember.worshipRole && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (Current)
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role comparison */}
          {selectedRole !== currentMember.worshipRole && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">{formatRoleName(currentMember.worshipRole)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">{formatRoleName(selectedRole)}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedRole === currentMember.worshipRole}
            >
              {isSubmitting
                ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Updating...
                    </>
                  )
                : (
                    <>
                      <Shield className="mr-2 size-4" />
                      Update Role
                    </>
                  )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
