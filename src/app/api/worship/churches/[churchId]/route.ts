import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { churchesSchema as churchTable, ministriesSchema as ministryTable } from '@/models/WorshipSchema';
import { withWorshipAuth } from '@/middleware/worship-auth';
import { eq, and } from 'drizzle-orm';

type RouteParams = {
  params: {
    churchId: string;
  };
};

/**
 * GET /api/worship/churches/[churchId]
 * Get a specific church by ID
 */
async function handleGetChurch(request: NextRequest, { params }: RouteParams) {
  try {
    const { churchId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      data: church,
    });
  } catch (error) {
    console.error('Failed to get church:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve church' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/worship/churches/[churchId]
 * Update a church
 */
async function handleUpdateChurch(request: NextRequest, { params }: RouteParams) {
  try {
    const { churchId } = params;
    const body = await request.json();
    const { organizationId, name, address, description, contactEmail, contactPhone } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name && (name.length < 2 || name.length > 100)) {
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

    // Check if church exists and belongs to organization
    const [existingChurch] = await db
      .select()
      .from(churchTable)
      .where(and(
        eq(churchTable.id, parseInt(churchId)),
        eq(churchTable.organizationId, organizationId)
      ));

    if (!existingChurch) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof churchTable.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;

    const [updatedChurch] = await db
      .update(churchTable)
      .set(updateData)
      .where(and(
        eq(churchTable.id, parseInt(churchId)),
        eq(churchTable.organizationId, organizationId)
      ))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedChurch,
    });
  } catch (error) {
    console.error('Failed to update church:', error);
    return NextResponse.json(
      { error: 'Failed to update church' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/worship/churches/[churchId]
 * Delete a church (soft delete by setting deletedAt)
 */
async function handleDeleteChurch(request: NextRequest, { params }: RouteParams) {
  try {
    const { churchId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if church exists and belongs to organization
    const [existingChurch] = await db
      .select()
      .from(churchTable)
      .where(and(
        eq(churchTable.id, parseInt(churchId)),
        eq(churchTable.organizationId, organizationId)
      ));

    if (!existingChurch) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      );
    }

    // Check if church has any ministries
    const ministries = await db
      .select()
      .from(ministryTable)
      .where(eq(ministryTable.churchId, churchId));

    if (ministries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete church with existing ministries. Please delete all ministries first.' },
        { status: 400 }
      );
    }

    // Soft delete the church
    await db
      .update(churchTable)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(churchTable.id, parseInt(churchId)),
        eq(churchTable.organizationId, organizationId)
      ));

    return NextResponse.json({
      success: true,
      message: 'Church deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete church:', error);
    return NextResponse.json(
      { error: 'Failed to delete church' },
      { status: 500 }
    );
  }
}

// Apply worship auth middleware
export const GET = withWorshipAuth(handleGetChurch, {
  permission: 'canViewChurches',
});

export const PATCH = withWorshipAuth(handleUpdateChurch, {
  permission: 'canManageChurches',
});

export const DELETE = withWorshipAuth(handleDeleteChurch, {
  permission: 'canManageChurches',
});