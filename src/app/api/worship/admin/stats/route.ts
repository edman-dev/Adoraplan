import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { 
  churchesSchema as churchTable,
  ministriesSchema as ministryTable, 
  servicesSchema as serviceTable,
  eventsSchema as eventTable,
  usersSchema as userTable
} from '@/models/WorshipSchema';
import { withWorshipAuth } from '@/middleware/worship-auth';
import { eq, and, count, gte, lte, isNull, desc } from 'drizzle-orm';

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

/**
 * Calculate date ranges based on the selected period
 */
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

/**
 * GET /api/worship/admin/stats
 * Get comprehensive organizational statistics for admin dashboard
 */
async function handleGetOrganizationalStats(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const period = searchParams.get('period') || '30d';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const { startDate, endDate } = getDateRange(period);

    // Get church statistics
    const [churchStats] = await db
      .select({
        total: count(),
      })
      .from(churchTable)
      .where(and(
        eq(churchTable.organizationId, organizationId),
        isNull(churchTable.deletedAt)
      ));

    const [activeChurches] = await db
      .select({
        count: count(),
      })
      .from(churchTable)
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ));

    const churches = {
      total: churchStats.total,
      active: activeChurches.count,
      inactive: churchStats.total - activeChurches.count,
    };

    // Get ministry statistics
    const [ministryStats] = await db
      .select({
        total: count(),
      })
      .from(ministryTable)
      .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ));

    const [activeMinistries] = await db
      .select({
        count: count(),
      })
      .from(ministryTable)
      .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(ministryTable.isActive, true),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ));

    // Get ministry distribution by church
    const ministriesByChurch = await db
      .select({
        churchName: churchTable.name,
        count: count(ministryTable.id),
      })
      .from(churchTable)
      .leftJoin(ministryTable, and(
        eq(ministryTable.churchId, churchTable.id),
        eq(ministryTable.isActive, true)
      ))
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ))
      .groupBy(churchTable.id, churchTable.name)
      .orderBy(churchTable.name);

    const ministries = {
      total: ministryStats.total,
      active: activeMinistries.count,
      byChurch: ministriesByChurch,
    };

    // Get service statistics (mock data since we don't have events table yet)
    const [serviceStats] = await db
      .select({
        total: count(),
      })
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

    // Get service types distribution
    const servicesByType = await db
      .select({
        type: serviceTable.name,
        count: count(),
      })
      .from(serviceTable)
      .innerJoin(ministryTable, eq(serviceTable.ministryId, ministryTable.id))
      .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(serviceTable.isActive, true),
        eq(ministryTable.isActive, true),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ))
      .groupBy(serviceTable.name)
      .orderBy(desc(count()))
      .limit(5);

    const services = {
      total: serviceStats.total,
      upcoming: Math.floor(serviceStats.total * 0.3), // Mock: 30% are upcoming
      thisWeek: Math.floor(serviceStats.total * 0.15), // Mock: 15% are this week
      byType: servicesByType,
    };

    // Get user statistics (this would need to be implemented based on your user role system)
    // For now, providing mock data structure
    const users = {
      totalCollaborators: 5, // This would come from your user role management
      byRole: [
        { role: 'admin', count: 1 },
        { role: 'pastor', count: 1 },
        { role: 'worship_leader', count: 2 },
        { role: 'collaborator', count: 1 },
      ],
      recentActivity: [], // This would come from an activity log table
    };

    const stats: OrganizationalStats = {
      churches,
      ministries,
      services,
      users,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get organizational stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve organizational statistics' },
      { status: 500 }
    );
  }
}

// Apply worship auth middleware - only admins should access this
export const GET = withWorshipAuth(handleGetOrganizationalStats, {
  minimumRole: 'admin',
});