import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { organizationSchema } from './Schema';

// Enums for worship-specific roles and states
export const worshipRoleEnum = pgEnum('worship_role', [
  'admin',
  'worship_leader',
  'pastor',
  'collaborator',
]);

export const hymnTypeEnum = pgEnum('hymn_type', [
  'official',
  'user_created',
  'public',
]);

export const hymnStatusEnum = pgEnum('hymn_status', [
  'authorized',
  'not_reviewed',
  'rejected',
]);

export const programStatusEnum = pgEnum('program_status', [
  'draft',
  'published',
  'completed',
]);

export const eventTypeEnum = pgEnum('event_type', [
  'one_time',
  'recurring',
  'series',
]);

export const eventPatternEnum = pgEnum('event_pattern', [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom',
]);

export const feedbackTypeEnum = pgEnum('feedback_type', [
  'technical_issue',
  'spiritual_impact',
  'improvement_suggestion',
  'general',
]);

// Churches table - represents individual church entities
export const churchesSchema = pgTable(
  'churches',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id').notNull().references(() => organizationSchema.id, { onDelete: 'cascade' }), // Links to existing organization
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    address: text('address'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    timezone: varchar('timezone', { length: 100 }).default('UTC'),
    isActive: boolean('is_active').default(true).notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    createdBy: text('created_by').notNull(), // User ID from Clerk
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      organizationIdx: index('churches_organization_idx').on(table.organizationId),
      nameIdx: index('churches_name_idx').on(table.name),
      activeIdx: index('churches_active_idx').on(table.isActive),
      createdByIdx: index('churches_created_by_idx').on(table.createdBy),
      createdAtIdx: index('churches_created_at_idx').on(table.createdAt),
      // Composite indexes for common queries
      orgActiveIdx: index('churches_org_active_idx').on(table.organizationId, table.isActive),
    };
  },
);

// Ministries table - represents ministries within churches
export const ministriesSchema = pgTable(
  'ministries',
  {
    id: serial('id').primaryKey(),
    churchId: integer('church_id').notNull().references(() => churchesSchema.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color code
    icon: varchar('icon', { length: 100 }).default('music'), // Icon identifier
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      churchIdx: index('ministries_church_idx').on(table.churchId),
      nameIdx: index('ministries_name_idx').on(table.name),
      activeIdx: index('ministries_active_idx').on(table.isActive),
      createdByIdx: index('ministries_created_by_idx').on(table.createdBy),
      createdAtIdx: index('ministries_created_at_idx').on(table.createdAt),
      // Composite indexes for common queries
      churchActiveIdx: index('ministries_church_active_idx').on(table.churchId, table.isActive),
    };
  },
);

// Services table - represents service types within ministries
export const servicesSchema = pgTable(
  'services',
  {
    id: serial('id').primaryKey(),
    ministryId: integer('ministry_id').notNull().references(() => ministriesSchema.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    defaultDuration: integer('default_duration').default(90), // Duration in minutes
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      ministryIdx: index('services_ministry_idx').on(table.ministryId),
      nameIdx: index('services_name_idx').on(table.name),
      activeIdx: index('services_active_idx').on(table.isActive),
      createdByIdx: index('services_created_by_idx').on(table.createdBy),
      createdAtIdx: index('services_created_at_idx').on(table.createdAt),
      // Composite indexes for common queries
      ministryActiveIdx: index('services_ministry_active_idx').on(table.ministryId, table.isActive),
    };
  },
);

// Events table - represents scheduled instances of services
export const eventsSchema = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    serviceId: integer('service_id').notNull().references(() => servicesSchema.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    eventDate: timestamp('event_date', { mode: 'date' }).notNull(),
    duration: integer('duration').default(90), // Duration in minutes
    eventType: eventTypeEnum('event_type').default('one_time').notNull(),
    recurringPattern: eventPatternEnum('recurring_pattern'),
    recurringConfig: json('recurring_config'), // JSON for complex recurring patterns
    seriesId: integer('series_id'), // Self-reference for event series
    isCompleted: boolean('is_completed').default(false).notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      serviceIdx: index('events_service_idx').on(table.serviceId),
      dateIdx: index('events_date_idx').on(table.eventDate),
      typeIdx: index('events_type_idx').on(table.eventType),
      seriesIdx: index('events_series_idx').on(table.seriesId),
      completedIdx: index('events_completed_idx').on(table.isCompleted),
      createdByIdx: index('events_created_by_idx').on(table.createdBy),
      createdAtIdx: index('events_created_at_idx').on(table.createdAt),
      // Composite indexes for critical calendar queries
      serviceDateIdx: index('events_service_date_idx').on(table.serviceId, table.eventDate),
      dateTypeIdx: index('events_date_type_idx').on(table.eventDate, table.eventType),
      dateCompletedIdx: index('events_date_completed_idx').on(table.eventDate, table.isCompleted),
      // Index for upcoming events query (very common)
      upcomingEventsIdx: index('events_upcoming_idx').on(table.eventDate, table.isCompleted),
    };
  },
);

