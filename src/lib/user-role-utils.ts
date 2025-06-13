// Church role types
export type ChurchRole = 'Admin' | 'Pastor' | 'Organization Manager' | 'Ministry Leader' | 'Member';

// Extended user session data interface
export type UserSessionData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  emailAddress: string;
  imageUrl: string;
  publicMetadata: Record<string, any>;
  organizationMemberships: any[] | undefined;
};

// Extended organization data interface
export type OrganizationSessionData = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string;
  membersCount: number | undefined;
  createdAt: Date;
  publicMetadata: Record<string, any>;
};
