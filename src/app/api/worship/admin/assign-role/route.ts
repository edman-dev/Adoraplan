import { NextRequest, NextResponse } from 'next/server';
import { assignWorshipRole } from '@/lib/worship-role-management';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId, email } = body;

    // Validate required fields
    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, organizationId' },
        { status: 400 }
      );
    }

    // Assign admin role to the user
    await assignWorshipRole(userId, organizationId, 'admin', 'system-assignment');

    return NextResponse.json({
      success: true,
      message: `Admin role assigned to user ${userId} (${email}) in organization ${organizationId}`,
      data: {
        userId,
        organizationId,
        role: 'admin',
        email,
      },
    });
  } catch (error) {
    console.error('Failed to assign admin role:', error);
    return NextResponse.json(
      { 
        error: 'Failed to assign admin role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}