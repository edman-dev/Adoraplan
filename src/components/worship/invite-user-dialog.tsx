'use client';

import { Mail, Shield, User, UserCheck, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

type InviteUserDialogProps = {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: ExtendedWorshipRole) => Promise<void>;
};

export function InviteUserDialog({
  open,
  onClose,
  onInvite,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<ExtendedWorshipRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { worshipRole } = useWorshipAuth();

  // Define available roles based on current user's role
  const getAvailableRoles = (): Array<{
    value: ExtendedWorshipRole;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> => {
    const allRoles = [
      {
        value: 'member' as ExtendedWorshipRole,
        label: 'Member',
        description: 'Basic access to view content',
        icon: <Users className="size-4" />,
      },
      {
        value: 'collaborator' as ExtendedWorshipRole,
        label: 'Collaborator',
        description: 'Can create and edit hymns and programs',
        icon: <UserPlus className="size-4" />,
      },
      {
        value: 'worship_leader' as ExtendedWorshipRole,
        label: 'Worship Leader',
        description: 'Can manage worship services and approve content',
        icon: <User className="size-4" />,
      },
      {
        value: 'pastor' as ExtendedWorshipRole,
        label: 'Pastor',
        description: 'Can manage church and ministry settings',
        icon: <UserCheck className="size-4" />,
      },
      {
        value: 'admin' as ExtendedWorshipRole,
        label: 'Admin',
        description: 'Full access to all features and user management',
        icon: <Shield className="size-4" />,
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

    return allRoles.filter(role => roleHierarchy[role.value] <= currentUserLevel);
  };

  const availableRoles = getAvailableRoles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await onInvite(email.trim(), selectedRole);

      // Reset form
      setEmail('');
      setSelectedRole('member');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setSelectedRole('member');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Invite User to Organization
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization with a specific worship role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Worship Role</Label>
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
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      {role.icon}
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Sending...
                    </>
                  )
                : (
                    <>
                      <UserPlus className="mr-2 size-4" />
                      Send Invitation
                    </>
                  )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
