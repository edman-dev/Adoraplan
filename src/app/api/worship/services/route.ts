import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { servicesSchema as serviceTable } from '@/models/WorshipSchema';
import { and, eq } from 'drizzle-orm';
import { withWorshipAuth } from '@/middleware/worship-auth';

// GET /api/worship/services - List all services for a ministry
async function handleGetServices(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ministryId = searchParams.get('ministryId');

    if (!ministryId) {
      return NextResponse.json(
        { error: 'ministryId parameter is required' },
        { status: 400 }
      );
    }

    const services = await db
      .select()
      .from(serviceTable)
      .where(and(
        eq(serviceTable.ministryId, parseInt(ministryId)),
        eq(serviceTable.isActive, true)
      ))
      .orderBy(serviceTable.name);

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST /api/worship/services - Create a new service
async function handleCreateService(request: NextRequest, { user, organization }: { user: any; organization: any }) {
  try {
    const body = await request.json();
    const { ministryId, name, description, defaultDuration } = body;

    // Validate required fields
    if (!ministryId || !name) {
      return NextResponse.json(
        { error: 'ministryId and name are required' },
        { status: 400 }
      );
    }

    // Validate defaultDuration is a positive number
    if (defaultDuration && (typeof defaultDuration !== 'number' || defaultDuration <= 0)) {
      return NextResponse.json(
        { error: 'defaultDuration must be a positive number' },
        { status: 400 }
      );
    }

    // Create the service
    const [newService] = await db
      .insert(serviceTable)
      .values({
        ministryId: parseInt(ministryId),
        name,
        description: description || null,
        defaultDuration: defaultDuration || 90,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newService,
      message: 'Service created successfully',
    });
  } catch (error) {
    console.error('Failed to create service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with authentication
export const GET = withWorshipAuth(handleGetServices, {
  minimumRole: 'member',
});

export const POST = withWorshipAuth(handleCreateService, {
  minimumRole: 'collaborator',
});