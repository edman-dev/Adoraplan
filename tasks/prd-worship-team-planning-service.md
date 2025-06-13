# Product Requirements Document: Worship Team Planning Service

## Introduction/Overview

The Worship Team Planning Service is a comprehensive SaaS platform designed to help churches plan, organize, and execute worship services efficiently. The platform addresses the challenge of coordinating multiple stakeholders (worship leaders, pastors, AV teams, collaborators) in creating structured worship programs that include hymn selection, role assignments, timing, and detailed service flow.

The primary goal is to streamline worship service planning while enabling collaboration, providing clear communication through generated worship programs, and maintaining a centralized hymn library with multimedia capabilities.

## Goals

1. **Streamline Worship Planning:** Reduce the time and effort required to plan worship services by providing a centralized platform for all planning activities.

2. **Enhance Collaboration:** Enable seamless collaboration between worship leaders, pastors, and team members with role-based permissions and real-time updates.

3. **Improve Communication:** Generate professional worship programs that can be shared with all stakeholders including pastors, AV teams, and congregation members.

4. **Create Comprehensive Hymn Library:** Build a searchable, multimedia-rich hymn database with audio synchronization and categorization capabilities.

5. **Provide Flexible Subscription Model:** Offer tiered pricing that scales with church size and collaboration needs.

## User Stories

**As an Admin:**
- I want to manage multiple churches, ministries, and services so that I can organize our multi-campus or network operations effectively.
- I want to control user permissions and roles so that I can maintain proper oversight of worship planning activities.

**As a Worship Leader:**
- I want to create and manage hymns with lyrics, audio, and metadata so that I can build a comprehensive library for our services.
- I want to plan worship services by selecting hymns, assigning roles, and setting timing so that everyone knows their responsibilities.
- I want to collaborate with team members on service planning so that we can create the best possible worship experience.

**As a Pastor:**
- I want to oversee all worship planning activities across ministries so that I can ensure alignment with our church's vision and theology.
- I want to review and approve worship programs before they're finalized so that I can provide spiritual guidance and feedback.
- I want to receive post-service feedback so that I can help improve future worship experiences.

**As a Collaborator:**
- I want to view my assigned roles and responsibilities in worship services so that I can prepare appropriately.
- I want to provide feedback on worship programs so that I can contribute to service improvement.
- I want to receive notifications about my assignments so that I don't miss important responsibilities.

## Functional Requirements

### 1. User Management & Authentication
1.1. The system must support four user roles: Admin, Worship Leader, Pastor, and Collaborator.
1.2. The system must integrate with existing authentication systems (Clerk).
1.3. The system must provide role-based access control for all features.
1.4. The system must support multi-tenancy with organization-level data isolation.

### 2. Organizational Structure
2.1. The system must support a hierarchical structure: Account Owner → Churches → Ministries → Services → Events.
2.2. The system must allow a single account owner to manage up to 100 churches (Tier 3).
2.3. The system must allow each church to have multiple ministries with custom icons and colors.
2.4. The system must allow each ministry to have multiple services (e.g., Sunday Service, Wednesday Prayer).
2.5. The system must allow each service to have multiple scheduled events.

### 3. Hymn Management System
3.1. The system must allow creation of hymns with the following properties:
   - Title, author, year, copyright information
   - Categories, doctrines, verses, themes
   - Multi-language lyrics support
   - Multiple audio file attachments with descriptions
3.2. The system must support three hymn types:
   - Official hymns (system-provided, non-modifiable)
   - User-created hymns (organization-private by default)
   - Public hymns (user-created hymns marked as public)
3.3. The system must provide audio-lyric synchronization with browser-based karaoke playback.
3.4. The system must allow users to mark their hymns as "public" for sharing across organizations.
3.5. The system must provide categorization for public hymns (authorized vs. not-reviewed).
3.6. The system must support full-screen hymn preview mode.

### 4. Worship Program Management
4.1. The system must allow creation of worship programs with the following components:
   - Church identification
   - Ministry specification
   - Service details
   - Event instance (date and time)
   - Up to 25 hymns per program with custom ordering
   - Team member assignments with specific roles
4.2. The system must support collaborative workflow with draft and published states.
4.3. The system must generate markdown files from program data that can be rendered for viewing.
4.4. The system must allow manual editing of approved markdown files with role-based permissions.
4.5. The system must track all changes to manually edited markdown files with version history.
4.6. The system must show deltas between markdown versions when requested.

