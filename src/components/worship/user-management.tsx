'use client';

import {
  Clock,
  Mail,
  MoreHorizontal,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWorshipAuth } from '@/hooks/use-worship-auth';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import type { OrganizationMember } from '@/lib/worship-user-management';

import { InviteUserDialog } from './invite-user-dialog';
import { UpdateRoleDialog } from './update-role-dialog';

type UserManagementProps = {
  members: OrganizationMember[];
  onInviteUser: (email: string, role: ExtendedWorshipRole) => Promise<void>;
  onUpdateRole: (userId: string, newRole: ExtendedWorshipRole) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
  onRevokeInvitation: (invitationId: string) => Promise<void>;
  isLoading?: boolean;
};

export function UserManagement({
  members,
  onInviteUser,
  onUpdateRole,
  onRemoveUser,
  onRevokeInvitation,
  isLoading = false,
}: UserManagementProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [updateRoleDialog, setUpdateRoleDialog] = useState<{
    open: boolean;
    member?: OrganizationMember;
  }>({ open: false });

  const { canInviteUsers, canAssignRoles, canRemoveUsers, userId } = useWorshipAuth();

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingInvitations = members.filter(m => m.status === 'invited');

  const getRoleColor = (role: ExtendedWorshipRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pastor':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'worship_leader':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'collaborator':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: ExtendedWorshipRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="size-3" />;
      case 'pastor':
        return <UserCheck className="size-3" />;
      case 'worship_leader':
        return <User className="size-3" />;
      case 'collaborator':
        return <UserPlus className="size-3" />;
      case 'member':
        return <Users className="size-3" />;
      default:
        return <User className="size-3" />;
    }
  };

  const formatRoleName = (role: ExtendedWorshipRole) => {
    switch (role) {
      case 'worship_leader':
        return 'Worship Leader';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const handleInviteUser = async (email: string, role: ExtendedWorshipRole) => {
    await onInviteUser(email, role);
    setInviteDialogOpen(false);
  };

  const handleUpdateRole = async (newRole: ExtendedWorshipRole) => {
    if (updateRoleDialog.member?.userId) {
      await onUpdateRole(updateRoleDialog.member.userId, newRole);
      setUpdateRoleDialog({ open: false });
    }
  };

  const canManageUser = (member: OrganizationMember) => {
    // Can't manage yourself
    if (member.userId === userId) {
      return false;
    }

    // Need appropriate permissions
    return canAssignRoles || canRemoveUsers;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage organization members and their worship roles
          </p>
        </div>

        {canInviteUsers && (
          <Button onClick={() => setInviteDialogOpen(true)} disabled={isLoading}>
            <UserPlus className="mr-2 size-4" />
            Invite User
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvitations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worship Leaders</CardTitle>
            <UserCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeMembers.filter(m =>
                ['admin', 'pastor', 'worship_leader'].includes(m.worshipRole),
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Active Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Worship Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-gray-200">
                        {member.imageUrl
                          ? (
                              <img
                                src={member.imageUrl}
                                alt={`${member.firstName || ''} ${member.lastName || ''}`}
                                className="size-8 rounded-full"
                              />
                            )
                          : (
                              <User className="size-4 text-gray-500" />
                            )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.firstName && member.lastName
                            ? `${member.firstName} ${member.lastName}`
                            : member.emailAddress}
                        </div>
                        {member.userId === userId && (
                          <div className="text-sm text-muted-foreground">You</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.emailAddress}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getRoleColor(member.worshipRole)}
                    >
                      {getRoleIcon(member.worshipRole)}
                      <span className="ml-1">{formatRoleName(member.worshipRole)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.joinedAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canManageUser(member) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {canAssignRoles && (
                            <DropdownMenuItem
                              onClick={() => setUpdateRoleDialog({ open: true, member })}
                            >
                              <Shield className="mr-2 size-4" />
                              Update Role
                            </DropdownMenuItem>
                          )}
                          {canRemoveUsers && (
                            <DropdownMenuItem
                              onClick={() => onRemoveUser(member.userId)}
                              className="text-red-600"
                            >
                              <UserMinus className="mr-2 size-4" />
                              Remove User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {activeMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No active members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Invited Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map(invitation => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.emailAddress}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getRoleColor(invitation.worshipRole)}
                      >
                        {getRoleIcon(invitation.worshipRole)}
                        <span className="ml-1">{formatRoleName(invitation.worshipRole)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invitation.invitedAt?.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {canInviteUsers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRevokeInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInviteUser}
      />

      <UpdateRoleDialog
        open={updateRoleDialog.open}
        onClose={() => setUpdateRoleDialog({ open: false })}
        onUpdateRole={handleUpdateRole}
        currentMember={updateRoleDialog.member}
      />
    </div>
  );
}
