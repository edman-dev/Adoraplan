import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { ministriesSchema as ministryTable, churchesSchema as churchTable } from '@/models/WorshipSchema';
import { withWorshipAuth } from '@/middleware/worship-auth';
import { eq, and, count, isNull } from 'drizzle-orm';
import { checkLimit, type SubscriptionTier } from '@/libs/worship/SubscriptionLimits';

// Mock function to get subscription tier
function getOrganizationTier(organizationId: string): SubscriptionTier {
  return 'free';
}

/**
 * Check if organization can create more ministries based on their subscription tier
 */
async function checkMinistryCreationLimit(organizationId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const tier = getOrganizationTier(organizationId);
    
    // Count current ministries across all churches in the organization
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

    const limitCheck = checkLimit(tier, { 
      churches: 0, 
      ministries: ministryCount.count, 
      collaborators: 0, 
      services: 0 
    }, 'ministries');

    return {
      allowed: limitCheck.allowed,
      message: limitCheck.message,
    };
  } catch (error) {
    console.error('Failed to check ministry creation limit:', error);
    return { allowed: true };
  }
}

/**
 * GET /api/worship/ministries
 * Get all ministries for the current organization, optionally filtered by church
 */
async function handleGetMinistries(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const churchId = searchParams.get('churchId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let ministries;
    
    if (churchId) {
      // Get ministries for specific church
      ministries = await db
        .select({
          id: ministryTable.id,
          churchId: ministryTable.churchId,
          name: ministryTable.name,
          description: ministryTable.description,
          color: ministryTable.color,
          icon: ministryTable.icon,
          isActive: ministryTable.isActive,
          createdAt: ministryTable.createdAt,
          updatedAt: ministryTable.updatedAt,
          church: {
            id: churchTable.id,
            name: churchTable.name,
          },
        })
        .from(ministryTable)
        .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
        .where(and(
          eq(churchTable.organizationId, organizationId),
          eq(ministryTable.churchId, parseInt(churchId)),
          eq(ministryTable.isActive, true)
        ))
        .orderBy(ministryTable.name);
    } else {
      // Get all ministries for organization
      ministries = await db
        .select({
          id: ministryTable.id,
          churchId: ministryTable.churchId,
          name: ministryTable.name,
          description: ministryTable.description,
          color: ministryTable.color,
          icon: ministryTable.icon,
          isActive: ministryTable.isActive,
          createdAt: ministryTable.createdAt,
          updatedAt: ministryTable.updatedAt,
          church: {
            id: churchTable.id,
            name: churchTable.name,
          },
        })
        .from(ministryTable)
        .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
        .where(and(
          eq(churchTable.organizationId, organizationId),
          eq(ministryTable.isActive, true)
        ))
        .orderBy(churchTable.name, ministryTable.name);
    }

    return NextResponse.json({
      success: true,
      data: ministries,
    });
  } catch (error) {
    console.error('Failed to get ministries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve ministries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worship/ministries
 * Create a new ministry
 */
async function handleCreateMinistry(request: NextRequest, { user, organization }: { user: any; organization: any }) {
  try {
    const body = await request.json();
    const { organizationId, churchId, name, description, color, icon } = body;

    if (!organizationId || !churchId || !name) {
      return NextResponse.json(
        { error: 'Organization ID, church ID, and name are required' },
        { status: 400 }
      );
    }

    // Check subscription limits before creating
    const limitCheck = await checkMinistryCreationLimit(organizationId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Subscription limit reached',
          message: limitCheck.message,
          code: 'LIMIT_EXCEEDED',
          resource: 'ministries'
        },
        { status: 402 } // Payment Required
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Ministry name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate color format (hex color)
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a valid hex color (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    // Verify church exists and belongs to organization
    const [church] = await db
      .select()
      .from(churchTable)
      .where(and(
        eq(churchTable.id, parseInt(churchId)),
        eq(churchTable.organizationId, organizationId)
      ));

    if (!church) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      );
    }

    const [newMinistry] = await db
      .insert(ministryTable)
      .values({
        churchId,
        name,
        description: description || null,
        color: color || '#6366f1', // Default indigo color
        icon: icon || 'church', // Default icon
        isActive: true,
      })
      .returning();

    // Include church information in response
    const ministryWithChurch = {
      ...newMinistry,
      church: {
        id: church.id,
        name: church.name,
      },
    };

    return NextResponse.json({
      success: true,
      data: ministryWithChurch,
    });
  } catch (error) {
    console.error('Failed to create ministry:', error);
    return NextResponse.json(
      { error: 'Failed to create ministry' },
      { status: 500 }
    );
  }
}

// Apply worship auth middleware
export const GET = withWorshipAuth(handleGetMinistries, {
  permission: 'canViewMinistries',
});

export const POST = withWorshipAuth(handleCreateMinistry, {
  permission: 'canManageMinistries',
});