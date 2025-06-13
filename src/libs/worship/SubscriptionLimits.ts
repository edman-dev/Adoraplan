export type SubscriptionTier = 'free' | 'team' | 'pro';

export interface SubscriptionLimits {
  churches: number;
  ministries: number;
  collaborators: number;
  services: number; // Unlimited for all tiers, but good to have for future use
}

export interface UsageStats {
  churches: number;
  ministries: number;
  collaborators: number;
  services: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  tier: SubscriptionTier;
  message?: string;
}

export interface UpgradeInfo {
  suggestedTier: SubscriptionTier;
  benefits: string[];
  feature: string;
}

// Define limits for each subscription tier
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    churches: 1,
    ministries: 5,
    collaborators: 5,
    services: -1, // Unlimited
  },
  team: {
    churches: 1,
    ministries: 25,
    collaborators: -1, // Unlimited
    services: -1, // Unlimited
  },
  pro: {
    churches: -1, // Unlimited
    ministries: -1, // Unlimited
    collaborators: -1, // Unlimited
    services: -1, // Unlimited
  },
};

/**
 * Check if adding a new item would exceed the current tier limits
 */
export function checkLimit(
  tier: SubscriptionTier,
  usage: UsageStats,
  resource: keyof UsageStats
): LimitCheckResult {
  const limits = SUBSCRIPTION_LIMITS[tier];
  const limit = limits[resource];
  const current = usage[resource];

  // -1 means unlimited
  if (limit === -1) {
    return {
      allowed: true,
      current,
      limit: -1,
      tier,
    };
  }

  const wouldExceed = (current + 1) > limit;
  
  return {
    allowed: !wouldExceed,
    current,
    limit,
    tier,
    message: wouldExceed 
      ? `You've reached the ${resource} limit for your ${tier} plan (${current}/${limit})`
      : undefined,
  };
}

/**
 * Get upgrade suggestions when limits are reached
 */
export function getUpgradeInfo(
  currentTier: SubscriptionTier,
  resource: keyof UsageStats
): UpgradeInfo {
  const resourceNames = {
    churches: 'church',
    ministries: 'ministry',
    collaborators: 'collaborator',
    services: 'service',
  };

  const resourceName = resourceNames[resource];

  if (currentTier === 'free') {
    if (resource === 'churches') {
      return {
        suggestedTier: 'pro',
        benefits: [
          'Unlimited churches',
          'Unlimited ministries',
          'Unlimited collaborators',
          'Advanced analytics',
          'Priority support',
        ],
        feature: `multiple ${resourceName}s`,
      };
    } else if (resource === 'ministries') {
      return {
        suggestedTier: 'team',
        benefits: [
          'Up to 25 ministries',
          'Unlimited collaborators',
          'Advanced scheduling',
          'Email notifications',
        ],
        feature: `more ${resourceName}s`,
      };
    } else if (resource === 'collaborators') {
      return {
        suggestedTier: 'team',
        benefits: [
          'Unlimited collaborators',
          'Up to 25 ministries',
          'Advanced scheduling',
          'Email notifications',
        ],
        feature: `more ${resourceName}s`,
      };
    }
  }

  if (currentTier === 'team') {
    return {
      suggestedTier: 'pro',
      benefits: [
        'Unlimited churches',
        'Unlimited ministries', 
        'Unlimited collaborators',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
      ],
      feature: `unlimited ${resourceName}s`,
    };
  }

  // Fallback for pro tier (shouldn't happen)
  return {
    suggestedTier: 'pro',
    benefits: ['You already have the highest tier!'],
    feature: resourceName,
  };
}

/**
 * Check if a tier upgrade would solve the current limitation
 */
export function wouldTierSolveLimit(
  targetTier: SubscriptionTier,
  usage: UsageStats,
  resource: keyof UsageStats
): boolean {
  const targetLimits = SUBSCRIPTION_LIMITS[targetTier];
  const targetLimit = targetLimits[resource];
  const current = usage[resource];

  // -1 means unlimited, so it would definitely solve the limit
  if (targetLimit === -1) {
    return true;
  }

  // Check if the new limit would accommodate current usage + 1 (for the new item)
  return (current + 1) <= targetLimit;
}

/**
 * Get a user-friendly description of tier limits
 */
export function getTierDescription(tier: SubscriptionTier): string {
  const limits = SUBSCRIPTION_LIMITS[tier];
  
  const formatLimit = (limit: number) => limit === -1 ? 'Unlimited' : limit.toString();
  
  return `${formatLimit(limits.churches)} ${limits.churches === 1 ? 'church' : 'churches'}, ` +
         `${formatLimit(limits.ministries)} ${limits.ministries === 1 ? 'ministry' : 'ministries'}, ` +
         `${formatLimit(limits.collaborators)} collaborators`;
}

/**
 * Calculate usage percentages for progress bars
 */
export function getUsagePercentage(
  tier: SubscriptionTier,
  usage: UsageStats,
  resource: keyof UsageStats
): number {
  const limits = SUBSCRIPTION_LIMITS[tier];
  const limit = limits[resource];
  const current = usage[resource];

  // Unlimited resources show as 0% (no limit to track)
  if (limit === -1) {
    return 0;
  }

  return Math.min((current / limit) * 100, 100);
}

/**
 * Get warning level based on usage percentage
 */
export function getUsageWarningLevel(percentage: number): 'safe' | 'warning' | 'danger' {
  if (percentage >= 100) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'safe';
}

/**
 * Check multiple resources at once
 */
export function checkMultipleLimits(
  tier: SubscriptionTier,
  usage: UsageStats,
  resources: (keyof UsageStats)[]
): Record<keyof UsageStats, LimitCheckResult> {
  const results: Partial<Record<keyof UsageStats, LimitCheckResult>> = {};
  
  for (const resource of resources) {
    results[resource] = checkLimit(tier, usage, resource);
  }
  
  return results as Record<keyof UsageStats, LimitCheckResult>;
}

/**
 * Check if current usage fits within a tier (without adding new items)
 */
function checkTierFitsUsage(tier: SubscriptionTier, usage: UsageStats): boolean {
  const limits = SUBSCRIPTION_LIMITS[tier];
  
  return Object.entries(usage).every(([resource, current]) => {
    const limit = limits[resource as keyof UsageStats];
    return limit === -1 || current <= limit;
  });
}

/**
 * Get the next tier that would accommodate the current usage
 */
export function getRecommendedTier(usage: UsageStats): SubscriptionTier {
  // Check if free tier can handle the current usage
  if (checkTierFitsUsage('free', usage)) {
    return 'free';
  }

  // Check if team tier can handle the current usage
  if (checkTierFitsUsage('team', usage)) {
    return 'team';
  }

  // Otherwise, recommend pro
  return 'pro';
}