// Hymns table - represents hymn library
export const hymnsSchema = pgTable(
  'hymns',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id').notNull().references(() => organizationSchema.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    author: varchar('author', { length: 255 }),
    composer: varchar('composer', { length: 255 }),
    year: integer('year'),
    copyright: text('copyright'),
    hymnType: hymnTypeEnum('hymn_type').default('user_created').notNull(),
    status: hymnStatusEnum('status').default('not_reviewed').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    categories: json('categories'), // Array of category strings
    themes: json('themes'), // Array of theme strings
    doctrines: json('doctrines'), // Array of doctrine strings
    languages: json('languages'), // Array of supported languages
    lyrics: json('lyrics'), // Multi-language lyrics object
    audioFiles: json('audio_files'), // Array of audio file metadata
    syncData: json('sync_data'), // Lyric-audio synchronization data
    usageCount: integer('usage_count').default(0).notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      organizationIdx: index('hymns_organization_idx').on(table.organizationId),
      titleIdx: index('hymns_title_idx').on(table.title),
      typeIdx: index('hymns_type_idx').on(table.hymnType),
      statusIdx: index('hymns_status_idx').on(table.status),
      publicIdx: index('hymns_public_idx').on(table.isPublic),
      createdByIdx: index('hymns_created_by_idx').on(table.createdBy),
      authorIdx: index('hymns_author_idx').on(table.author),
      usageCountIdx: index('hymns_usage_count_idx').on(table.usageCount),
      createdAtIdx: index('hymns_created_at_idx').on(table.createdAt),
      // Composite indexes for hymn library searches
      orgTypeIdx: index('hymns_org_type_idx').on(table.organizationId, table.hymnType),
      publicStatusIdx: index('hymns_public_status_idx').on(table.isPublic, table.status),
      titleAuthorIdx: index('hymns_title_author_idx').on(table.title, table.author),
      // Index for popular hymns (frequently used)
      popularHymnsIdx: index('hymns_popular_idx').on(table.usageCount, table.organizationId),
    };
  },
);

// Worship Programs table - represents worship service programs
export const worshipProgramsSchema = pgTable(
  'worship_programs',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => eventsSchema.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: programStatusEnum('status').default('draft').notNull(),
    programData: json('program_data'), // Structured program content
    markdownContent: text('markdown_content'), // Generated markdown
    originalMarkdown: text('original_markdown'), // Original generated markdown
    versionNumber: integer('version_number').default(1).notNull(),
    lastEditedBy: text('last_edited_by'),
    lastEditedAt: timestamp('last_edited_at', { mode: 'date' }),
    approvedBy: text('approved_by'),
    approvedAt: timestamp('approved_at', { mode: 'date' }),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      eventIdx: index('programs_event_idx').on(table.eventId),
      statusIdx: index('programs_status_idx').on(table.status),
      createdByIdx: index('programs_created_by_idx').on(table.createdBy),
      approvedByIdx: index('programs_approved_by_idx').on(table.approvedBy),
      lastEditedByIdx: index('programs_last_edited_by_idx').on(table.lastEditedBy),
      versionIdx: index('programs_version_idx').on(table.versionNumber),
      createdAtIdx: index('programs_created_at_idx').on(table.createdAt),
      lastEditedAtIdx: index('programs_last_edited_at_idx').on(table.lastEditedAt),
      approvedAtIdx: index('programs_approved_at_idx').on(table.approvedAt),
      // Composite indexes for program management
      eventStatusIdx: index('programs_event_status_idx').on(table.eventId, table.status),
      statusApprovedIdx: index('programs_status_approved_idx').on(table.status, table.approvedBy),
    };
  },
);

