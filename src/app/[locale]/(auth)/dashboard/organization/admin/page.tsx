'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { OrganizationalDashboard } from '@/features/worship/components/OrganizationalDashboard';
import { AccessControl } from '@/components/worship/access-control';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useUser();
  
  // Get organization ID from user metadata
  const organizationId = user?.organizationMemberships?.[0]?.organization?.id;

  if (!organizationId) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Organization Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need to be part of an organization to access the admin dashboard.
              Please contact your administrator or create an organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <AccessControl requiredRole="admin" fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need admin privileges to access this dashboard. Please contact your organization administrator.
            </p>
          </CardContent>
        </Card>
      }>
        <OrganizationalDashboard organizationId={organizationId} />
      </AccessControl>
    </div>
  );
}