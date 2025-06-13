import { useState, useEffect, useCallback } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import {
  checkLimit,
  getUpgradeInfo,
  getTierDescription,
  getUsagePercentage,
  getUsageWarningLevel,
  checkMultipleLimits,
  type SubscriptionTier,
  type UsageStats,
  type LimitCheckResult,
} from '@/libs/worship/SubscriptionLimits';

interface SubscriptionData {
  tier: SubscriptionTier;
  usage: UsageStats;
  loading: boolean;
  error: string | null;
}

interface LimitCheckHookResult extends SubscriptionData {
  // Limit checking functions
  checkResourceLimit: (resource: keyof UsageStats) => LimitCheckResult;
  checkMultipleResourceLimits: (resources: (keyof UsageStats)[]) => Record<keyof UsageStats, LimitCheckResult>;
  
  // Usage information
  getResourceUsagePercentage: (resource: keyof UsageStats) => number;
  getResourceWarningLevel: (resource: keyof UsageStats) => 'safe' | 'warning' | 'danger';
  
  // Upgrade information
  getResourceUpgradeInfo: (resource: keyof UsageStats) => ReturnType<typeof getUpgradeInfo>;
  getTierInfo: () => string;
  
  // Actions
  refreshUsage: () => Promise<void>;
  
  // Computed values
  isAtAnyLimit: boolean;
  canCreateChurch: boolean;
  canCreateMinistry: boolean;
  canInviteCollaborator: boolean;
}

/**
 * Hook to manage subscription limits and usage tracking
 */