// Program Hymns table - links hymns to worship programs with ordering
export const programHymnsSchema = pgTable(
  'program_hymns',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id').notNull().references(() => worshipProgramsSchema.id, { onDelete: 'cascade' }),
    hymnId: integer('hymn_id').notNull().references(() => hymnsSchema.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull(),
    notes: text('notes'), // Specific notes for this hymn in this program
    key: varchar('key', { length: 10 }), // Musical key for this performance
    tempo: varchar('tempo', { length: 50 }), // Tempo indication
    estimatedDuration: integer('estimated_duration'), // Duration in seconds
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      programIdx: index('program_hymns_program_idx').on(table.programId),
      hymnIdx: index('program_hymns_hymn_idx').on(table.hymnId),
      orderIdx: index('program_hymns_order_idx').on(table.orderIndex),
      uniqueProgramHymn: uniqueIndex('unique_program_hymn_order').on(
        table.programId,
        table.orderIndex,
      ),
    };
  },
);

// Program Assignments table - assigns roles to users for specific programs
export const programAssignmentsSchema = pgTable(
  'program_assignments',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id').notNull().references(() => worshipProgramsSchema.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(), // Clerk user ID
    role: varchar('role', { length: 100 }).notNull(), // e.g., "pianist", "worship leader", "vocalist"
    notes: text('notes'),
    isConfirmed: boolean('is_confirmed').default(false).notNull(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    assignedBy: text('assigned_by').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      programIdx: index('assignments_program_idx').on(table.programId),
      userIdx: index('assignments_user_idx').on(table.userId),
      roleIdx: index('assignments_role_idx').on(table.role),
      confirmedIdx: index('assignments_confirmed_idx').on(table.isConfirmed),
    };
  },
);

// User Worship Roles table - assigns worship-specific roles to users within organizations
export const userWorshipRolesSchema = pgTable(
  'user_worship_roles',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(), // Clerk user ID
    organizationId: text('organization_id').notNull().references(() => organizationSchema.id, { onDelete: 'cascade' }),
    churchId: integer('church_id').references(() => churchesSchema.id, { onDelete: 'cascade' }),
    role: worshipRoleEnum('role').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    assignedBy: text('assigned_by').notNull(),
    assignedAt: timestamp('assigned_at', { mode: 'date' }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
  },
  (table) => {
    return {
      userOrgIdx: index('user_roles_user_org_idx').on(table.userId, table.organizationId),
      churchIdx: index('user_roles_church_idx').on(table.churchId),
      roleIdx: index('user_roles_role_idx').on(table.role),
      activeIdx: index('user_roles_active_idx').on(table.isActive),
      assignedByIdx: index('user_roles_assigned_by_idx').on(table.assignedBy),
      assignedAtIdx: index('user_roles_assigned_at_idx').on(table.assignedAt),
      // Composite indexes for user permission checks (very frequent)
      userActiveIdx: index('user_roles_user_active_idx').on(table.userId, table.isActive),
      orgActiveIdx: index('user_roles_org_active_idx').on(table.organizationId, table.isActive),
      userOrgActiveIdx: index('user_roles_user_org_active_idx').on(table.userId, table.organizationId, table.isActive),
      churchActiveIdx: index('user_roles_church_active_idx').on(table.churchId, table.isActive),
      uniqueUserOrgRole: uniqueIndex('unique_user_org_role').on(
        table.userId,
        table.organizationId,
        table.role,
      ),
    };
  },
);

// Notifications table - in-app notifications for worship activities
export const notificationsSchema = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(), // Recipient user ID
    organizationId: text('organization_id').notNull().references(() => organizationSchema.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 100 }).notNull(), // e.g., "assignment", "approval_request", "program_update"
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    relatedEntityType: varchar('related_entity_type', { length: 50 }), // e.g., "program", "event", "hymn"
    relatedEntityId: integer('related_entity_id'),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { mode: 'date' }),
    actionUrl: varchar('action_url', { length: 500 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdx: index('notifications_user_idx').on(table.userId),
      organizationIdx: index('notifications_organization_idx').on(table.organizationId),
      typeIdx: index('notifications_type_idx').on(table.type),
      readIdx: index('notifications_read_idx').on(table.isRead),
      createdIdx: index('notifications_created_idx').on(table.createdAt),
      relatedEntityIdx: index('notifications_related_entity_idx').on(table.relatedEntityType, table.relatedEntityId),
      // Composite indexes for notification queries (very frequent)
      userReadIdx: index('notifications_user_read_idx').on(table.userId, table.isRead),
      userCreatedIdx: index('notifications_user_created_idx').on(table.userId, table.createdAt),
      userOrgReadIdx: index('notifications_user_org_read_idx').on(table.userId, table.organizationId, table.isRead),
    };
  },
);

