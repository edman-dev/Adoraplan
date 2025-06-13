'use client';

import { OrganizationSwitcher, useOrganization, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

import { DashboardNav } from '@/components/dashboard-nav';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserProvider } from '@/contexts/user-context';
import type { ChurchRole } from '@/lib/user-role-utils';
import { Logo } from '@/templates/Logo';
import { getI18nPath } from '@/utils/Helpers';

export default function DashboardLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { user } = useUser();
  const { organization } = useOrganization();

  // Helper function to get role from user metadata (for custom roles)
  const getUserRoleFromMetadata = (): ChurchRole | null => {
    if (!user?.publicMetadata) {
      return null;
    }

    // Check public metadata for church role
    const churchRole = user.publicMetadata.churchRole as string;

    // Map metadata roles to display names
    switch (churchRole) {
      case 'pastor':
        return 'Pastor';
      case 'organization_manager':
        return 'Organization Manager';
      case 'ministry_leader':
        return 'Ministry Leader';
      case 'admin':
        return 'Admin';
      default:
        return null;
    }
  };

  // Helper function to determine user role
  const getUserRole = (): ChurchRole | null => {
    if (!user || !organization) {
      return null;
    }

    // Check organization membership role
    const membership = user.organizationMemberships?.find(
      membership => membership.organization?.id === organization.id,
    );

    if (!membership) {
      return null;
    }

    // Map Clerk roles to church-specific roles
    // You can customize these mappings based on your role configuration in Clerk
    const role = membership.role as string;
    switch (role) {
      case 'org:admin':
        return 'Admin';
      case 'org:pastor':
        return 'Pastor';
      case 'org:manager':
        return 'Organization Manager';
      case 'org:ministry_leader':
        return 'Ministry Leader';
      case 'org:member':
        return 'Member';
      default:
        // Check for custom roles using public metadata or other methods
        return getUserRoleFromMetadata() || 'Member';
    }
  };

  // Helper function to get role badge variant
  const getRoleBadgeVariant = (role: ChurchRole | null) => {
    switch (role) {
      case 'Admin':
        return 'destructive'; // Red for admin
      case 'Pastor':
        return 'default'; // Default (usually blue) for pastor
      case 'Organization Manager':
        return 'secondary'; // Gray for organization manager
      case 'Ministry Leader':
        return 'outline'; // Outlined for ministry leader
      default:
        return 'secondary'; // Default gray for members
    }
  };

  return (
    <UserProvider>
      <SidebarProvider>
        <DashboardNav />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Logo and Organization */}
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Logo />
              </Link>

              <Separator orientation="vertical" className="h-4" />

              <div className="flex items-center gap-2">
                <OrganizationSwitcher
                  organizationProfileMode="navigation"
                  organizationProfileUrl={getI18nPath(
                    '/dashboard/organization-profile',
                    props.params.locale,
                  )}
                  afterCreateOrganizationUrl="/dashboard"
                  hidePersonal
                  skipInvitationScreen
                  appearance={{
                    elements: {
                      organizationSwitcherTrigger: 'max-w-28 sm:max-w-52',
                    },
                  }}
                />

                {/* Organization Context Info */}
                {organization && (
                  <div className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
                    <span>•</span>
                    <span>
                      {organization.membersCount || 0}
                      {' '}
                      members
                    </span>
                    {user && getUserRole() && (
                      <>
                        <span>•</span>
                        <span>
                          You are
                          {getUserRole()}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side controls */}
            <div className="ml-auto flex items-center gap-2">
              {/* Organization & User Context Display */}
              <div className="flex items-center gap-3">
                {/* Organization Context */}
                {organization && (
                  <div className="hidden flex-col items-end sm:flex">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Church:</span>
                      <span className="font-medium text-foreground">{organization.name}</span>
                    </div>
                    {organization.membersCount && (
                      <span className="text-xs text-muted-foreground">
                        {organization.membersCount}
                        {' '}
                        member
                        {organization.membersCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* User Info Display */}
                {user && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="hidden flex-col items-end sm:flex">
                      <span className="font-medium">{user.fullName || user.firstName}</span>
                      {getUserRole() && (
                        <Badge
                          variant={getRoleBadgeVariant(getUserRole()) as any}
                          className="text-xs"
                        >
                          {getUserRole()}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator orientation="vertical" className="h-4" />
              <LocaleSwitcher />
              <Separator orientation="vertical" className="h-4" />
              <UserButton
                userProfileMode="navigation"
                userProfileUrl="/dashboard/user-profile"
                appearance={{
                  elements: {
                    rootBox: 'px-2 py-1.5',
                  },
                }}
              />
            </div>
          </header>

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-4 p-4">
            {props.children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}

export const dynamic = 'force-dynamic';
