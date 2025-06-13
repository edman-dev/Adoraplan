'use client';

import {
  Activity,
  Calendar,
  Crown,
  Filter,
  Heart,
  Music,
  Search,
  Shield,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorshipAuth } from '@/hooks/use-worship-auth';
import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import type { OrganizationMember } from '@/lib/worship-user-management';

import { UserManagement } from './user-management';

type RoleManagementDashboardProps = {
  members: OrganizationMember[];
  onInviteUser: (email: string, role: ExtendedWorshipRole) => Promise<void>;
  onUpdateRole: (userId: string, newRole: ExtendedWorshipRole) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
  onRevokeInvitation: (invitationId: string) => Promise<void>;
  isLoading?: boolean;
};

// Role configuration with metadata
const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Crown,
    color: 'bg-red-500',
    badgeVariant: 'destructive' as const,
    description: 'Full system administration access',
    permissions: ['All permissions', 'System management', 'User administration'],
  },
  pastor: {
    label: 'Pastor',
    icon: Heart,
    color: 'bg-blue-500',
    badgeVariant: 'default' as const,
    description: 'Pastoral oversight and spiritual guidance',
    permissions: ['Approve programs', 'Ministry oversight', 'Member guidance'],
  },
  worship_leader: {
    label: 'Worship Leader',
    icon: Music,
    color: 'bg-purple-500',
    badgeVariant: 'secondary' as const,
    description: 'Lead worship planning and execution',
    permissions: ['Create programs', 'Manage hymns', 'Plan services'],
  },
  collaborator: {
    label: 'Collaborator',
    icon: Users,
    color: 'bg-green-500',
    badgeVariant: 'outline' as const,
    description: 'Contribute to worship planning',
    permissions: ['View programs', 'Add feedback', 'Team participation'],
  },
  member: {
    label: 'Member',
    icon: UserCheck,
    color: 'bg-gray-500',
    badgeVariant: 'secondary' as const,
    description: 'Basic organization member',
    permissions: ['View schedules', 'Receive notifications'],
  },
} as const;

export function RoleManagementDashboard({
  members,
  onInviteUser,
  onUpdateRole,
  onRemoveUser,
  onRevokeInvitation,
  isLoading = false,
}: RoleManagementDashboardProps) {
  const { hasPermission: _hasPermission } = useWorshipAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<ExtendedWorshipRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  // Calculate role statistics
  const roleStats = useMemo(() => {
    const stats = Object.keys(ROLE_CONFIG).reduce(
      (acc, role) => {
        acc[role as ExtendedWorshipRole] = 0;
        return acc;
      },
      {} as Record<ExtendedWorshipRole, number>,
    );

    members.forEach((member) => {
      if (member.status === 'active' && member.worshipRole) {
        stats[member.worshipRole] = (stats[member.worshipRole] || 0) + 1;
      }
    });

    return stats;
  }, [members]);

  // Calculate activity metrics
  const activityMetrics = useMemo(() => {
    const totalMembers = members.filter(m => m.status === 'active').length;
    const pendingInvitations = members.filter(m => m.status === 'pending').length;
    const recentlyJoined = members.filter(m =>
      m.status === 'active' && m.joinedAt
      && new Date(m.joinedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ).length;

    return {
      totalMembers,
      pendingInvitations,
      recentlyJoined,
      growthRate: recentlyJoined > 0 ? Math.round((recentlyJoined / totalMembers) * 100) : 0,
    };
  }, [members]);

  // Filter members based on search and filters
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch
        = member.name?.toLowerCase().includes(searchTerm.toLowerCase())
          || member.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || member.worshipRole === roleFilter;

      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchTerm, roleFilter, statusFilter]);

  // Note: canManageRoles could be used for additional access control if needed
  // const canManageRoles = hasPermission('canInviteUsers');

  return (
    <div className="space-y-6">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityMetrics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              +
              {activityMetrics.recentlyJoined}
              {' '}
              this month
            </p>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityMetrics.pendingInvitations}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        {/* Growth Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityMetrics.growthRate}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Active Roles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(roleStats).filter(count => count > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Of
              {' '}
              {Object.keys(ROLE_CONFIG).length}
              {' '}
              total roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Role Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
              const count = roleStats[roleKey as ExtendedWorshipRole] || 0;
              const percentage = activityMetrics.totalMembers > 0
                ? Math.round((count / activityMetrics.totalMembers) * 100)
                : 0;
              const IconComponent = config.icon;

              return (
                <div key={roleKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${config.color}`}>
                        <IconComponent className="size-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground">
                        {percentage}
                        %
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Management Interface */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Member Management</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <Select value={roleFilter} onValueChange={value => setRoleFilter(value as ExtendedWorshipRole | 'all')}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 size-4" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
                      <SelectItem key={roleKey} value={roleKey}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'active' | 'pending')}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Summary */}
              <div className="mt-4 text-sm text-muted-foreground">
                Showing
                {' '}
                {filteredMembers.length}
                {' '}
                of
                {' '}
                {members.length}
                {' '}
                members
                {searchTerm && ` matching "${searchTerm}"`}
                {roleFilter !== 'all' && ` with role "${ROLE_CONFIG[roleFilter as ExtendedWorshipRole]?.label}"`}
                {statusFilter !== 'all' && ` with status "${statusFilter}"`}
              </div>
            </CardContent>
          </Card>

          {/* User Management Component */}
          <UserManagement
            members={filteredMembers}
            onInviteUser={onInviteUser}
            onUpdateRole={onUpdateRole}
            onRemoveUser={onRemoveUser}
            onRevokeInvitation={onRevokeInvitation}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                  const IconComponent = config.icon;

                  return (
                    <div key={roleKey} className="rounded-lg border p-4">
                      <div className="flex items-start gap-4">
                        <div className={`rounded-full p-3 ${config.color}`}>
                          <IconComponent className="size-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <h3 className="text-lg font-medium">{config.label}</h3>
                            <Badge variant={config.badgeVariant}>
                              {roleStats[roleKey as ExtendedWorshipRole] || 0}
                              {' '}
                              members
                            </Badge>
                          </div>
                          <p className="mb-3 text-muted-foreground">{config.description}</p>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">Permissions:</div>
                            <div className="flex flex-wrap gap-2">
                              {config.permissions.map(permission => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recent member joins */}
                {members
                  .filter(m => m.status === 'active' && m.joinedAt)
                  .sort((a, b) => new Date(b.joinedAt!).getTime() - new Date(a.joinedAt!).getTime())
                  .slice(0, 10)
                  .map((member, index) => (
                    <div key={member.userId || index} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <UserCheck className="size-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{member.name || member.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Joined as
                          {' '}
                          {ROLE_CONFIG[member.worshipRole!]?.label}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.joinedAt && new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}

                {members.filter(m => m.status === 'active').length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No recent activity to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