// Feedback table - post-event feedback and surveys
export const feedbackSchema = pgTable(
  'feedback',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => eventsSchema.id, { onDelete: 'cascade' }),
    programId: integer('program_id').references(() => worshipProgramsSchema.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(), // Feedback provider
    feedbackType: feedbackTypeEnum('feedback_type').notNull(),
    rating: integer('rating'), // 1-5 scale
    title: varchar('title', { length: 255 }),
    message: text('message').notNull(),
    suggestions: text('suggestions'),
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    isResolved: boolean('is_resolved').default(false).notNull(),
    resolvedBy: text('resolved_by'),
    resolvedAt: timestamp('resolved_at', { mode: 'date' }),
    resolution: text('resolution'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      eventIdx: index('feedback_event_idx').on(table.eventId),
      programIdx: index('feedback_program_idx').on(table.programId),
      userIdx: index('feedback_user_idx').on(table.userId),
      typeIdx: index('feedback_type_idx').on(table.feedbackType),
      ratingIdx: index('feedback_rating_idx').on(table.rating),
      resolvedIdx: index('feedback_resolved_idx').on(table.isResolved),
      resolvedByIdx: index('feedback_resolved_by_idx').on(table.resolvedBy),
      createdAtIdx: index('feedback_created_at_idx').on(table.createdAt),
      // Composite indexes for feedback analytics
      eventResolvedIdx: index('feedback_event_resolved_idx').on(table.eventId, table.isResolved),
      typeRatingIdx: index('feedback_type_rating_idx').on(table.feedbackType, table.rating),
      eventTypeIdx: index('feedback_event_type_idx').on(table.eventId, table.feedbackType),
    };
  },
);

// Program Version History table - track changes to manually edited markdown
export const programVersionHistorySchema = pgTable(
  'program_version_history',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id').notNull().references(() => worshipProgramsSchema.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    markdownContent: text('markdown_content').notNull(),
    changeDescription: text('change_description'),
    changedBy: text('changed_by').notNull(),
    changeType: varchar('change_type', { length: 50 }).default('manual_edit'), // e.g., "manual_edit", "auto_generated"
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      programIdx: index('version_history_program_idx').on(table.programId),
      versionIdx: index('version_history_version_idx').on(table.versionNumber),
      changedByIdx: index('version_history_changed_by_idx').on(table.changedBy),
      createdIdx: index('version_history_created_idx').on(table.createdAt),
      uniqueProgramVersion: uniqueIndex('unique_program_version').on(
        table.programId,
        table.versionNumber,
      ),
    };
  },
);

// Subscription Usage table - track usage for billing enforcement
export const subscriptionUsageSchema = pgTable(
  'subscription_usage',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id').notNull().references(() => organizationSchema.id, { onDelete: 'cascade' }),
    churchCount: integer('church_count').default(0).notNull(),
    ministryCount: integer('ministry_count').default(0).notNull(),
    collaboratorCount: integer('collaborator_count').default(0).notNull(),
    eventsThisWeek: integer('events_this_week').default(0).notNull(),
    eventsThisMonth: integer('events_this_month').default(0).notNull(),
    storageUsedMB: integer('storage_used_mb').default(0).notNull(),
    lastCalculatedAt: timestamp('last_calculated_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => {
    return {
      organizationIdx: uniqueIndex('usage_organization_idx').on(table.organizationId),
      lastCalculatedIdx: index('usage_last_calculated_idx').on(table.lastCalculatedAt),
    };
  },
);

// ============================================================================
// RELATIONSHIPS DEFINITIONS
// ============================================================================

// Organization relationships (from existing schema)
export const organizationRelations = relations(organizationSchema, ({ many }) => ({
  churches: many(churchesSchema),
  hymns: many(hymnsSchema),
  userWorshipRoles: many(userWorshipRolesSchema),
  notifications: many(notificationsSchema),
  subscriptionUsage: many(subscriptionUsageSchema),
}));

