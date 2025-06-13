import { useTranslations } from 'next-intl';
import { Building2, Users, Settings, UserCheck } from 'lucide-react';

import { PlaceholderSection } from '@/components/placeholder-section';
import { TitleBar } from '@/features/dashboard/TitleBar';

const OrganizationPage = () => {
  const t = useTranslations('Organization');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* Organization Management Layout */}
      <div className="space-y-6">
        {/* Main Organization Overview */}
        <div className="rounded-lg border bg-card p-6">
          <PlaceholderSection
            title={t('message_state_title')}
            description={t('message_state_description')}
            icon={Building2}
            additionalInfo="Future features will include church management, ministry oversight, and organizational settings"
          />
        </div>

        {/* Organization Management Sections */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Church Information */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Church Information"
              description="Basic church details and settings"
              icon={Building2}
              variant="compact"
              additionalInfo="Will manage church name, address, contact info, and basic settings"
            />
          </div>

          {/* Ministry Management */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Ministry Management"
              description="Organize and oversee ministries"
              icon={Users}
              variant="compact"
              additionalInfo="Will allow creation and management of different church ministries"
            />
          </div>

          {/* Role & Permissions */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Roles & Permissions"
              description="Manage user roles and access"
              icon={UserCheck}
              variant="compact"
              additionalInfo="Will handle pastor, ministry leader, and admin role assignments"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="rounded-lg border bg-card p-6">
          <PlaceholderSection
            title="Organization Settings"
            description="Advanced organizational configuration"
            icon={Settings}
            additionalInfo="Will include organizational policies, workflow settings, and integration configurations"
          />
        </div>
      </div>
    </>
  );
};

export default OrganizationPage;