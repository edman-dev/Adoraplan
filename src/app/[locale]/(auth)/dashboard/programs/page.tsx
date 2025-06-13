import { CalendarDays, CheckCircle2, Clock, Edit3, FileText, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlaceholderSection } from '@/components/placeholder-section';
import { TitleBar } from '@/features/dashboard/TitleBar';

const ProgramsPage = () => {
  const t = useTranslations('Programs');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* Programs Management Layout */}
      <div className="space-y-6">
        {/* Main Programs Overview */}
        <div className="rounded-lg border bg-card p-6">
          <PlaceholderSection
            title={t('message_state_title')}
            description={t('message_state_description')}
            icon={CalendarDays}
            additionalInfo="Future features will include service planning, program scheduling, and ministry coordination"
          />
        </div>

        {/* Service Planning Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sunday Service Planning */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Sunday Service Planning"
              description="Plan and modify Sunday services"
              icon={Edit3}
              variant="compact"
              additionalInfo="Will allow pastors to create and modify Sunday service programs with comments"
            />
          </div>

          {/* Service Templates */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Service Templates"
              description="Reusable service structures"
              icon={FileText}
              variant="compact"
              additionalInfo="Will provide templates for different types of services and special events"
            />
          </div>
        </div>

        {/* Program Management Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Weekly Schedule */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Weekly Schedule"
              description="View and manage weekly programs"
              icon={Clock}
              variant="compact"
              additionalInfo="Will display and manage all weekly church activities and services"
            />
          </div>

          {/* Ministry Programs */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Ministry Programs"
              description="Coordinate ministry activities"
              icon={Users}
              variant="compact"
              additionalInfo="Will coordinate programs across different church ministries"
            />
          </div>

          {/* Program Status */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Program Status"
              description="Track program completion"
              icon={CheckCircle2}
              variant="compact"
              additionalInfo="Will track the status and completion of planned programs"
            />
          </div>
        </div>

        {/* Recent Programs Activity */}
        <div className="rounded-lg border bg-card p-6">
          <PlaceholderSection
            title="Recent Program Activity"
            description="Latest changes and updates to church programs"
            icon={Clock}
            additionalInfo="Will show recent modifications, comments, and updates made by pastors and ministry leaders"
          />
        </div>
      </div>
    </>
  );
};

export default ProgramsPage;
