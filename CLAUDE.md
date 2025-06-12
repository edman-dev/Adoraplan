# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adoraplan is a Next.js 14+ SaaS boilerplate with enterprise-grade features including authentication (Clerk), multi-tenancy, billing (Stripe), and internationalization. It uses TypeScript with strict mode, Tailwind CSS for styling, and Drizzle ORM for database operations.

## Common Development Commands

### Development
```bash
npm run dev                 # Start all dev services (Next.js + Sentry Spotlight)
npm run dev:next           # Start only Next.js dev server
```

### Building and Production
```bash
npm run build              # Create production build
npm run start              # Start production server
npm run build-stats        # Analyze bundle size
```

### Code Quality
```bash
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix linting issues
npm run check-types        # TypeScript type checking
npm run commit             # Interactive commit with Commitizen
```

### Testing
```bash
npm run test               # Run unit tests with Vitest
npm run test:e2e           # Run E2E tests with Playwright
npm run test-storybook:ci  # Run Storybook tests
```

### Database
```bash
npm run db:generate        # Generate database migrations
npm run db:migrate         # Apply migrations (production)
npm run db:studio          # Open Drizzle Studio for database exploration
```

### Stripe Setup
```bash
stripe login               # Authenticate Stripe CLI
npm run stripe:setup-price # Create new Stripe price
```

## Architecture Overview

### Directory Structure
- `src/app/[locale]/` - Next.js App Router pages with i18n support
  - `(auth)/` - Authenticated routes (dashboard, profiles, organization)
  - `(unauth)/` - Public routes (landing, sign-in, sign-up)
- `src/features/` - Feature-specific components organized by domain
- `src/models/` - Database models using Drizzle ORM
- `src/libs/` - Third-party library configurations
- `src/utils/` - Shared utilities and configurations

### Key Architectural Patterns

1. **Authentication Flow**: Clerk handles all auth including social logins, MFA, and passkeys. The middleware in `src/middleware.ts` protects routes and manages redirects.

2. **Multi-tenancy**: Organizations are the primary tenant model. Users can belong to multiple organizations with role-based permissions.

3. **Database Architecture**:
   - Uses Drizzle ORM with PostgreSQL
   - Schema defined in `src/models/Schema.ts`
   - Automatic migrations on build
   - Local development uses PGlite for offline capability

4. **Internationalization**:
   - Powered by next-intl with locale detection
   - Translations in `src/locales/`
   - Crowdin integration for translation management

5. **Billing System**:
   - Stripe integration for subscriptions
   - Webhook handling in `src/app/api/stripe/webhook/`
   - Customer portal for self-service management

6. **Component Architecture**:
   - Shadcn UI components in `src/components/ui/`
   - Feature components grouped by domain in `src/features/`
   - Shared templates in `src/templates/`

### Environment Configuration

Key environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk auth
- `CLERK_SECRET_KEY` - Clerk server-side
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe client
- `STRIPE_SECRET_KEY` - Stripe server-side (in .env.local)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhooks (in .env.local)

### Testing Strategy

- **Unit Tests**: Vitest with React Testing Library, co-located with source files
- **E2E Tests**: Playwright for critical user flows
- **Visual Testing**: Storybook for component development
- **Monitoring Tests**: Checkly tests (`*.check.e2e.ts`) for production monitoring

### Error Handling & Monitoring

- Sentry for error tracking (auto-configured)
- Pino.js for structured logging
- Better Stack integration for log management (requires `LOGTAIL_SOURCE_TOKEN`)

### Important Conventions

1. **Commit Messages**: Use Conventional Commits format via `npm run commit`
2. **Code Style**: ESLint + Prettier auto-formatting on save
3. **Type Safety**: Strict TypeScript mode enforced
4. **Database Changes**: Always generate migrations after schema updates
5. **Component Creation**: Follow existing patterns in `src/features/`
