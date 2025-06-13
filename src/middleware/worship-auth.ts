import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { ExtendedWorshipRole } from '@/lib/worship-role-utils';
import {
  hasWorshipPermission,
  WorshipRolePermissions,
} from '@/lib/worship-role-utils';

/**
 * Worship authentication middleware for protecting routes based on worship roles
 */

export type WorshipRoutePermission =
  | 'canViewChurches'
  | 'canManageChurches'
  | 'canCreateChurch'
  | 'canManageChurch'
  | 'canDeleteChurch'
  | 'canViewMinistries'
  | 'canManageMinistries'
  | 'canCreateMinistry'
  | 'canManageMinistry'
  | 'canDeleteMinistry'
  | 'canCreateHymn'
  | 'canEditHymn'
  | 'canApproveHymn'
  | 'canDeleteHymn'
  | 'canCreateProgram'
  | 'canEditProgram'
  | 'canApproveProgram'
  | 'canDeleteProgram'
  | 'canCreateEvent'
  | 'canEditEvent'
  | 'canDeleteEvent'
  | 'canInviteUsers'
  | 'canAssignRoles'
  | 'canRemoveUsers'
  | 'canViewAllFeedback'
  | 'canResolveFeedback'
  | 'canManageSubscription'
  | 'canViewUsageStats';

export type WorshipAuthConfig = {
  permission?: WorshipRoutePermission;
  minimumRole?: ExtendedWorshipRole;
  redirectUrl?: string;
  returnJson?: boolean;
};

/**
 * Create middleware to protect worship routes
 */
export function createWorshipAuthMiddleware(config: WorshipAuthConfig = {}) {
  return async function worshipAuthMiddleware(request: NextRequest) {
    try {
      // Get authentication data
      const { userId, orgId } = await auth();

      // Check if user is authenticated
      if (!userId) {
        if (config.returnJson) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 },
          );
        }

        const redirectUrl = config.redirectUrl || '/sign-in';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      // Check if user has an organization
      if (!orgId) {
        if (config.returnJson) {
          return NextResponse.json(
            { error: 'Organization membership required' },
            { status: 403 },
          );
        }

        const redirectUrl = config.redirectUrl || '/onboarding/organization-selection';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      // For API routes or when specific permission/role checking is needed
      if (config.permission || config.minimumRole) {
        const userRole = await getUserWorshipRole(userId, orgId);

        // Check specific permission
        if (config.permission) {
          const hasPermission = WorshipRolePermissions[config.permission](userRole);

          if (!hasPermission) {
            if (config.returnJson) {
              return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 },
              );
            }

            return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', request.url));
          }
        }

        // Check minimum role requirement
        if (config.minimumRole) {
          const hasMinimumRole = hasWorshipPermission(userRole, config.minimumRole);

          if (!hasMinimumRole) {
            if (config.returnJson) {
              return NextResponse.json(
                { error: 'Insufficient role level' },
                { status: 403 },
              );
            }

            return NextResponse.redirect(new URL('/dashboard?error=insufficient-role', request.url));
          }
        }
      }

      // Continue to the protected route
      return NextResponse.next();
    } catch (error) {
      console.error('Worship auth middleware error:', error);

      if (config.returnJson) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 500 },
        );
      }

      return NextResponse.redirect(new URL('/dashboard?error=auth-failed', request.url));
    }
  };
}

/**
 * Get user's worship role for the current organization
 */
async function getUserWorshipRole(userId: string, organizationId: string): Promise<ExtendedWorshipRole> {
  try {
    // This would typically fetch from your database or Clerk
    // For now, we'll return a default role
    // In a real implementation, you'd use the worship-role-management functions

    // Import and use the actual function when in a server environment
    const { getUserWorshipRole } = await import('@/lib/worship-role-management');
    return await getUserWorshipRole(userId, organizationId);
  } catch (error) {
    console.error('Failed to get user worship role:', error);
    return 'member'; // Default to member role on error
  }
}

/**
 * Middleware factory for common worship route patterns
 */
