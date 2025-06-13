import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import { createWorshipRoleMetadata, mergeWorshipRoleMetadata, type WorshipUserMetadata } from '@/lib/worship-role-utils';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

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

    console.log(`Bootstrapping admin role for user ${userId} (${email}) in org ${organizationId}`);

    // Get user to check current metadata
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as WorshipUserMetadata;

    console.log('Current user metadata:', currentMetadata);

    // Create new worship role metadata
    const newRoleData = createWorshipRoleMetadata(organizationId, 'admin', 'system-bootstrap');
    
    // Merge with existing metadata
    const updatedMetadata = mergeWorshipRoleMetadata(currentMetadata, newRoleData);

    console.log('Updated metadata:', updatedMetadata);

    // Update user metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata,
    });

    console.log('Successfully updated user metadata');

    return NextResponse.json({
      success: true,
      message: `Admin role bootstrapped for user ${userId} (${email}) in organization ${organizationId}`,
      data: {
        userId,
        organizationId,
        role: 'admin',
        email,
        previousMetadata: currentMetadata,
        newMetadata: updatedMetadata,
      },
    });
  } catch (error) {
    console.error('Failed to bootstrap admin role:', error);
    return NextResponse.json(
      { 
        error: 'Failed to bootstrap admin role',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}