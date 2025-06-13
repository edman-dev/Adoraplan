import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { churchesSchema as churchTable, subscriptionUsageSchema as usageTable } from '@/models/WorshipSchema';
import { withWorshipAuth } from '@/middleware/worship-auth';
import { eq, count, and, isNull } from 'drizzle-orm';
import { checkLimit, type SubscriptionTier } from '@/libs/worship/SubscriptionLimits';

// Mock function to get subscription tier - in real implementation, this would
// integrate with Stripe or your billing system
function getOrganizationTier(organizationId: string): SubscriptionTier {
  // For now, return 'free' as default
  // In a real implementation, you'd query your billing system
  return 'free';
}

/**
 * Check if organization can create more churches based on their subscription tier
 */
async function checkChurchCreationLimit(organizationId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    // Get current subscription tier
    const tier = getOrganizationTier(organizationId);
    
    // Count current churches
    const [churchCount] = await db
      .select({ count: count() })
      .from(churchTable)
      .where(and(
        eq(churchTable.organizationId, organizationId),
        eq(churchTable.isActive, true),
        isNull(churchTable.deletedAt)
      ));

    // Check limit
    const limitCheck = checkLimit(tier, { 
      churches: churchCount.count, 
      ministries: 0, 
      collaborators: 0, 
      services: 0 
    }, 'churches');

    return {
      allowed: limitCheck.allowed,
      message: limitCheck.message,
    };
  } catch (error) {
    console.error('Failed to check church creation limit:', error);
    // Allow creation if we can't check limits (graceful degradation)
    return { allowed: true };
  }
}

/**
 * GET /api/worship/churches
 * Get all churches for the current organization
 */
async function handleGetChurches(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const churches = await db
      .select()
      .from(churchTable)
      .where(eq(churchTable.organizationId, organizationId))
      .orderBy(churchTable.name);

    return NextResponse.json({
      success: true,
      data: churches,
    });
  } catch (error) {
    console.error('Failed to get churches:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve churches' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worship/churches
 * Create a new church
 */
async function handleCreateChurch(request: NextRequest, { user, organization }: { user: any; organization: any }) {
  try {
    const body = await request.json();
    const { organizationId, name, address, description, contactEmail, contactPhone } = body;

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      );
    }

    // Check subscription limits before creating
    const limitCheck = await checkChurchCreationLimit(organizationId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Subscription limit reached',
          message: limitCheck.message,
          code: 'LIMIT_EXCEEDED',
          resource: 'churches'
        },
        { status: 402 } // Payment Required
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Church name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        );
      }
    }

    const [newChurch] = await db
      .insert(churchTable)
      .values({
        organizationId,
        name,
        address: address || null,
        description: description || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newChurch,
    });
  } catch (error) {
    console.error('Failed to create church:', error);
    return NextResponse.json(
      { error: 'Failed to create church' },
      { status: 500 }
    );
  }
}

// Apply worship auth middleware
export const GET = withWorshipAuth(handleGetChurches, {
  permission: 'canViewChurches',
});

export const POST = withWorshipAuth(handleCreateChurch, {
  permission: 'canManageChurches',
});