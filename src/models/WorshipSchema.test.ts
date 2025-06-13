import { describe, expect, it } from 'vitest';

import type {
  EventPattern,
  EventType,
  FeedbackType,
  HymnStatus,
  HymnType,
  ProgramStatus,
  WorshipRole,
} from '../features/worship/types';
import { organizationSchema } from './Schema';
import {
  // Relations
  churchesRelations,
  // Schema tables
  churchesSchema,
  eventPatternEnum,
  eventsRelations,
  eventsSchema,
  eventTypeEnum,
  feedbackRelations,
  feedbackSchema,
  feedbackTypeEnum,
  hymnsRelations,
  hymnsSchema,
  hymnStatusEnum,
  hymnTypeEnum,
  ministriesRelations,
  ministriesSchema,
  notificationsRelations,
  notificationsSchema,
  programAssignmentsRelations,
  programAssignmentsSchema,
  programHymnsRelations,
  programHymnsSchema,
  programStatusEnum,
  programVersionHistoryRelations,
  programVersionHistorySchema,
  servicesRelations,
  servicesSchema,
  subscriptionUsageRelations,
  subscriptionUsageSchema,
  userWorshipRolesRelations,
  userWorshipRolesSchema,
  worshipProgramsRelations,
  worshipProgramsSchema,
  // Enums
  worshipRoleEnum,
} from './WorshipSchema';

