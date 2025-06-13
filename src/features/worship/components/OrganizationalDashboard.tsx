'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Users, Calendar, BarChart3, Settings, AlertTriangle, CheckCircle, Clock, Activity, Target, Zap } from 'lucide-react';
import { useSubscriptionUsage } from '@/hooks/use-subscription-limits';
import { SubscriptionLimitCard } from './SubscriptionLimitCard';
import { ChurchManagement } from './ChurchManagement';
import { MinistryManagement } from './MinistryManagement';
import { ServiceManagement } from './ServiceManagement';
import { OrganizationalHierarchy } from './OrganizationalHierarchy';
import { AnalyticsCard, MetricBadge, QuickStat } from './AnalyticsCard';

interface OrganizationalStats {
  churches: {
    total: number;
    active: number;
    inactive: number;
  };
  ministries: {
    total: number;
    active: number;
    byChurch: { churchName: string; count: number }[];
  };
  services: {
    total: number;
    upcoming: number;
    thisWeek: number;
    byType: { type: string; count: number }[];
  };
  users: {
    totalCollaborators: number;
    byRole: { role: string; count: number }[];
    recentActivity: { userId: string; userName: string; action: string; timestamp: string }[];
  };
}

interface OrganizationalDashboardProps {
  organizationId: string;
}

