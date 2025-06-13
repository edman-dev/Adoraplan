import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { ministriesSchema as ministryTable, churchesSchema as churchTable, servicesSchema as serviceTable } from '@/models/WorshipSchema';
import { withWorshipAuth } from '@/middleware/worship-auth';
import { eq, and } from 'drizzle-orm';

type RouteParams = {
  params: {
    ministryId: string;
  };
};

/**
 * GET /api/worship/ministries/[ministryId]
 * Get a specific ministry by ID
 */
async function handleGetMinistry(request: NextRequest, { params }: RouteParams) {
  try {
    const { ministryId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const [ministry] = await db
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
        eq(ministryTable.id, parseInt(ministryId)),
        eq(churchTable.organizationId, organizationId)
      ));

    if (!ministry) {
      return NextResponse.json(
        { error: 'Ministry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ministry,
    });
  } catch (error) {
    console.error('Failed to get ministry:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve ministry' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/worship/ministries/[ministryId]
 * Update a ministry
 */
async function handleUpdateMinistry(request: NextRequest, { params }: RouteParams) {
  try {
    const { ministryId } = params;
    const body = await request.json();
    const { organizationId, name, description, color, icon, isActive } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name && (name.length < 2 || name.length > 100)) {
      return NextResponse.json(
        { error: 'Ministry name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a valid hex color (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    // Check if ministry exists and belongs to organization
    const [existingMinistry] = await db
      .select({
        id: ministryTable.id,
        churchId: ministryTable.churchId,
        church: {
          id: churchTable.id,
          name: churchTable.name,
          organizationId: churchTable.organizationId,
        },
      })
      .from(ministryTable)
      .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
      .where(and(
        eq(ministryTable.id, parseInt(ministryId)),
        eq(churchTable.organizationId, organizationId)
      ));

    if (!existingMinistry) {
      return NextResponse.json(
        { error: 'Ministry not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof ministryTable.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedMinistry] = await db
      .update(ministryTable)
      .set(updateData)
      .where(eq(ministryTable.id, ministryId))
      .returning();

    // Include church information in response
    const ministryWithChurch = {
      ...updatedMinistry,
      church: existingMinistry.church,
    };

    return NextResponse.json({
      success: true,
      data: ministryWithChurch,
    });
  } catch (error) {
    console.error('Failed to update ministry:', error);
    return NextResponse.json(
      { error: 'Failed to update ministry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/worship/ministries/[ministryId]
 * Delete a ministry (soft delete by setting isActive to false)
 */
async function handleDeleteMinistry(request: NextRequest, { params }: RouteParams) {
  try {
    const { ministryId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if ministry exists and belongs to organization
    const [existingMinistry] = await db
      .select()
      .from(ministryTable)
      .innerJoin(churchTable, eq(ministryTable.churchId, churchTable.id))
      .where(and(
        eq(ministryTable.id, parseInt(ministryId)),
        eq(churchTable.organizationId, organizationId)
      ));

    if (!existingMinistry) {
      return NextResponse.json(
        { error: 'Ministry not found' },
        { status: 404 }
      );
    }

    // Check if ministry has any services
    const services = await db
      .select()
      .from(serviceTable)
      .where(eq(serviceTable.ministryId, parseInt(ministryId)));

    if (services.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ministry with existing services. Please delete all services first.' },
        { status: 400 }
      );
    }

    // Soft delete the ministry
    await db
      .update(ministryTable)
      .set({ isActive: false })
      .where(eq(ministryTable.id, parseInt(ministryId)));

    return NextResponse.json({
      success: true,
      message: 'Ministry deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete ministry:', error);
    return NextResponse.json(
      { error: 'Failed to delete ministry' },
      { status: 500 }
    );
  }
}

// Apply worship auth middleware
export const GET = withWorshipAuth(handleGetMinistry, {
  permission: 'canViewMinistries',
});

export const PATCH = withWorshipAuth(handleUpdateMinistry, {
  permission: 'canManageMinistries',
});

export const DELETE = withWorshipAuth(handleDeleteMinistry, {
  permission: 'canManageMinistries',
});