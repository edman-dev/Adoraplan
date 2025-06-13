'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionLimits, useResourceLimit } from '@/hooks/use-subscription-limits';
import { 
  Crown, 
  TrendingUp, 
  Users, 
  Building, 
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { UsageStats } from '@/libs/worship/SubscriptionLimits';

interface SubscriptionLimitCardProps {
  resource?: keyof UsageStats;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
  compact?: boolean;
}

export function SubscriptionLimitCard({ 
  resource, 
  showUpgradeButton = true,
  onUpgrade,
  compact = false 
}: SubscriptionLimitCardProps) {
  const {
    tier,
    usage,
    loading,
    error,
    getTierInfo,
    isAtAnyLimit,
  } = useSubscriptionLimits();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading subscription info...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load subscription information
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'team': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Building className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'pro': return <Crown className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  if (resource) {
    return <ResourceLimitDisplay resource={resource} showUpgradeButton={showUpgradeButton} onUpgrade={onUpgrade} />;
  }

  if (compact) {
    return <CompactSubscriptionDisplay />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getTierIcon(tier)}
              Subscription Plan
            </CardTitle>
            <CardDescription>
              Current usage and limits for your {tier} plan
            </CardDescription>
          </div>
          <Badge className={getTierColor(tier)}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          {getTierInfo()}
        </div>

        <div className="grid gap-4">
          <ResourceUsageDisplay resource="churches" />
          <ResourceUsageDisplay resource="ministries" />
          <ResourceUsageDisplay resource="collaborators" />
        </div>

        {isAtAnyLimit && showUpgradeButton && (
          <div className="flex items-center gap-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                You've reached your plan limits
              </p>
              <p className="text-sm text-orange-600">
                Upgrade to continue adding resources
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onUpgrade}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResourceUsageDisplayProps {
  resource: keyof UsageStats;
}

function ResourceUsageDisplay({ resource }: ResourceUsageDisplayProps) {
  const {
    current,
    limit,
    usagePercentage,
    warningLevel,
  } = useResourceLimit(resource);

  const getResourceIcon = (resource: keyof UsageStats) => {
    switch (resource) {
      case 'churches': return <Building className="h-4 w-4" />;
      case 'ministries': return <Briefcase className="h-4 w-4" />;
      case 'collaborators': return <Users className="h-4 w-4" />;
      case 'services': return <Calendar className="h-4 w-4" />;
    }
  };

  const getResourceLabel = (resource: keyof UsageStats) => {
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  };

  const getProgressColor = (warningLevel: string) => {
    switch (warningLevel) {
      case 'safe': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (warningLevel: string) => {
    switch (warningLevel) {
      case 'safe': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {getResourceIcon(resource)}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{getResourceLabel(resource)}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {current}/{limit === -1 ? '∞' : limit}
            </span>
            {getStatusIcon(warningLevel)}
          </div>
        </div>
        {limit !== -1 && (
          <Progress 
            value={usagePercentage} 
            className="h-2"
            style={{
              background: usagePercentage > 0 ? getProgressColor(warningLevel) : undefined
            }}
          />
        )}
      </div>
    </div>
  );
}

interface ResourceLimitDisplayProps {
  resource: keyof UsageStats;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
}

function ResourceLimitDisplay({ resource, showUpgradeButton = true, onUpgrade }: ResourceLimitDisplayProps) {
  const {
    allowed,
    current,
    limit,
    message,
    upgradeInfo,
    warningLevel,
  } = useResourceLimit(resource);

  if (allowed) {
    return null; // Don't show anything if the limit allows creation
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-orange-800">
              {resource.charAt(0).toUpperCase() + resource.slice(1)} Limit Reached
            </h4>
            <p className="text-sm text-orange-600 mt-1">
              {message}
            </p>
            {showUpgradeButton && (
              <div className="mt-3 flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={onUpgrade}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade to {upgradeInfo.suggestedTier}
                </Button>
                <span className="text-xs text-orange-600">
                  to get {upgradeInfo.feature}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompactSubscriptionDisplay() {
  const { tier, isAtAnyLimit } = useSubscriptionLimits();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'team': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={getTierColor(tier)}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
      {isAtAnyLimit && (
        <Badge variant="outline" className="border-orange-300 text-orange-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          At Limit
        </Badge>
      )}
    </div>
  );
}