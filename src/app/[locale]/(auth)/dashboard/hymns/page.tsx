import { useTranslations } from 'next-intl';
import { Music, BookOpen, Heart, Search, PlayCircle, Calendar } from 'lucide-react';

import { PlaceholderSection } from '@/components/placeholder-section';
import { TitleBar } from '@/features/dashboard/TitleBar';

const HymnsPage = () => {
  const t = useTranslations('Hymns');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* Hymns Management Layout */}
      <div className="space-y-6">
        {/* Main Hymns Overview */}
        <div className="rounded-lg border bg-card p-6">
          <PlaceholderSection
            title={t('message_state_title')}
            description={t('message_state_description')}
            icon={Music}
            additionalInfo="Future features will include hymn library management, music selection for services, and worship planning"
          />
        </div>

        {/* Hymn Library & Search */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Hymn Library */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Hymn Library"
              description="Browse and manage hymn collection"
              icon={BookOpen}
              variant="compact"
              additionalInfo="Will contain searchable database of hymns with lyrics, sheet music, and audio files"
            />
          </div>

          {/* Hymn Search */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Hymn Search"
              description="Find hymns by title, lyrics, or theme"
              icon={Search}
              variant="compact"
              additionalInfo="Will provide advanced search capabilities for finding appropriate hymns for services"
            />
          </div>
        </div>

        {/* Music Management Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Service Music Planning */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Service Music"
              description="Plan music for services"
              icon={Calendar}
              variant="compact"
              additionalInfo="Will allow planning and scheduling hymns for specific services and events"
            />
          </div>

          {/* Favorite Hymns */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Favorite Hymns"
              description="Most used and favorite hymns"
              icon={Heart}
              variant="compact"
              additionalInfo="Will track frequently used hymns and congregation favorites"
            />
          </div>

          {/* Audio & Media */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Audio & Media"
              description="Hymn recordings and media"
              icon={PlayCircle}
              variant="compact"
              additionalInfo="Will manage audio recordings, instrumental tracks, and multimedia content"
            />
          </div>
        </div>

        {/* Worship Planning */}
        <div className="rounded-lg border bg-card p-6">
          <PlaceholderSection
            title="Worship Planning"
            description="Comprehensive worship service music planning"
            icon={Music}
            additionalInfo="Will integrate with service planning to coordinate hymns, special music, and worship themes"
          />
        </div>
      </div>
    </>
  );
};

export default HymnsPage;