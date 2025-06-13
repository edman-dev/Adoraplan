import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { 
  churchesSchema as churchTable,
  ministriesSchema as ministryTable,
  userWorshipRolesSchema as userRoleTable,
  servicesSchema as serviceTable,
  subscriptionUsageSchema as usageTable,
} from '@/models/WorshipSchema';
import { organizationSchema } from '@/models/Schema';
import { and, eq, count, isNull } from 'drizzle-orm';
import { withWorshipAuth } from '@/middleware/worship-auth';
import type { SubscriptionTier, UsageStats } from '@/libs/worship/SubscriptionLimits';

// Mock function to get subscription tier - in real implementation, this would
// integrate with Stripe or your billing system
function getOrganizationTier(organizationId: string): SubscriptionTier {
  // For now, return 'free' as default
  // In a real implementation, you'd query your billing system:
  // - Check Stripe subscription status
  // - Look up organization's plan in your database
  // - Handle trial periods, etc.
  return 'free';
}

async function handleGetUsage(
  request: NextRequest,
  { user, organization }: { user: any; organization: any }
) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || organization.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Get current subscription tier
    const tier = getOrganizationTier(organizationId);

    // Count active churches
    const [churchCount] = await db
      .select({ count: count() })
      .from(churchTable)
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ));

    // Count active ministries across all churches in the organization
    const [ministryCount] = await db
      .select({ count: count() })
      .from(ministryTable)
      .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(ministryTable.isActive, true),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ));

    // Count active collaborators (users with worship roles in this organization)
    const [collaboratorCount] = await db
      .select({ count: count() })
      .from(userRoleTable)
      .where(and(
        eq(userRoleTable.organizationId, organizationId),
        eq(userRoleTable.isActive, true),
        isNull(userRoleTable.revokedAt)
      ));

    // Count active services across all ministries in the organization
    const [serviceCount] = await db
      .select({ count: count() })
      .from(serviceTable)
      .innerJoin(ministryTable, eq(serviceTable.ministryId, ministryTable.id))
      .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(serviceTable.isActive, true),
        eq(ministryTable.isActive, true),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ));

    const usage: UsageStats = {
      churches: churchCount.count,
      ministries: ministryCount.count,
      collaborators: collaboratorCount.count,
      services: serviceCount.count,
    };

    // Update or create usage tracking record
    try {
      await db
        .insert(usageTable)
        .values({
          organizationId,
          churchCount: usage.churches,
          ministryCount: usage.ministries,
          collaboratorCount: usage.collaborators,
          eventsThisWeek: 0, // Would be calculated from events table
          eventsThisMonth: 0, // Would be calculated from events table
          storageUsedMB: 0, // Would be calculated from audio files
        })
        .onConflictDoUpdate({
          target: usageTable.organizationId,
          set: {
            churchCount: usage.churches,
            ministryCount: usage.ministries,
            collaboratorCount: usage.collaborators,
            lastCalculatedAt: new Date(),
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      // Non-critical error - usage tracking is for analytics
      console.warn('Failed to update usage tracking:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        tier,
        usage,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch subscription usage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription usage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export with authentication - allow any authenticated user to check their org's usage
export const GET = withWorshipAuth(handleGetUsage, {
  minimumRole: 'member',
});