export function useSubscriptionLimits(): LimitCheckHookResult {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    tier: 'free', // Default to free tier
    usage: {
      churches: 0,
      ministries: 0,
      collaborators: 0,
      services: 0,
    },
    loading: true,
    error: null,
  });

  // Fetch current usage data
  const fetchUsage = useCallback(async () => {
    if (!organization?.id) {
      setSubscriptionData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setSubscriptionData(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/worship/subscription/usage?organizationId=${organization.id}`);
      const result = await response.json();

      if (result.success) {
        setSubscriptionData({
          tier: result.data.tier || 'free',
          usage: result.data.usage,
          loading: false,
          error: null,
        });
      } else {
        setSubscriptionData(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch usage data',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch subscription usage:', error);
      setSubscriptionData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch usage data',
      }));
    }
  }, [organization?.id]);

  // Load usage data on mount and when organization changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Check if user can create a specific resource
  const checkResourceLimit = useCallback((resource: keyof UsageStats): LimitCheckResult => {
    return checkLimit(subscriptionData.tier, subscriptionData.usage, resource);
  }, [subscriptionData.tier, subscriptionData.usage]);

  // Check multiple resources at once
  const checkMultipleResourceLimits = useCallback((resources: (keyof UsageStats)[]) => {
    return checkMultipleLimits(subscriptionData.tier, subscriptionData.usage, resources);
  }, [subscriptionData.tier, subscriptionData.usage]);

  // Get usage percentage for a resource
  const getResourceUsagePercentage = useCallback((resource: keyof UsageStats): number => {
    return getUsagePercentage(subscriptionData.tier, subscriptionData.usage, resource);
  }, [subscriptionData.tier, subscriptionData.usage]);

  // Get warning level for a resource
  const getResourceWarningLevel = useCallback((resource: keyof UsageStats) => {
    const percentage = getResourceUsagePercentage(resource);
    return getUsageWarningLevel(percentage);
  }, [getResourceUsagePercentage]);

  // Get upgrade information for a resource
  const getResourceUpgradeInfo = useCallback((resource: keyof UsageStats) => {
    return getUpgradeInfo(subscriptionData.tier, resource);
  }, [subscriptionData.tier]);

  // Get tier description
  const getTierInfo = useCallback(() => {
    return getTierDescription(subscriptionData.tier);
  }, [subscriptionData.tier]);

  // Computed values for common checks
  const isAtAnyLimit = useCallback(() => {
    const checks = checkMultipleResourceLimits(['churches', 'ministries', 'collaborators']);
    return Object.values(checks).some(result => !result.allowed);
  }, [checkMultipleResourceLimits]);

  const canCreateChurch = checkResourceLimit('churches').allowed;
  const canCreateMinistry = checkResourceLimit('ministries').allowed;
  const canInviteCollaborator = checkResourceLimit('collaborators').allowed;

  return {
    // Data
    tier: subscriptionData.tier,
    usage: subscriptionData.usage,
    loading: subscriptionData.loading,
    error: subscriptionData.error,
    
    // Functions
    checkResourceLimit,
    checkMultipleResourceLimits,
    getResourceUsagePercentage,
    getResourceWarningLevel,
    getResourceUpgradeInfo,
    getTierInfo,
    refreshUsage: fetchUsage,
    
    // Computed values
    isAtAnyLimit: isAtAnyLimit(),
    canCreateChurch,
    canCreateMinistry,
    canInviteCollaborator,
  };
}

/**
 * Simple hook for checking a single resource limit
 */
export function useResourceLimit(resource: keyof UsageStats, options: { tier?: SubscriptionTier } = {}) {
  const {
    checkResourceLimit,
    getResourceUsagePercentage,
    getResourceWarningLevel,
    getResourceUpgradeInfo,
    loading,
    error,
    tier: currentTier,
    usage,
  } = useSubscriptionLimits();

  // Use override tier if provided
  const tierToUse = options.tier || currentTier;
  
  const limitCheck = options.tier 
    ? checkLimit(tierToUse, usage, resource)
    : checkResourceLimit(resource);
  const usagePercentage = options.tier
    ? getUsagePercentage(tierToUse, usage, resource)
    : getResourceUsagePercentage(resource);
  const warningLevel = getUsageWarningLevel(usagePercentage);
  const upgradeInfo = getResourceUpgradeInfo(resource);

  return {
    allowed: limitCheck.allowed,
    current: limitCheck.current,
    limit: limitCheck.limit,
    message: limitCheck.message,
    percentage: usagePercentage,
    warningLevel,
    upgradeInfo,
    loading,
    error,
  };
}

/**
 * Hook for getting subscription usage data
 */
export function useSubscriptionUsage(options: { enabled?: boolean } = {}) {
  const { tier, usage, loading, error, refreshUsage } = useSubscriptionLimits();
  
  if (options.enabled === false) {
    return {
      usage: null,
      tier: 'free' as SubscriptionTier,
      loading: false,
      error: null,
      refetch: async () => {},
    };
  }

  return {
    usage,
    tier,
    loading,
    error,
    refetch: refreshUsage,
  };
}

/**
 * Hook for checking multiple resource limits
 */
export function useMultipleResourceLimits(
  resources: (keyof UsageStats)[], 
  options: { tier?: SubscriptionTier } = {}
) {
  const { checkMultipleResourceLimits, tier: currentTier, usage, loading, error } = useSubscriptionLimits();
  
  const tierToUse = options.tier || currentTier;
  
  const limits = options.tier
    ? checkMultipleLimits(tierToUse, usage, resources)
    : checkMultipleResourceLimits(resources);

  const allAllowed = resources.length === 0 || Object.values(limits).every(limit => limit.allowed);
  const atLimits = resources.filter(resource => limits[resource] && !limits[resource].allowed);
  const approachingLimits = resources.filter(resource => {
    const limit = limits[resource];
    if (!limit || limit.limit === -1) return false;
    const percentage = (limit.current / limit.limit) * 100;
    return percentage >= 80 && percentage < 100;
  });

  return {
    limits,
    allAllowed,
    atLimits,
    approachingLimits,
    loading,
    error,
  };
}

/**
 * Hook for creating upgrade prompts
 */
export function useUpgradePrompt() {
  const { tier, getResourceUpgradeInfo } = useSubscriptionLimits();

  const showUpgradePrompt = useCallback((resource: keyof UsageStats) => {
    const upgradeInfo = getResourceUpgradeInfo(resource);
    
    // This would typically show a modal or redirect to billing
    // For now, we'll just return the upgrade information
    return {
      show: true,
      currentTier: tier,
      ...upgradeInfo,
    };
  }, [tier, getResourceUpgradeInfo]);

  return {
    showUpgradePrompt,
    currentTier: tier,
  };
}