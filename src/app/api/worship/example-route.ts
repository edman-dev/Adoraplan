import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withWorshipAuth } from '@/middleware/worship-auth';

// Example: API route that requires church management permission
async function handleChurchAPI(_request: NextRequest) {
  // This handler will only be called if user has 'canManageChurch' permission
  try {
    const churches = []; // Your church fetching logic here

    return NextResponse.json({
      success: true,
      data: churches,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch churches' },
      { status: 500 },
    );
  }
}

// Wrap the handler with worship auth middleware
export const GET = withWorshipAuth(handleChurchAPI, {
  permission: 'canManageChurch',
});

// Example: API route that requires admin role
async function handleAdminAPI(_request: NextRequest) {
  // This handler will only be called if user has 'admin' role or higher
  try {
    const adminData = {}; // Your admin data logic here

    return NextResponse.json({
      success: true,
      data: adminData,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 },
    );
  }
}

// Wrap the handler with minimum role requirement
export const POST = withWorshipAuth(handleAdminAPI, {
  minimumRole: 'admin',
});

// Example: Public API route with optional auth
async function handlePublicAPI(request: NextRequest) {
  // This handler can be called by anyone, but you can check auth inside
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Your public data logic here
    const publicData = { query };

    return NextResponse.json({
      success: true,
      data: publicData,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch public data' },
      { status: 500 },
    );
  }
}

// No auth wrapper for public routes
export const PUT = handlePublicAPI;
