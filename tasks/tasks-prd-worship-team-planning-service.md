# Task List: Worship Team Planning Service

## Relevant Files

- `src/models/WorshipSchema.ts` - Database schema definitions for worship-specific entities (churches, ministries, hymns, programs, events) ✅ CREATED
- `src/models/WorshipSchema.test.ts` - Unit tests for schema validations and relationships ✅ CREATED
- `src/features/worship/types/index.ts` - TypeScript type definitions for worship entities ✅ CREATED
- `src/lib/worship-role-utils.ts` - Worship-specific role utilities and permissions ✅ CREATED
- `src/lib/worship-role-utils.test.ts` - Unit tests for worship role utilities ✅ CREATED
- `src/lib/worship-role-management.ts` - Server-side Clerk role management utilities ✅ CREATED
- `src/contexts/user-context.tsx` - Updated user context with worship role support ✅ UPDATED
- `src/middleware/worship-auth.ts` - Role-based middleware for protecting worship routes ✅ CREATED
- `src/middleware/worship-auth.test.ts` - Unit tests for worship authentication middleware ✅ CREATED
- `src/lib/worship-auth-server.ts` - Server-side authentication utilities for server components ✅ CREATED
- `src/hooks/use-worship-auth.ts` - Client-side React hook for worship authentication ✅ CREATED
- `src/hooks/use-worship-auth.test.tsx` - Unit tests for worship auth hook ✅ CREATED
- `src/lib/worship-user-management.ts` - Organization-level user management utilities ✅ CREATED
- `src/lib/worship-user-management.test.ts` - Unit tests for user management utilities ✅ CREATED
- `src/hooks/use-user-management.ts` - React hook for user management operations ✅ CREATED
- `src/hooks/use-user-management.test.ts` - Unit tests for user management hook ✅ CREATED
- `src/components/worship/user-management.tsx` - User management interface component ✅ CREATED
- `src/components/worship/invite-user-dialog.tsx` - Dialog for inviting new users ✅ CREATED
- `src/components/worship/update-role-dialog.tsx` - Dialog for updating user roles ✅ CREATED
- `src/app/api/worship/users/route.ts` - API endpoints for user listing and invitations ✅ CREATED
- `src/app/api/worship/users/route.test.ts` - Unit tests for user listing and invitation API endpoints ✅ CREATED
- `src/app/api/worship/users/[userId]/route.ts` - API endpoints for user role updates and removal ✅ CREATED
- `src/app/api/worship/users/[userId]/route.test.ts` - Unit tests for user role update and removal API endpoints ✅ CREATED
- `src/app/api/worship/invitations/[invitationId]/route.ts` - API endpoints for invitation management ✅ CREATED
- `src/app/api/worship/invitations/[invitationId]/route.test.ts` - Unit tests for invitation management API endpoints ✅ CREATED
- `src/app/[locale]/(auth)/dashboard/organization/users/page.tsx` - User management page ✅ CREATED
- `src/components/worship/access-control.tsx` - Component-level access control utilities ✅ CREATED
- `src/components/worship/access-control.test.tsx` - Unit tests for access control components ✅ CREATED
- `src/components/worship/role-management-dashboard.tsx` - Comprehensive role management dashboard ✅ CREATED
- `src/components/worship/role-management-dashboard.test.tsx` - Unit tests for role management dashboard ✅ CREATED
- `src/components/ui/card.tsx` - Card UI component ✅ CREATED
- `src/components/ui/select.tsx` - Select UI component ✅ CREATED
- `src/components/ui/progress.tsx` - Progress UI component ✅ CREATED
- `src/components/ui/tabs.tsx` - Tabs UI component ✅ CREATED
- `src/features/worship/components/ChurchManagement.tsx` - Church creation and management interface
- `src/features/worship/components/ChurchManagement.test.tsx` - Unit tests for church management component
- `src/features/worship/components/MinistryManagement.tsx` - Ministry creation with icons and colors
- `src/features/worship/components/MinistryManagement.test.tsx` - Unit tests for ministry management
- `src/features/worship/components/HymnLibrary.tsx` - Hymn creation, editing, and library management
- `src/features/worship/components/HymnLibrary.test.tsx` - Unit tests for hymn library functionality
- `src/features/worship/components/HymnPlayer.tsx` - Audio player with lyric synchronization
- `src/features/worship/components/HymnPlayer.test.tsx` - Unit tests for audio player functionality
- `src/features/worship/components/ProgramBuilder.tsx` - Worship program creation and editing interface
- `src/features/worship/components/ProgramBuilder.test.tsx` - Unit tests for program builder
- `src/features/worship/components/WorshipCalendar.tsx` - Calendar view with event management
- `src/features/worship/components/WorshipCalendar.test.tsx` - Unit tests for calendar functionality
- `src/features/worship/components/MarkdownEditor.tsx` - TipTap-based markdown editor for programs
- `src/features/worship/components/MarkdownEditor.test.tsx` - Unit tests for markdown editor
- `src/features/worship/components/NotificationCenter.tsx` - In-app notification management
- `src/features/worship/components/FeedbackSurvey.tsx` - Post-event feedback collection interface
- `src/app/api/worship/hymns/route.ts` - API endpoints for hymn CRUD operations
- `src/app/api/worship/programs/route.ts` - API endpoints for program management
- `src/app/api/worship/events/route.ts` - API endpoints for event scheduling
- `src/app/api/worship/audio/upload/route.ts` - Audio file upload and processing endpoint
- `src/app/api/worship/feedback/route.ts` - Feedback collection and analytics endpoint
- `src/libs/audio/AudioProcessor.ts` - Audio file processing and compression utilities
- `src/libs/audio/AudioProcessor.test.ts` - Unit tests for audio processing
- `src/libs/worship/SubscriptionLimits.ts` - Tier limit enforcement utilities
- `src/libs/worship/SubscriptionLimits.test.ts` - Unit tests for subscription limits
- `src/utils/worship/MarkdownGenerator.ts` - Program data to markdown conversion utilities
- `src/utils/worship/MarkdownGenerator.test.ts` - Unit tests for markdown generation
- `src/utils/worship/NotificationTemplates.ts` - Notification message templates
- `migrations/0001_nappy_justin_hammer.sql` - Database migration for worship-specific tables ✅ GENERATED

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npm run test` to run all tests with Vitest
- Database migrations are generated with `npm run db:generate` after schema changes
- Audio files will be stored in a secure cloud storage solution (to be configured)

## Tasks

- [x] 1.0 Database Schema & Data Models Setup
  - [x] 1.1 Create worship-specific database schema in `src/models/WorshipSchema.ts` with tables for churches, ministries, services, events, hymns, programs, assignments, and feedback
  - [x] 1.2 Define relationships between worship entities (foreign keys, constraints)
  - [x] 1.3 Add indexes for performance on frequently queried fields (organization_id, user_id, event_date)
  - [x] 1.4 Create TypeScript types in `src/features/worship/types/index.ts` matching database schema
  - [x] 1.5 Generate and test database migration files
  - [x] 1.6 Write unit tests for schema validations and relationship constraints

- [x] 2.0 User Role Management & Authentication Extension
  - [x] 2.1 Extend existing Clerk user metadata to include worship-specific roles (Admin, Worship Leader, Pastor, Collaborator)
  - [x] 2.2 Create role-based middleware for protecting worship-related routes
  - [x] 2.3 Implement organization-level user management (invite, assign roles, remove users)
  - [x] 2.4 Add role validation utilities for component-level access control
  - [x] 2.5 Create user role management interface in dashboard
  - [x] 2.6 Write unit tests for role validation and middleware functions

- [ ] 3.0 Organizational Structure Management (Churches, Ministries, Services)
  - [ ] 3.1 Build church creation and management interface with CRUD operations
  - [ ] 3.2 Implement ministry management with custom icons and color selection
  - [ ] 3.3 Create service type management (Sunday Service, Wednesday Prayer, etc.)
  - [ ] 3.4 Add hierarchical navigation between churches → ministries → services
  - [ ] 3.5 Implement subscription tier validation for church/ministry limits
  - [ ] 3.6 Build admin dashboard for organizational oversight
  - [ ] 3.7 Write comprehensive unit tests for all organizational components

- [ ] 4.0 Hymn Management System with Audio Synchronization
  - [ ] 4.1 Create hymn library interface with search, filter, and categorization
  - [ ] 4.2 Build hymn creation form with metadata fields (title, author, year, copyright, categories)
  - [ ] 4.3 Implement multi-language lyrics support with language switching
  - [ ] 4.4 Build audio file upload system with format validation and compression
  - [ ] 4.5 Create audio player component with lyric synchronization timeline
  - [ ] 4.6 Implement full-screen hymn preview mode with karaoke-style playback
  - [ ] 4.7 Add public/private hymn sharing functionality with authorization levels
  - [ ] 4.8 Create playlist generation from selected hymns
  - [ ] 4.9 Write unit tests for all hymn management features

- [ ] 5.0 Worship Program Creation & Collaboration Features
  - [ ] 5.1 Build program creation interface with church/ministry/service/event selection
  - [ ] 5.2 Implement hymn selection and ordering system (up to 25 hymns per program)
  - [ ] 5.3 Create team member assignment interface with role specification
  - [ ] 5.4 Implement collaborative editing with draft/published workflow states
  - [ ] 5.5 Build markdown generation system from program data
  - [ ] 5.6 Integrate TipTap editor for manual markdown editing with role-based permissions
  - [ ] 5.7 Implement version control system for tracking markdown changes with diff visualization
  - [ ] 5.8 Add program sharing functionality with stakeholder-specific permissions
  - [ ] 5.9 Create program duplication and template system for recurring services
  - [ ] 5.10 Write comprehensive unit tests for program creation and collaboration features

- [ ] 6.0 Calendar & Event Management System
  - [ ] 6.1 Build calendar interface with month/week/day views
  - [ ] 6.2 Implement event creation with one-time, recurring, and series patterns
  - [ ] 6.3 Add ministry-specific color coding and icon display on calendar
  - [ ] 6.4 Create recurring event pattern engine (weekly, monthly, custom patterns)
  - [ ] 6.5 Implement event filtering by user permissions and ministry access
  - [ ] 6.6 Build event detail modal with worship program association
  - [ ] 6.7 Add drag-and-drop event rescheduling functionality
  - [ ] 6.8 Implement calendar export functionality (iCal format)
  - [ ] 6.9 Write unit tests for calendar and event management features

- [ ] 7.0 Notification & Feedback Systems
  - [ ] 7.1 Build in-app notification center with real-time updates
  - [ ] 7.2 Implement notification triggers for role assignments, status changes, approvals, and edits
  - [ ] 7.3 Create notification templates and delivery system
  - [ ] 7.4 Build post-event feedback survey system with automated triggers
  - [ ] 7.5 Implement feedback collection interface with categorized questions
  - [ ] 7.6 Create feedback analytics dashboard with reporting capabilities
  - [ ] 7.7 Add email notification infrastructure for future implementation
  - [ ] 7.8 Implement permission-based feedback and notes system on programs
  - [ ] 7.9 Write unit tests for notification and feedback systems

- [ ] 8.0 Subscription Tier Enforcement & Billing Integration
  - [ ] 8.1 Implement tier limit validation utilities (churches, ministries, collaborators)
  - [ ] 8.2 Create upgrade prompts and limit reached notifications
  - [ ] 8.3 Build subscription management interface with tier comparison
  - [ ] 8.4 Integrate with existing Stripe billing system for worship-specific plans
  - [ ] 8.5 Add usage tracking and analytics for billing insights
  - [ ] 8.6 Implement feature gating based on subscription tiers
  - [ ] 8.7 Create admin tools for subscription override and management
  - [ ] 8.8 Write unit tests for subscription enforcement and billing integration
