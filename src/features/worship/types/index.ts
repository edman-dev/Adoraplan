// TypeScript types for Worship Team Planning Service
// These types match the database schema defined in src/models/WorshipSchema.ts

// ============================================================================
// ENUM TYPES
// ============================================================================

export type WorshipRole = 'admin' | 'worship_leader' | 'pastor' | 'collaborator';

export type HymnType = 'official' | 'user_created' | 'public';

export type HymnStatus = 'authorized' | 'not_reviewed' | 'rejected';

export type ProgramStatus = 'draft' | 'published' | 'completed';

export type EventType = 'one_time' | 'recurring' | 'series';

export type EventPattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export type FeedbackType = 'technical_issue' | 'spiritual_impact' | 'improvement_suggestion' | 'general';

// ============================================================================
// BASE ENTITY TYPES
// ============================================================================

export type Church = {
  id: number;
  organizationId: string;
  name: string;
  description?: string;
  address?: string;
  timezone: string;
  isActive: boolean;
  createdBy: string;
  updatedAt: Date;
  createdAt: Date;
};

export type Ministry = {
  id: number;
  churchId: number;
  name: string;
  description?: string;
  color: string; // Hex color code
  icon: string; // Icon identifier
  isActive: boolean;
  createdBy: string;
  updatedAt: Date;
  createdAt: Date;
};

export type Service = {
  id: number;
  ministryId: number;
  name: string;
  description?: string;
  defaultDuration: number; // Duration in minutes
  isActive: boolean;
  createdBy: string;
  updatedAt: Date;
  createdAt: Date;
};

export type Event = {
  id: number;
  serviceId: number;
  title: string;
  description?: string;
  eventDate: Date;
  duration: number; // Duration in minutes
  eventType: EventType;
  recurringPattern?: EventPattern;
  recurringConfig?: RecurringConfig;
  seriesId?: number; // Self-reference for event series
  isCompleted: boolean;
  createdBy: string;
  updatedAt: Date;
  createdAt: Date;
};

export type Hymn = {
  id: number;
  organizationId: string;
  title: string;
  author?: string;
  composer?: string;
  year?: number;
  copyright?: string;
  hymnType: HymnType;
  status: HymnStatus;
  isPublic: boolean;
  categories?: string[];
  themes?: string[];
  doctrines?: string[];
  languages?: string[];
  lyrics?: MultiLanguageLyrics;
  audioFiles?: AudioFile[];
  syncData?: LyricSyncData;
  usageCount: number;
  createdBy: string;
  updatedAt: Date;
  createdAt: Date;
};

export type WorshipProgram = {
  id: number;
  eventId: number;
  title: string;
  description?: string;
  status: ProgramStatus;
  programData?: ProgramData;
  markdownContent?: string;
  originalMarkdown?: string;
  versionNumber: number;
  lastEditedBy?: string;
  lastEditedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy: string;
  updatedAt: Date;
  createdAt: Date;
};

export type ProgramHymn = {
  id: number;
  programId: number;
  hymnId: number;
  orderIndex: number;
  notes?: string;
  key?: string; // Musical key
  tempo?: string;
  estimatedDuration?: number; // Duration in seconds
  createdAt: Date;
};

export type ProgramAssignment = {
  id: number;
  programId: number;
  userId: string; // Clerk user ID
  role: string; // e.g., "pianist", "worship leader", "vocalist"
  notes?: string;
  isConfirmed: boolean;
  confirmedAt?: Date;
  assignedBy: string;
  createdAt: Date;
};

export type UserWorshipRole = {
  id: number;
  userId: string; // Clerk user ID
  organizationId: string;
  churchId?: number;
  role: WorshipRole;
  isActive: boolean;
  assignedBy: string;
  assignedAt: Date;
  revokedAt?: Date;
};

export type Notification = {
  id: number;
  userId: string; // Recipient user ID
  organizationId: string;
  type: string; // e.g., "assignment", "approval_request", "program_update"
  title: string;
  message: string;
  relatedEntityType?: string; // e.g., "program", "event", "hymn"
  relatedEntityId?: number;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  createdAt: Date;
};

export type Feedback = {
  id: number;
  eventId: number;
  programId?: number;
  userId: string; // Feedback provider
  feedbackType: FeedbackType;
  rating?: number; // 1-5 scale
  title?: string;
  message: string;
  suggestions?: string;
  isAnonymous: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
};

export type ProgramVersionHistory = {
  id: number;
  programId: number;
  versionNumber: number;
  markdownContent: string;
  changeDescription?: string;
  changedBy: string;
  changeType: string; // e.g., "manual_edit", "auto_generated"
  createdAt: Date;
};

