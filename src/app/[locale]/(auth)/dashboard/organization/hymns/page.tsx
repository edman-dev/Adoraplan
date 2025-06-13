'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { HymnLibrary } from '@/features/worship/components/HymnLibrary';
import { HymnLibraryGuard } from '@/components/worship/access-control';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function HymnsPage() {
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
              You need to be part of an organization to access the hymn library.
              Please contact your administrator or create an organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <HymnLibraryGuard fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need appropriate privileges to access the hymn library. 
              Please contact your organization administrator.
            </p>
          </CardContent>
        </Card>
      }>
        <HymnLibrary organizationId={organizationId} />
      </HymnLibraryGuard>
    </div>
  );
}