export const worshipAuthMiddleware = {
  // Authentication only (any authenticated user with organization)
  basic: () => createWorshipAuthMiddleware(),

  // Church management routes
  churchManager: () => createWorshipAuthMiddleware({
    permission: 'canManageChurch',
  }),
  churchCreator: () => createWorshipAuthMiddleware({
    permission: 'canCreateChurch',
  }),
  churchAdmin: () => createWorshipAuthMiddleware({
    permission: 'canDeleteChurch',
  }),

  // Ministry management routes
  ministryManager: () => createWorshipAuthMiddleware({
    permission: 'canManageMinistry',
  }),
  ministryCreator: () => createWorshipAuthMiddleware({
    permission: 'canCreateMinistry',
  }),

  // Hymn management routes
  hymnCreator: () => createWorshipAuthMiddleware({
    permission: 'canCreateHymn',
  }),
  hymnEditor: () => createWorshipAuthMiddleware({
    permission: 'canEditHymn',
  }),
  hymnApprover: () => createWorshipAuthMiddleware({
    permission: 'canApproveHymn',
  }),

  // Program management routes
  programCreator: () => createWorshipAuthMiddleware({
    permission: 'canCreateProgram',
  }),
  programEditor: () => createWorshipAuthMiddleware({
    permission: 'canEditProgram',
  }),
  programApprover: () => createWorshipAuthMiddleware({
    permission: 'canApproveProgram',
  }),

  // Event management routes
  eventManager: () => createWorshipAuthMiddleware({
    permission: 'canCreateEvent',
  }),

  // User management routes
  userManager: () => createWorshipAuthMiddleware({
    permission: 'canInviteUsers',
  }),
  roleManager: () => createWorshipAuthMiddleware({
    permission: 'canAssignRoles',
  }),

  // Admin routes
  admin: () => createWorshipAuthMiddleware({
    minimumRole: 'admin',
  }),
  pastor: () => createWorshipAuthMiddleware({
    minimumRole: 'pastor',
  }),
  worshipLeader: () => createWorshipAuthMiddleware({
    minimumRole: 'worship_leader',
  }),
  collaborator: () => createWorshipAuthMiddleware({
    minimumRole: 'collaborator',
  }),

  // API routes (returns JSON errors)
  api: {
    basic: () => createWorshipAuthMiddleware({ returnJson: true }),
    churchManager: () => createWorshipAuthMiddleware({
      permission: 'canManageChurch',
      returnJson: true,
    }),
    hymnManager: () => createWorshipAuthMiddleware({
      permission: 'canEditHymn',
      returnJson: true,
    }),
    programManager: () => createWorshipAuthMiddleware({
      permission: 'canEditProgram',
      returnJson: true,
    }),
    admin: () => createWorshipAuthMiddleware({
      minimumRole: 'admin',
      returnJson: true,
    }),
    roleManager: () => createWorshipAuthMiddleware({
      permission: 'canAssignRoles',
      returnJson: true,
    }),
  },
};

/**
 * Higher-order function to wrap API route handlers with worship authentication
 */
export function withWorshipAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response> | Response,
  config: WorshipAuthConfig = {},
) {
  return async function (...args: T) {
    // Extract request from arguments (should be first argument in API routes)
    const request = args[0] as NextRequest;

    // Run authentication middleware
    const authMiddleware = createWorshipAuthMiddleware({ ...config, returnJson: true });
    const authResult = await authMiddleware(request);

    // If authentication failed, return the error response
    if (authResult.status !== 200) {
      return authResult;
    }

    // Continue to the original handler
    return handler(...args);
  };
}

/**
 * Utility function to check if current user has permission (for client-side usage)
 */
export async function checkUserPermission(
  permission: WorshipRoutePermission,
): Promise<boolean> {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return false;
    }

    const userRole = await getUserWorshipRole(userId, orgId);
    return WorshipRolePermissions[permission](userRole);
  } catch (error) {
    console.error('Failed to check user permission:', error);
    return false;
  }
}

/**
 * Utility function to get current user's worship role (for client-side usage)
 */
export async function getCurrentUserWorshipRole(): Promise<ExtendedWorshipRole> {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return 'member';
    }

    return await getUserWorshipRole(userId, orgId);
  } catch (error) {
    console.error('Failed to get current user worship role:', error);
    return 'member';
  }
}