export type SubscriptionUsage = {
  id: number;
  organizationId: string;
  churchCount: number;
  ministryCount: number;
  collaboratorCount: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  storageUsedMB: number;
  lastCalculatedAt: Date;
  updatedAt: Date;
};

// ============================================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// ============================================================================

export type ChurchWithRelations = {
  ministries?: MinistryWithRelations[];
  userWorshipRoles?: UserWorshipRole[];
} & Church;

export type MinistryWithRelations = {
  church?: Church;
  services?: ServiceWithRelations[];
} & Ministry;

export type ServiceWithRelations = {
  ministry?: MinistryWithRelations;
  events?: EventWithRelations[];
} & Service;

export type EventWithRelations = {
  service?: ServiceWithRelations;
  seriesParent?: Event;
  seriesChildren?: Event[];
  worshipPrograms?: WorshipProgramWithRelations[];
  feedback?: Feedback[];
} & Event;

export type HymnWithRelations = {
  programHymns?: ProgramHymnWithRelations[];
} & Hymn;

export type WorshipProgramWithRelations = {
  event?: EventWithRelations;
  programHymns?: ProgramHymnWithRelations[];
  programAssignments?: ProgramAssignment[];
  feedback?: Feedback[];
  versionHistory?: ProgramVersionHistory[];
} & WorshipProgram;

export type ProgramHymnWithRelations = {
  program?: WorshipProgram;
  hymn?: Hymn;
} & ProgramHymn;

// ============================================================================
// COMPLEX DATA TYPES
// ============================================================================

export type RecurringConfig = {
  frequency: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  weekOfMonth?: number; // 1-4, or -1 for last
  monthsOfYear?: number[]; // 1-12
  endDate?: Date;
  occurrences?: number; // Total number of occurrences
  interval?: string; // Custom interval description
};

export type MultiLanguageLyrics = {
  [languageCode: string]: {
    verses: LyricVerse[];
    chorus?: LyricVerse;
    bridge?: LyricVerse;
    metadata?: {
      translator?: string;
      translationDate?: Date;
      notes?: string;
    };
  };
};

export type LyricVerse = {
  number?: number;
  title?: string; // e.g., "Verse 1", "Chorus", "Bridge"
  text: string;
  notes?: string;
};

export type AudioFile = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // File size in bytes
  duration?: number; // Duration in seconds
  description?: string; // e.g., "Melody", "Harmony", "Full arrangement"
  url: string; // Storage URL
  uploadedAt: Date;
  uploadedBy: string;
};

export type LyricSyncData = {
  version: string; // Version of sync format
  syncPoints: SyncPoint[];
  metadata?: {
    audioFileId: string;
    createdBy: string;
    createdAt: Date;
    lastModified: Date;
  };
};

export type SyncPoint = {
  timestamp: number; // Time in seconds
  verseNumber?: number;
  lineNumber: number;
  wordIndex?: number; // For word-level sync
  text: string; // Text at this sync point
};

export type ProgramData = {
  sections: ProgramSection[];
  metadata: {
    totalEstimatedDuration: number; // Total program duration in minutes
    hymnCount: number;
    assignmentCount: number;
    lastModified: Date;
    template?: string; // Template ID if based on template
  };
};

export type ProgramSection = {
  id: string;
  type: 'hymn' | 'prayer' | 'announcement' | 'offering' | 'sermon' | 'other';
  title: string;
  orderIndex: number;
  estimatedDuration?: number; // Duration in minutes
  notes?: string;
  hymnId?: number; // If type is 'hymn'
  customContent?: string; // For non-hymn sections
  assignments?: SectionAssignment[];
};

