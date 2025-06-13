import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { servicesSchema as serviceTable } from '@/models/WorshipSchema';
import { eq, and } from 'drizzle-orm';
import { withWorshipAuth } from '@/middleware/worship-auth';

// GET /api/worship/services/[serviceId] - Get a specific service
async function handleGetService(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const { serviceId } = params;

    if (!serviceId || isNaN(parseInt(serviceId))) {
      return NextResponse.json(
        { error: 'Valid serviceId is required' },
        { status: 400 }
      );
    }

    const [service] = await db
      .select()
      .from(serviceTable)
      .where(and(
        eq(serviceTable.id, parseInt(serviceId)),
        eq(serviceTable.isActive, true)
      ))
      .limit(1);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Failed to fetch service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PATCH /api/worship/services/[serviceId] - Update a service
async function handleUpdateService(
  request: NextRequest,
  { params, user }: { params: { serviceId: string }; user: any }
) {
  try {
    const { serviceId } = params;
    const body = await request.json();
    const { name, description, defaultDuration } = body;

    if (!serviceId || isNaN(parseInt(serviceId))) {
      return NextResponse.json(
        { error: 'Valid serviceId is required' },
        { status: 400 }
      );
    }

    // Validate defaultDuration if provided
    if (defaultDuration && (typeof defaultDuration !== 'number' || defaultDuration <= 0)) {
      return NextResponse.json(
        { error: 'defaultDuration must be a positive number' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (defaultDuration !== undefined) updateData.defaultDuration = defaultDuration;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update the service
    const [updatedService] = await db
      .update(serviceTable)
      .set(updateData)
      .where(eq(serviceTable.id, parseInt(serviceId)))
      .returning();

    if (!updatedService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedService,
      message: 'Service updated successfully',
    });
  } catch (error) {
    console.error('Failed to update service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE /api/worship/services/[serviceId] - Delete a service (soft delete)
async function handleDeleteService(
  request: NextRequest,
  { params, user }: { params: { serviceId: string }; user: any }
) {
  try {
    const { serviceId } = params;

    if (!serviceId || isNaN(parseInt(serviceId))) {
      return NextResponse.json(
        { error: 'Valid serviceId is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const [deletedService] = await db
      .update(serviceTable)
      .set({ isActive: false })
      .where(eq(serviceTable.id, parseInt(serviceId)))
      .returning();

    if (!deletedService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with authentication
export const GET = withWorshipAuth(handleGetService, {
  minimumRole: 'member',
});

export const PATCH = withWorshipAuth(handleUpdateService, {
  minimumRole: 'worship_leader',
});

export const DELETE = withWorshipAuth(handleDeleteService, {
  minimumRole: 'worship_leader',
});