# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on port 3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint check
```

No test suite is configured.

## Architecture

This is a **Next.js 14 full-stack AI virtual try-on web application**. Users upload photos and generate virtual clothing try-on images via the Volcano Engine (火山引擎) AI API.

### Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (no separate server)
- **Database**: PostgreSQL on Neon, via TypeORM 0.3 with entity decorators
- **Auth**: JWT (jsonwebtoken) — issued on login/guest, validated in middleware
- **File Storage**: Cloudflare R2 (S3-compatible, via `lib/services/r2.service.ts`)
- **Email**: Resend (`lib/services/email.service.ts`, `bulk-email.service.ts`)
- **Bot Protection**: Cloudflare Turnstile (`components/TurnstileWidget.tsx`)

### Directory Layout

```
app/
  page.tsx            # Home page (client component, main try-on UI)
  layout.tsx          # Root layout
  api/                # API route handlers
    auth/             # register, login, guest, profile
    tryon/            # generate, history, delete
    subscription/     # plans and management
    admin/            # stats, users, email campaigns
  admin/              # Admin dashboard pages
  admin-login/        # Admin login page

lib/
  config/             # database.ts (TypeORM DataSource), env validation
  entities/           # TypeORM entities: User, History, Subscription, UsageRecord, EmailLog, EmailTemplate
  services/           # Business logic
    auth.service.ts
    tryon.service.ts
    volcengine.service.ts   # AI try-on API calls
    r2.service.ts           # File upload/download
    email.service.ts
    bulk-email.service.ts
    turnstile.service.ts
    usage.service.ts
  middleware/         # JWT auth middleware used by API routes

components/
  TurnstileWidget.tsx # Bot protection widget (client component)
```

### Data Model

**User** roles: `guest` / `registered` / `subscriber`. Key fields: `freeUsesRemaining`, `registeredUsesRemaining`, `hasUsedFreeTrial`, `isAdmin`.

**History**: stores try-on records with generated image URLs (stored in R2).

**Subscription**: links user to a plan with expiry and usage limits.

**UsageRecord** / **EmailLog** / **EmailTemplate**: for tracking and admin email campaigns.

### Key Patterns

- API routes call service classes directly — no separate controller layer.
- TypeORM is initialized lazily via `lib/config/database.ts`; `AppDataSource.initialize()` is called at the start of each API route that needs DB access.
- `next.config.js` uses `serverExternalPackages` and webpack fallbacks to prevent TypeORM/pg from being bundled into client code.
- TypeScript decorators are enabled (`experimentalDecorators`, `emitDecoratorMetadata`) for TypeORM entity classes.
- Client components that need auth read JWT from `localStorage` and pass it as `Authorization: Bearer` header.

### Environment Variables

```
DATABASE_URL                        # Neon PostgreSQL connection string
JWT_SECRET
VOLCENGINE_API_KEY
NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY  # Public (client-visible)
CF_TURNSTILE_SECRET_KEY
R2_BUCKET_NAME
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ENDPOINT
R2_PUBLIC_URL
RESEND_API_KEY
```