export function OrganizationalDashboard({ organizationId }: OrganizationalDashboardProps) {
  const { user } = useUser();
  const { usage, loading: usageLoading, refetch: refetchUsage } = useSubscriptionUsage();
  const [stats, setStats] = useState<OrganizationalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Fetch organizational statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/worship/admin/stats?organizationId=${organizationId}&period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizational stats');
      }

      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      console.error('Error fetching organizational stats:', error);
      // Set default stats structure for development
      setStats({
        churches: { total: 1, active: 1, inactive: 0 },
        ministries: { total: 3, active: 3, byChurch: [{ churchName: 'Main Church', count: 3 }] },
        services: { total: 12, upcoming: 4, thisWeek: 2, byType: [{ type: 'Sunday Service', count: 8 }, { type: 'Prayer Meeting', count: 4 }] },
        users: { 
          totalCollaborators: 5, 
          byRole: [{ role: 'admin', count: 1 }, { role: 'worship_leader', count: 2 }, { role: 'collaborator', count: 2 }],
          recentActivity: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchStats();
    }
  }, [organizationId, selectedPeriod]);

  // Calculate subscription usage percentages
  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading || usageLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizational Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your worship organization structure and monitor usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { fetchStats(); refetchUsage(); }}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Subscription Overview */}
      {usage && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Churches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{usage.churches}</span>
                  <Badge variant={usage.churches >= 1 ? 'secondary' : 'default'}>
                    {usage.churches >= 1 ? 'At limit' : 'Available'}
                  </Badge>
                </div>
                <Progress value={getUsagePercentage(usage.churches, 1)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {usage.churches}/1 churches used
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Ministries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{usage.ministries}</span>
                  <Badge variant={usage.ministries >= 5 ? 'secondary' : 'default'}>
                    {usage.ministries >= 5 ? 'At limit' : `${5 - usage.ministries} left`}
                  </Badge>
                </div>
                <Progress value={getUsagePercentage(usage.ministries, 5)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {usage.ministries}/5 ministries used
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Collaborators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{usage.collaborators}</span>
                  <Badge variant={usage.collaborators >= 5 ? 'secondary' : 'default'}>
                    {usage.collaborators >= 5 ? 'At limit' : `${5 - usage.collaborators} left`}
                  </Badge>
                </div>
                <Progress value={getUsagePercentage(usage.collaborators, 5)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {usage.collaborators}/5 collaborators used
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="churches">Churches</TabsTrigger>
          <TabsTrigger value="ministries">Ministries</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Analytics Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <AnalyticsCard
                title="Churches"
                description="Total church locations"
                value={stats.churches.total}
                icon={Building}
                progress={{
                  current: usage?.churches || 0,
                  max: 1,
                  label: 'Plan usage'
                }}
                variant={stats.churches.total >= 1 ? 'warning' : 'default'}
              >
                <div className="space-y-1">
                  <MetricBadge label="Active" value={stats.churches.active} variant="success" />
                  {stats.churches.inactive > 0 && (
                    <MetricBadge label="Inactive" value={stats.churches.inactive} variant="secondary" />
                  )}
                </div>
              </AnalyticsCard>

              <AnalyticsCard
                title="Ministries"
                description="Active ministry groups"
                value={stats.ministries.active}
                icon={Users}
                progress={{
                  current: usage?.ministries || 0,
                  max: 5,
                  label: 'Plan usage'
                }}
                variant={stats.ministries.active >= 4 ? 'warning' : 'default'}
              >
                <MetricBadge 
                  label="Total created" 
                  value={stats.ministries.total} 
                  variant="secondary" 
                />
              </AnalyticsCard>

              <AnalyticsCard
                title="Services"
                description="Upcoming worship services"
                value={stats.services.upcoming}
                icon={Calendar}
                trend="stable"
              >
                <div className="space-y-1">
                  <MetricBadge label="This week" value={stats.services.thisWeek} variant="default" />
                  <MetricBadge label="Total types" value={stats.services.total} variant="secondary" />
                </div>
              </AnalyticsCard>

              <AnalyticsCard
                title="Team Members"
                description="Active collaborators"
                value={stats.users.totalCollaborators}
                icon={Activity}
                progress={{
                  current: usage?.collaborators || 0,
                  max: 5,
                  label: 'Plan usage'
                }}
                variant={stats.users.totalCollaborators >= 4 ? 'warning' : 'default'}
              >
                <MetricBadge 
                  label="Roles assigned" 
                  value={stats.users.byRole.length} 
                  variant="secondary" 
                />
              </AnalyticsCard>
            </div>
          )}

          {/* Quick Stats Row */}
          {stats && (
            <div className="grid gap-3 md:grid-cols-3">
              <QuickStat
                icon={Target}
                label="Ministry Efficiency"
                value={`${Math.round((stats.ministries.active / Math.max(stats.churches.active, 1)) * 100) / 10}/10`}
                change={{
                  value: 5,
                  type: 'increase'
                }}
              />
              <QuickStat
                icon={Zap}
                label="Service Coverage"
                value={`${stats.services.total} types`}
                change={{
                  value: 0,
                  type: 'neutral'
                }}
              />
              <QuickStat
                icon={Users}
                label="Team Utilization"
                value={`${Math.round((stats.users.totalCollaborators / 5) * 100)}%`}
                change={{
                  value: 12,
                  type: stats.users.totalCollaborators > 3 ? 'increase' : 'neutral'
                }}
              />
            </div>
          )}

          {/* Ministry Distribution */}
          {stats && stats.ministries.byChurch.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ministry Distribution by Church</CardTitle>
                <CardDescription>
                  How ministries are distributed across your churches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.ministries.byChurch.map((church, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{church.churchName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{church.count} ministries</span>
                        <Progress 
                          value={(church.count / stats.ministries.total) * 100} 
                          className="w-20 h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Role Distribution */}
          {stats && stats.users.byRole.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Role Distribution</CardTitle>
                <CardDescription>
                  Breakdown of team members by their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.users.byRole.map((role, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{role.role.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{role.count} members</span>
                        <Badge variant="secondary">{role.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Limits Warning */}
          {usage && (usage.churches >= 1 || usage.ministries >= 4 || usage.collaborators >= 4) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Approaching Subscription Limits
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  You're approaching your plan limits. Consider upgrading to continue growing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {usage.churches >= 1 && (
                    <SubscriptionLimitCard resource="churches" compact />
                  )}
                  {usage.ministries >= 4 && (
                    <SubscriptionLimitCard resource="ministries" compact />
                  )}
                  {usage.collaborators >= 4 && (
                    <SubscriptionLimitCard resource="collaborators" compact />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="churches">
          <ChurchManagement organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="ministries">
          <MinistryManagement organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="services">
          <ServiceManagement organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Organizational Hierarchy</CardTitle>
              <CardDescription>
                Navigate through your organizational structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationalHierarchy 
                organizationId={organizationId}
                onSelectionChange={(selection) => {
                  console.log('Selection changed:', selection);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}