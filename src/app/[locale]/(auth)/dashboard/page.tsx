import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlaceholderSection } from '@/components/placeholder-section';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* Future Widget Layout - Grid structure for dashboard widgets */}
      <div className="space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Service Status Widget */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Service Status"
              description="Current and upcoming services"
              icon={CheckCircle}
              variant="compact"
              additionalInfo="Will show service planning status and schedules"
            />
          </div>

          {/* Active Members Widget */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Active Members"
              description="Current membership overview"
              icon={Users}
              variant="compact"
              additionalInfo="Will display member engagement metrics"
            />
          </div>

          {/* Upcoming Events Widget */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Upcoming Events"
              description="Next scheduled events"
              icon={Calendar}
              variant="compact"
              additionalInfo="Will show calendar of upcoming church events"
            />
          </div>

          {/* Ministry Activity Widget */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Ministry Activity"
              description="Recent ministry updates"
              icon={Activity}
              variant="compact"
              additionalInfo="Will track ministry engagement and activities"
            />
          </div>
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Services Widget */}
          <div className="rounded-lg border bg-card p-6 lg:col-span-2">
            <PlaceholderSection
              title="Recent Services"
              description="Latest service planning and modifications"
              icon={Clock}
              additionalInfo="Will display recent services with pastor comments and modifications"
            />
          </div>

          {/* Ministry Summary Widget */}
          <div className="rounded-lg border bg-card p-6">
            <PlaceholderSection
              title="Ministry Overview"
              description="Summary of ministry activities"
              icon={TrendingUp}
              additionalInfo="Will show ministry performance and engagement summaries"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardIndexPage;