export type SectionAssignment = {
  userId: string;
  role: string;
  notes?: string;
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ChurchesResponse = {} & PaginatedResponse<ChurchWithRelations>;
export type MinistriesResponse = {} & PaginatedResponse<MinistryWithRelations>;
export type ServicesResponse = {} & PaginatedResponse<ServiceWithRelations>;
export type EventsResponse = {} & PaginatedResponse<EventWithRelations>;
export type HymnsResponse = {} & PaginatedResponse<HymnWithRelations>;
export type ProgramsResponse = {} & PaginatedResponse<WorshipProgramWithRelations>;
export type FeedbackResponse = {} & PaginatedResponse<Feedback>;
export type NotificationsResponse = {} & PaginatedResponse<Notification>;

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export type CreateChurchData = {
  name: string;
  description?: string;
  address?: string;
  timezone?: string;
};

export type UpdateChurchData = {
  isActive?: boolean;
} & Partial<CreateChurchData>;

export type CreateMinistryData = {
  churchId: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
};

export type UpdateMinistryData = {
  isActive?: boolean;
} & Partial<CreateMinistryData>;

export type CreateServiceData = {
  ministryId: number;
  name: string;
  description?: string;
  defaultDuration?: number;
};

export type UpdateServiceData = {
  isActive?: boolean;
} & Partial<CreateServiceData>;

export type CreateEventData = {
  serviceId: number;
  title: string;
  description?: string;
  eventDate: Date;
  duration?: number;
  eventType: EventType;
  recurringPattern?: EventPattern;
  recurringConfig?: RecurringConfig;
};

export type UpdateEventData = {
  isCompleted?: boolean;
} & Partial<CreateEventData>;

export type CreateHymnData = {
  title: string;
  author?: string;
  composer?: string;
  year?: number;
  copyright?: string;
  categories?: string[];
  themes?: string[];
  doctrines?: string[];
  languages?: string[];
  lyrics?: MultiLanguageLyrics;
  isPublic?: boolean;
};

export type UpdateHymnData = {
  status?: HymnStatus;
} & Partial<CreateHymnData>;

export type CreateProgramData = {
  eventId: number;
  title: string;
  description?: string;
  programData?: ProgramData;
};

export type UpdateProgramData = {
  status?: ProgramStatus;
  markdownContent?: string;
} & Partial<CreateProgramData>;

export type CreateFeedbackData = {
  eventId: number;
  programId?: number;
  feedbackType: FeedbackType;
  rating?: number;
  title?: string;
  message: string;
  suggestions?: string;
  isAnonymous?: boolean;
};

export type UpdateFeedbackData = {
  isResolved?: boolean;
  resolution?: string;
} & Partial<CreateFeedbackData>;

// ============================================================================
// FILTER AND SEARCH TYPES
// ============================================================================

export type HymnFilters = {
  search?: string; // Search in title, author, lyrics
  hymnType?: HymnType;
  status?: HymnStatus;
  isPublic?: boolean;
  categories?: string[];
  themes?: string[];
  languages?: string[];
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

export type EventFilters = {
  serviceIds?: number[];
  ministryIds?: number[];
  churchIds?: number[];
  eventType?: EventType;
  isCompleted?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

export type ProgramFilters = {
  status?: ProgramStatus;
  eventIds?: number[];
  createdBy?: string;
  approvedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

export type NotificationFilters = {
  isRead?: boolean;
  type?: string;
  relatedEntityType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type SortOrder = 'asc' | 'desc';

export type SortConfig = {
  field: string;
  order: SortOrder;
};

export type PaginationConfig = {
  page: number;
  pageSize: number;
};

export type SearchConfig = {
  query: string;
  fields: string[]; // Fields to search in
};

// ============================================================================
// SUBSCRIPTION TIER TYPES
// ============================================================================

export type SubscriptionLimits = {
  churches: number; // -1 for unlimited
  ministries: number; // -1 for unlimited
  collaborators: number; // -1 for unlimited
  eventsPerWeek: number; // -1 for unlimited
  storageGB: number; // -1 for unlimited
};

export type TierLimits = {
  free: SubscriptionLimits;
  team: SubscriptionLimits;
  pro: SubscriptionLimits;
};

export type SubscriptionTier = keyof TierLimits;

// ============================================================================
// CALENDAR TYPES
// ============================================================================

export type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string; // Ministry color
  icon: string; // Ministry icon
  eventType: EventType;
  ministry: {
    name: string;
    color: string;
    icon: string;
  };
  service: {
    name: string;
  };
  church: {
    name: string;
  };
  isCompleted: boolean;
};

export type CalendarFilters = {
  ministryIds?: number[];
  churchIds?: number[];
  eventTypes?: EventType[];
  showCompleted?: boolean;
};

// ============================================================================
// AUDIO PLAYER TYPES
// ============================================================================

export type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
};

export type AudioPlayerConfig = {
  autoplay?: boolean;
  loop?: boolean;
  showLyrics?: boolean;
  showSync?: boolean;
  volume?: number;
};

// ============================================================================
// ADDITIONAL UTILITY EXPORTS
// ============================================================================

// Re-export key types for easier importing (avoiding conflicts)
export type {
  Church as WorshipChurch,
  Event as WorshipEvent,
  Hymn as WorshipHymn,
  Ministry as WorshipMinistry,
  Service as WorshipService,
};