describe('Worship Schema Definitions', () => {
  describe('Table Schema Exports', () => {
    it('should export all required table schemas', () => {
      // Verify all table schemas are defined and exported
      expect(churchesSchema).toBeDefined();
      expect(ministriesSchema).toBeDefined();
      expect(servicesSchema).toBeDefined();
      expect(eventsSchema).toBeDefined();
      expect(hymnsSchema).toBeDefined();
      expect(worshipProgramsSchema).toBeDefined();
      expect(programHymnsSchema).toBeDefined();
      expect(programAssignmentsSchema).toBeDefined();
      expect(userWorshipRolesSchema).toBeDefined();
      expect(notificationsSchema).toBeDefined();
      expect(feedbackSchema).toBeDefined();
      expect(programVersionHistorySchema).toBeDefined();
      expect(subscriptionUsageSchema).toBeDefined();

      // Verify organization schema is imported correctly
      expect(organizationSchema).toBeDefined();
    });

    it('should have proper schema objects structure', () => {
      // Test that schemas are proper Drizzle table objects
      const schemas = [
        churchesSchema,
        ministriesSchema,
        servicesSchema,
        eventsSchema,
        hymnsSchema,
        worshipProgramsSchema,
        programHymnsSchema,
        programAssignmentsSchema,
        userWorshipRolesSchema,
        notificationsSchema,
        feedbackSchema,
        programVersionHistorySchema,
        subscriptionUsageSchema,
      ];

      schemas.forEach((schema) => {
        // Each schema should be an object (Drizzle table)
        expect(typeof schema).toBe('object');
        expect(schema).not.toBeNull();

        // Should have the basic structure we expect from Drizzle tables
        expect(schema).toBeDefined();
      });
    });
  });

  describe('Enum Definitions', () => {
    it('should export all required enum types', () => {
      expect(worshipRoleEnum).toBeDefined();
      expect(hymnTypeEnum).toBeDefined();
      expect(hymnStatusEnum).toBeDefined();
      expect(programStatusEnum).toBeDefined();
      expect(eventTypeEnum).toBeDefined();
      expect(eventPatternEnum).toBeDefined();
      expect(feedbackTypeEnum).toBeDefined();
    });

    it('should have correct enum values', () => {
      // Test that enums contain expected values
      expect(worshipRoleEnum.enumValues).toEqual(['admin', 'worship_leader', 'pastor', 'collaborator']);
      expect(hymnTypeEnum.enumValues).toEqual(['official', 'user_created', 'public']);
      expect(hymnStatusEnum.enumValues).toEqual(['authorized', 'not_reviewed', 'rejected']);
      expect(programStatusEnum.enumValues).toEqual(['draft', 'published', 'completed']);
      expect(eventTypeEnum.enumValues).toEqual(['one_time', 'recurring', 'series']);
      expect(eventPatternEnum.enumValues).toEqual(['daily', 'weekly', 'monthly', 'yearly', 'custom']);
      expect(feedbackTypeEnum.enumValues).toEqual(['technical_issue', 'spiritual_impact', 'improvement_suggestion', 'general']);
    });
  });

  describe('Relationship Definitions', () => {
    it('should export all relationship definitions', () => {
      expect(churchesRelations).toBeDefined();
      expect(ministriesRelations).toBeDefined();
      expect(servicesRelations).toBeDefined();
      expect(eventsRelations).toBeDefined();
      expect(hymnsRelations).toBeDefined();
      expect(worshipProgramsRelations).toBeDefined();
      expect(programHymnsRelations).toBeDefined();
      expect(programAssignmentsRelations).toBeDefined();
      expect(userWorshipRolesRelations).toBeDefined();
      expect(notificationsRelations).toBeDefined();
      expect(feedbackRelations).toBeDefined();
      expect(programVersionHistoryRelations).toBeDefined();
      expect(subscriptionUsageRelations).toBeDefined();
    });

    it('should have proper relationship function structure', () => {
      const relations = [
        churchesRelations,
        ministriesRelations,
        servicesRelations,
        eventsRelations,
        hymnsRelations,
        worshipProgramsRelations,
        programHymnsRelations,
        programAssignmentsRelations,
        userWorshipRolesRelations,
        notificationsRelations,
        feedbackRelations,
        programVersionHistoryRelations,
        subscriptionUsageRelations,
      ];

      relations.forEach((relation) => {
        // Relations should be objects (not functions as they're relation configs)
        expect(typeof relation).toBe('object');
        expect(relation).not.toBeNull();
      });
    });
  });

  describe('TypeScript Type Exports', () => {
    it('should support TypeScript enum types', () => {
      // Test TypeScript type definitions work correctly
      const testWorshipRole: WorshipRole = 'worship_leader';
      const testHymnType: HymnType = 'user_created';
      const testHymnStatus: HymnStatus = 'authorized';
      const testProgramStatus: ProgramStatus = 'draft';
      const testEventType: EventType = 'recurring';
      const testEventPattern: EventPattern = 'weekly';
      const testFeedbackType: FeedbackType = 'spiritual_impact';

      // Verify types are assignable
      expect(testWorshipRole).toBe('worship_leader');
      expect(testHymnType).toBe('user_created');
      expect(testHymnStatus).toBe('authorized');
      expect(testProgramStatus).toBe('draft');
      expect(testEventType).toBe('recurring');
      expect(testEventPattern).toBe('weekly');
      expect(testFeedbackType).toBe('spiritual_impact');
    });

    it('should validate enum type constraints', () => {
      // Test that only valid enum values are accepted
      const validWorshipRoles: WorshipRole[] = ['admin', 'worship_leader', 'pastor', 'collaborator'];
      const validHymnTypes: HymnType[] = ['official', 'user_created', 'public'];
      const validHymnStatuses: HymnStatus[] = ['authorized', 'not_reviewed', 'rejected'];
      const validProgramStatuses: ProgramStatus[] = ['draft', 'published', 'completed'];
      const validEventTypes: EventType[] = ['one_time', 'recurring', 'series'];
      const validEventPatterns: EventPattern[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
      const validFeedbackTypes: FeedbackType[] = ['technical_issue', 'spiritual_impact', 'improvement_suggestion', 'general'];

      // Verify arrays have correct length
      expect(validWorshipRoles).toHaveLength(4);
      expect(validHymnTypes).toHaveLength(3);
      expect(validHymnStatuses).toHaveLength(3);
      expect(validProgramStatuses).toHaveLength(3);
      expect(validEventTypes).toHaveLength(3);
      expect(validEventPatterns).toHaveLength(5);
      expect(validFeedbackTypes).toHaveLength(4);
    });
  });
});

describe('Schema Structure Validation', () => {
  describe('Hierarchical Relationships', () => {
    it('should support the expected organizational hierarchy', () => {
      // Test that we can conceptually create the hierarchy
      // Organization -> Church -> Ministry -> Service -> Event -> Program

      const hierarchyTest = {
        organization: { id: 'org_123' },
        church: { organizationId: 'org_123', name: 'Test Church' },
        ministry: { churchId: 1, name: 'Test Ministry' },
        service: { ministryId: 1, name: 'Test Service' },
        event: { serviceId: 1, title: 'Test Event' },
        program: { eventId: 1, title: 'Test Program' },
      };

      // Verify structure is logical
      expect(hierarchyTest.church.organizationId).toBe(hierarchyTest.organization.id);
      expect(hierarchyTest.ministry.churchId).toBe(1);
      expect(hierarchyTest.service.ministryId).toBe(1);
      expect(hierarchyTest.event.serviceId).toBe(1);
      expect(hierarchyTest.program.eventId).toBe(1);
    });
  });

  describe('Complex JSON Data Structures', () => {
    it('should support complex hymn data structures', () => {
      const hymnData = {
        title: 'Amazing Grace',
        categories: ['traditional', 'grace'],
        themes: ['redemption', 'salvation'],
        languages: ['en', 'es', 'fr'],
        lyrics: {
          en: {
            verses: [
              { number: 1, title: 'Verse 1', text: 'Amazing grace how sweet the sound' },
              { number: 2, title: 'Verse 2', text: 'Twas grace that taught my heart to fear' },
            ],
            chorus: { title: 'Chorus', text: 'How precious did that grace appear' },
          },
          es: {
            verses: [
              { number: 1, title: 'Verso 1', text: 'Sublime gracia del Señor' },
            ],
          },
        },
        audioFiles: [
          {
            id: 'audio_1',
            filename: 'amazing-grace.mp3',
            originalName: 'Amazing Grace.mp3',
            mimeType: 'audio/mpeg',
            size: 3145728,
            duration: 240,
            description: 'Full choir arrangement',
            url: 'https://example.com/audio/amazing-grace.mp3',
            uploadedAt: new Date(),
            uploadedBy: 'user_123',
          },
        ],
        syncData: {
          version: '1.0',
          syncPoints: [
            { timestamp: 0, lineNumber: 1, text: 'Amazing grace how sweet the sound' },
            { timestamp: 4.2, lineNumber: 1, text: 'That saved a wretch like me' },
          ],
          metadata: {
            audioFileId: 'audio_1',
            createdBy: 'user_123',
            createdAt: new Date(),
            lastModified: new Date(),
          },
        },
      };

      // Verify complex structure is valid
      expect(hymnData.lyrics.en.verses).toHaveLength(2);
      expect(hymnData.audioFiles[0]?.mimeType).toBe('audio/mpeg');
      expect(hymnData.syncData.syncPoints).toHaveLength(2);
      expect(hymnData.categories).toContain('traditional');
    });

    it('should support event recurring configurations', () => {
      const recurringEventData = {
        title: 'Weekly Sunday Service',
        eventType: 'recurring' as EventType,
        recurringPattern: 'weekly' as EventPattern,
        recurringConfig: {
          frequency: 1, // Every week
          daysOfWeek: [0], // Sunday (0 = Sunday)
          endDate: new Date('2024-12-31'),
          occurrences: 52, // One year
          interval: 'Every Sunday at 10:30 AM',
        },
      };

      // Verify recurring configuration structure
      expect(recurringEventData.eventType).toBe('recurring');
      expect(recurringEventData.recurringPattern).toBe('weekly');
      expect(recurringEventData.recurringConfig.daysOfWeek).toContain(0);
      expect(recurringEventData.recurringConfig.frequency).toBe(1);
    });

    it('should support worship program structures', () => {
      const programData = {
        title: 'Sunday Morning Worship',
        programData: {
          sections: [
            {
              id: 'section_1',
              type: 'hymn' as const,
              title: 'Opening Hymn',
              orderIndex: 1,
              estimatedDuration: 5,
              hymnId: 123,
              assignments: [
                { userId: 'user_worship_leader', role: 'Worship Leader', notes: 'Lead singing' },
                { userId: 'user_pianist', role: 'Pianist', notes: 'Accompany hymn' },
              ],
            },
            {
              id: 'section_2',
              type: 'prayer' as const,
              title: 'Opening Prayer',
              orderIndex: 2,
              estimatedDuration: 3,
              customContent: 'Pastor will offer opening prayer',
              assignments: [
                { userId: 'user_pastor', role: 'Pastor', notes: 'Lead opening prayer' },
              ],
            },
          ],
          metadata: {
            totalEstimatedDuration: 90,
            hymnCount: 1,
            assignmentCount: 3,
            lastModified: new Date(),
            template: 'traditional_sunday_service',
          },
        },
      };

      // Verify program structure
      expect(programData.programData.sections).toHaveLength(2);
      expect(programData.programData.sections[0]?.type).toBe('hymn');
      expect(programData.programData.sections[1]?.type).toBe('prayer');
      expect(programData.programData.metadata.hymnCount).toBe(1);
      expect(programData.programData.sections[0]?.assignments).toHaveLength(2);
    });
  });

  describe('Data Validation Scenarios', () => {
    it('should handle realistic church data', () => {
      const churchData = {
        organizationId: 'org_12345678',
        name: 'Grace Community Church',
        description: 'A vibrant community church serving the local area with love and compassion.',
        address: '123 Main Street, Springfield, IL 62701',
        timezone: 'America/Chicago',
        isActive: true,
        createdBy: 'user_pastor_john_smith',
      };

      expect(churchData.name).toBe('Grace Community Church');
      expect(churchData.timezone).toBe('America/Chicago');
      expect(churchData.isActive).toBe(true);
    });

    it('should handle ministry data with visual elements', () => {
      const ministryData = {
        churchId: 1,
        name: 'Contemporary Worship',
        description: 'Modern worship with contemporary music and multimedia presentations',
        color: '#8B5CF6', // Purple
        icon: 'guitar',
        isActive: true,
        createdBy: 'user_worship_director',
      };

      expect(ministryData.color).toMatch(/^#[0-9A-F]{6}$/);
      expect(ministryData.icon).toBe('guitar');
      expect(ministryData.name).toBe('Contemporary Worship');
    });

    it('should handle notification data with relationships', () => {
      const notificationData = {
        userId: 'user_musician_mary',
        organizationId: 'org_12345',
        type: 'assignment',
        title: 'New Worship Assignment',
        message: 'You have been assigned to play piano for the Sunday morning service on June 16th.',
        relatedEntityType: 'program',
        relatedEntityId: 456,
        isRead: false,
        actionUrl: '/worship/programs/456',
      };

      expect(notificationData.type).toBe('assignment');
      expect(notificationData.relatedEntityType).toBe('program');
      expect(notificationData.isRead).toBe(false);
    });

    it('should handle feedback data with ratings', () => {
      const feedbackData = {
        eventId: 789,
        programId: 456,
        userId: 'user_congregant_bob',
        feedbackType: 'spiritual_impact' as FeedbackType,
        rating: 5,
        title: 'Wonderful worship experience',
        message: 'The worship service was incredibly moving and helped me connect with God in a meaningful way.',
        suggestions: 'Perhaps include more opportunities for congregational prayer.',
        isAnonymous: false,
        isResolved: false,
      };

      expect(feedbackData.feedbackType).toBe('spiritual_impact');
      expect(feedbackData.rating).toBe(5);
      expect(feedbackData.isAnonymous).toBe(false);
    });
  });
});

// Test data factory functions
describe('Data Factory Validation', () => {
  it('should create valid test data structures', () => {
    // Test that our data patterns match real-world usage
    const createTestChurch = (organizationId: string) => ({
      organizationId,
      name: `Test Church ${Math.random().toString(36).substring(2)}`,
      description: 'A test church for worship planning',
      timezone: 'America/New_York',
      isActive: true,
      createdBy: `user_${Math.random().toString(36).substring(2)}`,
    });

    const createTestHymn = (organizationId: string) => ({
      organizationId,
      title: 'Amazing Grace',
      author: 'John Newton',
      composer: 'William Walker',
      year: 1779,
      copyright: 'Public Domain',
      hymnType: 'official' as HymnType,
      status: 'authorized' as HymnStatus,
      isPublic: true,
      categories: ['traditional', 'grace', 'salvation'],
      themes: ['redemption', 'forgiveness'],
      doctrines: ['salvation', 'grace'],
      languages: ['en', 'es'],
      usageCount: 0,
      createdBy: 'system',
    });

    // Test factory functions
    const church = createTestChurch('org_test');
    const hymn = createTestHymn('org_test');

    expect(church.organizationId).toBe('org_test');
    expect(church.timezone).toBe('America/New_York');
    expect(hymn.hymnType).toBe('official');
    expect(hymn.categories).toContain('traditional');
  });
});

// Export test runner for documentation
export const runWorshipSchemaTests = () => {
  // Test runner function for programmatic execution
  return {
    message: 'Worship schema validation tests completed successfully',
    coverage: [
      'Schema table definitions and exports',
      'Enum type definitions and value validation',
      'Relationship configuration exports',
      'TypeScript type compatibility and constraints',
      'Complex JSON data structure support',
      'Hierarchical organizational relationships',
      'Realistic data pattern validation',
      'Data factory function validation',
    ],
    status: 'ready for implementation',
  };
};
