# Product Requirements Document: Backend Layout Restructuring

## Introduction/Overview

This document outlines the requirements for restructuring the backend layout of Adoraplan from a basic navigation structure (Home | Members | Settings) to a more comprehensive and scalable dashboard interface following the shadcn dashboard-01 pattern. This restructuring will provide a familiar admin interface that can grow with the application and accommodate future features for church management.

## Goals

1. Replace the current basic navigation with a scalable, modern dashboard layout
2. Implement a navigation structure that supports multiple user roles (Admins, Organization Managers, Pastors, Ministry Leaders)
3. Create placeholder sections for future feature development
4. Provide a familiar and intuitive interface for church administration
5. Maintain consistency with the shadcn dashboard-01 design pattern

## User Stories

1. **As an admin**, I want to see an overview dashboard so I can see the status of the latest services planned for the different ministries in my church
2. **As a Pastor**, I want to log in to see the program of the Sunday service and add modifications and comments as needed
3. **As an Organization Manager**, I want to easily navigate between different management sections so I can efficiently oversee church operations
4. **As a Ministry Leader**, I want to access ministry-specific features through a clear navigation structure

## Functional Requirements

1. **Navigation Structure Implementation**
   - The system must replace the current navigation (Home | Members | Settings) with new sections: Dashboard | Organization | Programs | Hymns | Subscription | Settings
   - The navigation must follow the shadcn dashboard-01 pattern for consistency
   - Each navigation item must route to its respective page/component

2. **Dashboard Section**
   - The system must display a placeholder dashboard page with a "To be built" label
   - The dashboard must show the current user's role and organization context
   - The layout must accommodate future widgets for service status and ministry overview

3. **Organization Section**
   - The system must provide a placeholder page for organization management
   - The page must include a "To be built" label
   - The structure must support future features for church and ministry management

4. **Programs Section**
   - The system must create a placeholder for program management
   - The page must include a "To be built" label
   - The layout must support future service planning and modification features

5. **Hymns Section**
   - The system must implement a placeholder for hymn management
   - The page must include a "To be built" label
   - The structure must support future hymn library and selection features

6. **Subscription Section**
   - The system must provide a placeholder for subscription management
   - The page must include a "To be built" label
   - The layout must integrate with existing Stripe subscription functionality

7. **Settings Section**
   - The system must maintain/adapt the existing settings functionality
   - The settings must be accessible through the new navigation structure

8. **User Context Integration**
   - The system must display the current user's session information
   - The system must show the user's organization context
   - The navigation must respect user roles and permissions

9. **Visual Indicators**
   - Each placeholder section must clearly display "To be built" labels
   - The labels must be visually distinct but not disruptive to the overall design

## Non-Goals (Out of Scope)

1. Implementation of actual functionality for Dashboard, Organization, Programs, Hymns sections
2. Backend API development for new features
3. Database schema changes for new data models
4. User role and permission system modifications
5. Dark mode implementation
6. Mobile-responsive navigation (unless already part of shadcn dashboard-01)

## Design Considerations

1. **Shadcn Dashboard-01 Pattern**
   - Follow the exact navigation layout from shadcn dashboard-01
   - Use consistent spacing, typography, and color schemes
   - Implement the same interaction patterns (hover states, active indicators)

2. **Component Structure**
   - Utilize existing shadcn UI components from the project
   - Maintain consistency with Tailwind CSS styling
   - Keep the existing design system intact

3. **Placeholder Design**
   - Create a reusable placeholder component for "To be built" sections
   - Include clear messaging about future development
   - Maintain professional appearance despite placeholder status

## Technical Considerations

1. **Tech Stack**
   - Next.js with App Router (existing)
   - TypeScript for type safety
   - Tailwind CSS with shadcn UI components
   - Clerk for authentication and user management

2. **Routing Structure**
   - Implement routes under `/dashboard/*` for new sections
   - Maintain existing authentication middleware
   - Ensure proper route protection based on user authentication

3. **State Management**
   - Integrate with existing Clerk session management
   - Pass organization context to all dashboard pages
   - Maintain user role information throughout navigation

4. **Migration Strategy**
   - Replace existing navigation incrementally
   - Ensure backward compatibility during transition
   - Maintain all existing functionality in Settings

## Success Metrics

1. Successful replacement of old navigation with new dashboard structure
2. All placeholder pages are accessible and clearly marked
3. User session and organization context displayed correctly
4. Navigation follows shadcn dashboard-01 pattern exactly
5. Existing Settings functionality remains intact
6. No regression in current authentication flow
7. Clean, professional appearance ready for future development

## Open Questions

1. Should the old "Members" section functionality be moved to the Organization section or remain in Settings?
2. Are there any specific icons preferred for each navigation section?
3. Should we implement breadcrumb navigation for better user orientation?
4. Do we need to consider any specific branding elements in the dashboard header?
5. Should placeholder sections show any preview of future functionality or just "To be built" messages?
