import { describe, it, expect } from 'vitest';
import {
  checkLimit,
  getUpgradeInfo,
  wouldTierSolveLimit,
  getTierDescription,
  getUsagePercentage,
  getUsageWarningLevel,
  checkMultipleLimits,
  getRecommendedTier,
  SUBSCRIPTION_LIMITS,
  type UsageStats,
} from './SubscriptionLimits';

describe('SubscriptionLimits', () => {
  const mockUsage: UsageStats = {
    churches: 0, // Under limit so we can add one more
    ministries: 3, // Under limit so we can add one more  
    collaborators: 2, // Under limit so we can add one more
    services: 10,
  };

  describe('SUBSCRIPTION_LIMITS', () => {
    it('defines correct limits for each tier', () => {
      expect(SUBSCRIPTION_LIMITS.free).toEqual({
        churches: 1,
        ministries: 5,
        collaborators: 5,
        services: -1,
      });

      expect(SUBSCRIPTION_LIMITS.team).toEqual({
        churches: 1,
        ministries: 25,
        collaborators: -1,
        services: -1,
      });

      expect(SUBSCRIPTION_LIMITS.pro).toEqual({
        churches: -1,
        ministries: -1,
        collaborators: -1,
        services: -1,
      });
    });
  });

  describe('checkLimit', () => {
    it('allows creation when under limit', () => {
      const result = checkLimit('free', mockUsage, 'ministries');
      
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.tier).toBe('free');
      expect(result.message).toBeUndefined();
    });

    it('blocks creation when at limit', () => {
      const atLimitUsage: UsageStats = {
        churches: 1,
        ministries: 5,
        collaborators: 2,
        services: 10,
      };

      const result = checkLimit('free', atLimitUsage, 'ministries');
      
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(5);
      expect(result.message).toContain('reached the ministries limit');
    });

    it('allows unlimited resources', () => {
      const result = checkLimit('pro', mockUsage, 'churches');
      
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });

    it('allows creation for team tier with unlimited collaborators', () => {
      const highUsage: UsageStats = {
        churches: 1,
        ministries: 10,
        collaborators: 100,
        services: 50,
      };

      const result = checkLimit('team', highUsage, 'collaborators');
      
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });
  });

  describe('getUpgradeInfo', () => {
    it('suggests team tier for free tier ministry limit', () => {
      const upgrade = getUpgradeInfo('free', 'ministries');
      
      expect(upgrade.suggestedTier).toBe('team');
      expect(upgrade.benefits).toContain('Up to 25 ministries');
      expect(upgrade.feature).toBe('more ministrys');
    });

    it('suggests pro tier for free tier church limit', () => {
      const upgrade = getUpgradeInfo('free', 'churches');
      
      expect(upgrade.suggestedTier).toBe('pro');
      expect(upgrade.benefits).toContain('Unlimited churches');
      expect(upgrade.feature).toBe('multiple churchs');
    });

    it('suggests pro tier for team tier limits', () => {
      const upgrade = getUpgradeInfo('team', 'churches');
      
      expect(upgrade.suggestedTier).toBe('pro');
      expect(upgrade.benefits).toContain('Unlimited churches');
    });
  });

  describe('wouldTierSolveLimit', () => {
    it('returns true when tier would solve the limit', () => {
      const usage: UsageStats = {
        churches: 1,
        ministries: 5, // At free tier limit
        collaborators: 3,
        services: 10,
      };

      expect(wouldTierSolveLimit('team', usage, 'ministries')).toBe(true);
    });

    it('returns true for unlimited resources', () => {
      const usage: UsageStats = {
        churches: 10,
        ministries: 100,
        collaborators: 1000,
        services: 500,
      };

      expect(wouldTierSolveLimit('pro', usage, 'churches')).toBe(true);
    });

    it('returns false when tier would not solve the limit', () => {
      const usage: UsageStats = {
        churches: 1,
        ministries: 30, // Exceeds team limit of 25
        collaborators: 3,
        services: 10,
      };

      expect(wouldTierSolveLimit('team', usage, 'ministries')).toBe(false);
    });
  });

  describe('getTierDescription', () => {
    it('describes free tier correctly', () => {
      const description = getTierDescription('free');
      expect(description).toBe('1 church, 5 ministries, 5 collaborators');
    });

    it('describes team tier correctly', () => {
      const description = getTierDescription('team');
      expect(description).toBe('1 church, 25 ministries, Unlimited collaborators');
    });

    it('describes pro tier correctly', () => {
      const description = getTierDescription('pro');
      expect(description).toBe('Unlimited churches, Unlimited ministries, Unlimited collaborators');
    });
  });

  describe('getUsagePercentage', () => {
    it('calculates percentage correctly for limited resources', () => {
      const usage: UsageStats = {
        churches: 1,
        ministries: 2,
        collaborators: 1,
        services: 10,
      };

      expect(getUsagePercentage('free', usage, 'ministries')).toBe(40); // 2/5 = 40%
      expect(getUsagePercentage('free', usage, 'collaborators')).toBe(20); // 1/5 = 20%
    });

    it('returns 0 for unlimited resources', () => {
      expect(getUsagePercentage('pro', mockUsage, 'churches')).toBe(0);
    });

    it('caps at 100% for over-limit usage', () => {
      const overLimitUsage: UsageStats = {
        churches: 1,
        ministries: 10, // Over free limit of 5
        collaborators: 1,
        services: 10,
      };

      expect(getUsagePercentage('free', overLimitUsage, 'ministries')).toBe(100);
    });
  });

  describe('getUsageWarningLevel', () => {
    it('returns safe for low usage', () => {
      expect(getUsageWarningLevel(50)).toBe('safe');
      expect(getUsageWarningLevel(79)).toBe('safe');
    });

    it('returns warning for high usage', () => {
      expect(getUsageWarningLevel(80)).toBe('warning');
      expect(getUsageWarningLevel(95)).toBe('warning');
    });

    it('returns danger for at or over limit', () => {
      expect(getUsageWarningLevel(100)).toBe('danger');
      expect(getUsageWarningLevel(105)).toBe('danger');
    });
  });

  describe('checkMultipleLimits', () => {
    it('checks multiple resources at once', () => {
      const results = checkMultipleLimits('free', mockUsage, ['churches', 'ministries', 'collaborators']);
      
      expect(results.churches.allowed).toBe(true);
      expect(results.ministries.allowed).toBe(true);
      expect(results.collaborators.allowed).toBe(true);
    });

    it('identifies when multiple resources are at limit', () => {
      const atLimitUsage: UsageStats = {
        churches: 1,
        ministries: 5,
        collaborators: 5,
        services: 10,
      };

      const results = checkMultipleLimits('free', atLimitUsage, ['ministries', 'collaborators']);
      
      expect(results.ministries.allowed).toBe(false);
      expect(results.collaborators.allowed).toBe(false);
    });
  });

  describe('getRecommendedTier', () => {
    it('recommends free tier for low usage', () => {
      const lowUsage: UsageStats = {
        churches: 1,
        ministries: 2,
        collaborators: 3,
        services: 5,
      };

      expect(getRecommendedTier(lowUsage)).toBe('free');
    });

    it('recommends team tier for medium usage', () => {
      const mediumUsage: UsageStats = {
        churches: 1,
        ministries: 10, // Over free limit
        collaborators: 3,
        services: 15,
      };

      expect(getRecommendedTier(mediumUsage)).toBe('team');
    });

    it('recommends pro tier for high usage', () => {
      const highUsage: UsageStats = {
        churches: 5, // Over free and team limit
        ministries: 30,
        collaborators: 100,
        services: 200,
      };

      expect(getRecommendedTier(highUsage)).toBe('pro');
    });

    it('recommends team tier when only collaborators exceed free limit', () => {
      const collaboratorHeavyUsage: UsageStats = {
        churches: 1,
        ministries: 3,
        collaborators: 10, // Over free limit
        services: 5,
      };

      expect(getRecommendedTier(collaboratorHeavyUsage)).toBe('team');
    });
  });
});