// Churches relationships
export const churchesRelations = relations(churchesSchema, ({ one, many }) => ({
  organization: one(organizationSchema, {
    fields: [churchesSchema.organizationId],
    references: [organizationSchema.id],
  }),
  ministries: many(ministriesSchema),
  userWorshipRoles: many(userWorshipRolesSchema),
}));

// Ministries relationships
export const ministriesRelations = relations(ministriesSchema, ({ one, many }) => ({
  church: one(churchesSchema, {
    fields: [ministriesSchema.churchId],
    references: [churchesSchema.id],
  }),
  services: many(servicesSchema),
}));

// Services relationships
export const servicesRelations = relations(servicesSchema, ({ one, many }) => ({
  ministry: one(ministriesSchema, {
    fields: [servicesSchema.ministryId],
    references: [ministriesSchema.id],
  }),
  events: many(eventsSchema),
}));

// Events relationships
export const eventsRelations = relations(eventsSchema, ({ one, many }) => ({
  service: one(servicesSchema, {
    fields: [eventsSchema.serviceId],
    references: [servicesSchema.id],
  }),
  seriesParent: one(eventsSchema, {
    fields: [eventsSchema.seriesId],
    references: [eventsSchema.id],
    relationName: 'eventSeries',
  }),
  seriesChildren: many(eventsSchema, {
    relationName: 'eventSeries',
  }),
  worshipPrograms: many(worshipProgramsSchema),
  feedback: many(feedbackSchema),
}));

// Hymns relationships
export const hymnsRelations = relations(hymnsSchema, ({ one, many }) => ({
  organization: one(organizationSchema, {
    fields: [hymnsSchema.organizationId],
    references: [organizationSchema.id],
  }),
  programHymns: many(programHymnsSchema),
}));

// Worship Programs relationships
export const worshipProgramsRelations = relations(worshipProgramsSchema, ({ one, many }) => ({
  event: one(eventsSchema, {
    fields: [worshipProgramsSchema.eventId],
    references: [eventsSchema.id],
  }),
  programHymns: many(programHymnsSchema),
  programAssignments: many(programAssignmentsSchema),
  feedback: many(feedbackSchema),
  versionHistory: many(programVersionHistorySchema),
}));

// Program Hymns relationships (junction table)
export const programHymnsRelations = relations(programHymnsSchema, ({ one }) => ({
  program: one(worshipProgramsSchema, {
    fields: [programHymnsSchema.programId],
    references: [worshipProgramsSchema.id],
  }),
  hymn: one(hymnsSchema, {
    fields: [programHymnsSchema.hymnId],
    references: [hymnsSchema.id],
  }),
}));

// Program Assignments relationships
export const programAssignmentsRelations = relations(programAssignmentsSchema, ({ one }) => ({
  program: one(worshipProgramsSchema, {
    fields: [programAssignmentsSchema.programId],
    references: [worshipProgramsSchema.id],
  }),
}));

// User Worship Roles relationships
export const userWorshipRolesRelations = relations(userWorshipRolesSchema, ({ one }) => ({
  organization: one(organizationSchema, {
    fields: [userWorshipRolesSchema.organizationId],
    references: [organizationSchema.id],
  }),
  church: one(churchesSchema, {
    fields: [userWorshipRolesSchema.churchId],
    references: [churchesSchema.id],
  }),
}));

// Notifications relationships
export const notificationsRelations = relations(notificationsSchema, ({ one }) => ({
  organization: one(organizationSchema, {
    fields: [notificationsSchema.organizationId],
    references: [organizationSchema.id],
  }),
}));

// Feedback relationships
export const feedbackRelations = relations(feedbackSchema, ({ one }) => ({
  event: one(eventsSchema, {
    fields: [feedbackSchema.eventId],
    references: [eventsSchema.id],
  }),
  program: one(worshipProgramsSchema, {
    fields: [feedbackSchema.programId],
    references: [worshipProgramsSchema.id],
  }),
}));

// Program Version History relationships
export const programVersionHistoryRelations = relations(programVersionHistorySchema, ({ one }) => ({
  program: one(worshipProgramsSchema, {
    fields: [programVersionHistorySchema.programId],
    references: [worshipProgramsSchema.id],
  }),
}));

// Subscription Usage relationships
export const subscriptionUsageRelations = relations(subscriptionUsageSchema, ({ one }) => ({
  organization: one(organizationSchema, {
    fields: [subscriptionUsageSchema.organizationId],
    references: [organizationSchema.id],
  }),
}));