### 5. Calendar & Event Management
5.1. The system must provide a calendar view showing all planned events.
5.2. The system must support recurring event patterns:
   - Weekly
   - Monthly
   - Custom patterns (e.g., "first Sunday of each month")
5.3. The system must display events with ministry-specific colors and icons.
5.4. The system must distinguish between series events, recurrent events, and one-time events.
5.5. The system must allow filtering calendar view by user permissions.

### 6. Collaboration & Notifications
6.1. The system must send in-app notifications for:
   - Role assignments
   - Program status changes
   - Approval requests
   - Manual markdown edits
6.2. The system must support future email notifications.
6.3. The system must allow permission-based feedback and notes on programs.
6.4. The system must enable sharing of worship programs with specific stakeholders.

### 7. Post-Event Feedback System
7.1. The system must automatically trigger surveys after events are completed.
7.2. The system must send surveys to all program collaborators and key users (pastors).
7.3. The system must collect feedback on technical issues, spiritual impact, and improvement suggestions.
7.4. The system must provide feedback analytics and reporting.

### 8. Subscription Tiers
8.1. The system must enforce the following tier limitations:
   - **Tier 1 (Free):** 1 church, 5 ministries, 5 collaborators
   - **Tier 2 (Team):** 1 church, 25 ministries, unlimited collaborators
   - **Tier 3 (Pro):** Unlimited churches, ministries, and collaborators
8.2. The system must provide appropriate upgrade prompts when limits are reached.

## Non-Goals (Out of Scope)

1. **Direct AV System Integration:** The system will not directly integrate with audio/visual equipment or presentation software.
2. **Live Streaming Capabilities:** The platform will not provide live streaming or broadcast functionality.
3. **Financial Management:** The system will not handle church finances, donations, or payment processing beyond subscription management.
4. **Congregation Management:** The system will not manage congregation member information or attendance beyond worship team participants.
5. **Sermon Preparation:** The system will not include sermon writing or preparation tools.
6. **Mobile App:** Initial release will be web-based only, with mobile responsiveness.

## Design Considerations

1. **Markdown Editor:** Implement TipTap.dev for rich text editing of markdown files with collaborative features.
2. **Audio Synchronization:** Develop custom audio player with lyric synchronization capabilities, allowing user-adjustable timing.
3. **Calendar Interface:** Use ministry colors and icons for quick visual identification of events.
4. **Responsive Design:** Ensure full functionality across desktop, tablet, and mobile devices.
5. **Accessibility:** Follow WCAG guidelines for screen readers and keyboard navigation.
6. **Multi-language Support:** Leverage existing i18n infrastructure for interface localization.

## Technical Considerations

1. **Database Schema:** Extend existing Drizzle ORM schema to include worship-specific entities (hymns, programs, events, assignments).
2. **File Storage:** Implement secure audio file storage with appropriate compression and format conversion.
3. **Real-time Collaboration:** Consider WebSocket implementation for real-time collaborative editing of programs.
4. **Audio Processing:** Implement server-side audio processing for format conversion and compression.
5. **Version Control:** Implement git-like versioning for markdown file changes with diff capabilities.
6. **Caching Strategy:** Implement appropriate caching for hymn audio files and frequently accessed program data.

## Success Metrics

1. **User Adoption:** 100+ churches using the platform within 6 months of launch.
2. **Engagement:** Average of 3+ worship programs created per church per month.
3. **Collaboration:** 80% of programs involve multiple collaborators.
4. **Retention:** 85% monthly retention rate for active churches.
5. **Upgrade Rate:** 25% of free tier users upgrade to paid tiers within 3 months.
6. **User Satisfaction:** Average rating of 4.5/5 on post-event surveys.
7. **Feature Usage:** 70% of users utilize the hymn library functionality.

## Open Questions

1. **Copyright Compliance:** How will the platform handle copyright verification for user-uploaded hymns and music?
2. **Data Export:** Should users be able to export their hymn libraries and program data?
3. **Offline Capabilities:** Should the platform support offline program viewing or editing?
4. **Third-party Integrations:** Which church management systems should be prioritized for future integration?
5. **Scalability:** What are the expected peak usage patterns (Sunday morning preparation rush)?
6. **Backup Strategy:** How should user-generated content (hymns, programs) be backed up and protected?
7. **International Expansion:** What localization considerations are needed for different countries' worship traditions?
