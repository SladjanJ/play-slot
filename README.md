# PlaySlot

**Online football pitch booking for the Balkans and beyond.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![next-intl](https://img.shields.io/badge/next--intl-i18n-000000?style=flat-square)](https://next-intl.dev/)
[![Zod](https://img.shields.io/badge/Zod-validation-3E67B1?style=flat-square&logo=zod&logoColor=white)](https://zod.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-deploy-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

PlaySlot is an MVP web application that connects **Players** who want to book football time slots with **Hosts** who manage a single pitch. Hosts configure working hours, pricing, and confirmation rules; Players search, book, and cancel in real time — with no online payment (pay on arrival).

Languages: **Serbian (SR)** and **English (EN)**.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [User roles & flows](#user-roles--flows)
- [Business rules](#business-rules)
- [Routes](#routes)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Database migrations](#database-migrations)
- [Scheduled maintenance](#scheduled-maintenance)
- [Deployment](#deployment)
- [Manual testing & demo](#manual-testing--demo)
- [Security](#security)
- [Documentation](#documentation)
- [Scripts](#scripts)
- [Roadmap (post-MVP)](#roadmap-post-mvp)

---

## Features

### Authentication
- Register as **Player** or **Host**
- Email verification (required before app access)
- Login, logout, forgot password, reset password
- Password visibility toggle on all password fields

### Host
- Onboarding wizard: company details, map pin (Leaflet + OpenStreetMap), working hours, slot duration, pricing, confirmation mode
- Publish venue when setup is complete
- Dashboard with calendar (player names on booked slots), today’s bookings, pending queue
- Approve / reject pending reservations
- Settings: update profile, working hours, pricing, confirmation mode (with mass-cancel warning when switching pending → auto)

### Player
- Search pitches by company name + country/city filter
- Header search bar (desktop & mobile)
- Venue calendar with live availability, consecutive slot selection, 3-minute checkout lock
- Auto or pending confirmation (host-defined)
- My bookings page with cancellation (mandatory reason)
- Realtime calendar updates when others book or cancel

### Notifications
- **In-app:** bell icon in header → `/notifications`
- **Email:** booking confirmed, pending, approved, rejected, expired, cancelled, mass cancel (via [Resend](https://resend.com), optional)

### Internationalization
- First-visit language popup (auto-detect from browser)
- Locale prefix on marketing pages (`/sr`, `/en`); app routes use cookie
- Language switcher in footer; choice persisted in `NEXT_LOCALE` cookie

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | shadcn/ui (Base UI), Tailwind CSS v4, Hugeicons |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime) |
| i18n | next-intl |
| Maps | react-leaflet + OpenStreetMap (no API key) |
| Email | Resend (optional, server-side) |
| Validation | Zod |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Architecture

```
src/
├── app/
│   ├── [locale]/           # Landing, login, register, verify-email, auth pages
│   ├── (app)/              # Authenticated app (no locale prefix)
│   │   ├── search/
│   │   ├── venues/[slug]/
│   │   ├── bookings/
│   │   ├── notifications/
│   │   └── host/
│   │       ├── setup/
│   │       ├── dashboard/
│   │       └── settings/
│   ├── actions/            # Server actions (auth, booking, host, notifications)
│   ├── api/                # Health check, cron maintenance
│   └── auth/callback/      # Supabase OAuth / email callback
├── components/             # UI, auth, host, player, layout
├── lib/                    # Supabase clients, booking engine, i18n helpers, email
├── i18n/                   # next-intl routing & navigation
├── messages/               # en.json, sr.json
└── proxy.ts                # Locale routing + Supabase session + auth guards
```

**Auth guards** (`src/lib/supabase/middleware.ts` via `proxy.ts`):
- Unauthenticated users → login
- Unverified email → verify-email page
- Host without published venue → `/host/setup`
- Role isolation: Players cannot access `/host/*`; Hosts cannot access player booking routes

**Booking concurrency:**
- UI lock: 3-minute `slot_locks` row during checkout
- DB: partial unique index + `EXCLUDE` constraint on overlapping active bookings
- Realtime: Supabase channels on `bookings` and `slot_locks`

---

## User roles & flows

| Role | Description |
|------|-------------|
| **Player** | Search venues, view calendar, book and cancel slots |
| **Host** | Owns one venue; manages setup, calendar, and reservations |
| **Admin** | Reserved for future use (no UI in MVP) |

### Typical demo path

1. **Host** registers → verifies email → completes setup wizard → publishes venue
2. **Player** registers → verifies email → searches → opens venue → books slot(s)
3. If pending mode: Host approves or rejects from dashboard
4. Player can cancel (≥ 5 h before start) with a required reason
5. Both see calendar update in realtime; notifications appear in bell icon

---

## Business rules

| Rule | Value |
|------|-------|
| Venues per Host account | 1 |
| Minimum booking lead time | 1 hour before slot start |
| Minimum cancellation window | 5 hours before slot start |
| Pending reservation timeout | 24 hours → `expired` |
| Checkout slot lock | 3 minutes |
| Payment | On arrival (no online payment) |
| Default currency | RSD (Serbia), EUR (other countries) |
| Sport (MVP) | Football only |

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/`, `/sr`, `/en` | Public | Landing + language selection |
| `/[locale]/login` | Public | Login |
| `/[locale]/register` | Public | Register (Player or Host) |
| `/[locale]/verify-email` | Auth | Email verification |
| `/[locale]/forgot-password` | Public | Request reset link |
| `/[locale]/reset-password` | Auth | Set new password |
| `/search` | Player | Search published venues |
| `/venues/[slug]` | Player | Calendar + booking |
| `/bookings` | Player | My reservations |
| `/notifications` | Auth | In-app notifications |
| `/host/setup` | Host | Onboarding wizard |
| `/host/dashboard` | Host | Calendar + pending panel |
| `/host/settings` | Host | Venue settings |
| `/api/health/supabase` | Public | DB connectivity check |
| `/api/cron/maintenance` | Cron secret | Expire pending + cleanup locks |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project

### Install & run

```bash
git clone <your-repo-url>
cd playslot
npm install
cp .env.example .env.local
# Fill in .env.local (see Environment variables)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm run start
```

---

## Environment variables

Copy `.env.example` to `.env.local`. **Never commit `.env.local`.**

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key — safe in browser; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for notifications and maintenance (**never expose to client**) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | No | Default locale (`sr` or `en`); defaults to `sr` |
| `CRON_SECRET` | Recommended | Bearer token for `/api/cron/maintenance` |
| `RESEND_API_KEY` | Optional | Enables booking notification emails |
| `RESEND_FROM_EMAIL` | Optional | Sender address for Resend |

Without `RESEND_API_KEY`, emails are skipped (in-app notifications still work if `SUPABASE_SERVICE_ROLE_KEY` is set).

---

## Supabase setup

### 1. Create a project

Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).

### 2. Apply migrations

Apply all SQL files in `supabase/migrations/` in chronological order.

**Using Supabase CLI** (recommended):

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

If local and remote migration histories diverge, apply the latest migrations manually via **SQL Editor** in the Supabase Dashboard.

### 3. Authentication URLs

In **Authentication → URL Configuration**:

| Setting | Local dev | Production |
|---------|-----------|------------|
| Site URL | `http://localhost:3000` | `https://your-domain.com` |
| Redirect URLs | `http://localhost:3000/**`, `http://localhost:3000/auth/callback` | `https://your-domain.com/**`, `https://your-domain.com/auth/callback` |

### 4. Realtime

Phase 5 migration adds `bookings` and `slot_locks` to the `supabase_realtime` publication. Ensure Realtime is enabled for your project.

### 5. Seed data

Migration `20260705180007_seed_countries_cities.sql` seeds Balkan countries and major cities (RS, BA, ME, HR, MK, AL, SI).

---

## Database migrations

| Migration | Purpose |
|-----------|---------|
| `20260705180001` | Extensions, countries, cities lookup |
| `20260705180002` | Profiles + auth trigger |
| `20260705180003` | Venues, working hours |
| `20260705180004` | Bookings, slot locks, overlap constraints |
| `20260705180005` | Notifications table |
| `20260705180006` | RLS policies |
| `20260705180007` | Seed countries & cities |
| `20260705180008` | Maintenance functions |
| `20260707190000` | Cities unique index |
| `20260710140000` | Booking occupancy RLS |
| `20260710150000` | Host booking players RLS |
| `20260710160000` | Player/host contact RLS |
| `20260710170000` | Realtime publication, `create_notification`, pg_cron lock cleanup |
| `20260710180000` | `expire_pending_bookings` returns IDs for notification hook |

Full schema details: [`docs/DB.md`](docs/DB.md).

---

## Scheduled maintenance

The endpoint `GET /api/cron/maintenance` (protected by `Authorization: Bearer <CRON_SECRET>`):

1. Deletes expired slot locks
2. Expires pending bookings older than 24 hours
3. Sends in-app + email notifications for expired bookings

**Vercel:** `vercel.json` runs this every 15 minutes when deployed with `CRON_SECRET` set.

**Local dev:** trigger manually:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/maintenance
```

---

## Deployment

### Vercel (frontend)

1. Import the Git repository into [Vercel](https://vercel.com)
2. Set all environment variables from [Environment variables](#environment-variables)
3. Deploy — Vercel Cron will use `vercel.json` automatically

### Supabase (backend)

- Database, Auth, and Realtime stay on Supabase
- Update Auth redirect URLs to your production domain
- Ensure all migrations are applied on the production project

---

## Manual testing & demo

### Create test accounts

In Supabase **Authentication → Users** (or via register flow):

| Role | Suggested email | Notes |
|------|-----------------|-------|
| Host | `host@test.com` | Mark email as confirmed, or verify via link |
| Player | `player@test.com` | Same |

Password policy: minimum 8 characters, at least one number.

### Demo checklist

- [ ] Language popup on first visit; SR/EN switch works
- [ ] Host: register → verify → setup → publish
- [ ] Player: register → verify → search → book slot
- [ ] Realtime: open same venue in two browsers; booking updates both calendars
- [ ] Pending flow: approve / reject from host dashboard
- [ ] Player cancels booking (≥ 5 h before start, with reason)
- [ ] Notifications appear in bell icon
- [ ] Emails sent (if `RESEND_API_KEY` configured)

---

## Security

- **RLS** enabled on all application tables
- **Service role key** used only in server code (`src/lib/supabase/admin.ts`); never prefixed with `NEXT_PUBLIC_`
- **Cron endpoint** requires `CRON_SECRET`
- **`.gitignore`** excludes `.env.local`, `.cursor/mcp.json`, certificates, and database dumps
- Input validation via Zod on all forms and server actions

Before pushing to a public repository, confirm no secrets are staged:

```bash
git status
git diff --staged
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, user flows, MVP scope |
| [`docs/Tech.md`](docs/Tech.md) | Architecture, routing, booking engine, conventions |
| [`docs/DB.md`](docs/DB.md) | Database schema, RLS, relationships |
| [`AGENTS.md`](AGENTS.md) | Guidelines for AI-assisted development |

---

## Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

---

## Roadmap (post-MVP)

Not included in the current MVP:

- Online payments (Stripe / local providers)
- Reviews and ratings
- Multiple sports
- Admin panel
- Multiple venues per Host
- Venue photos
- PWA
- Expanded city lists per country

See [`docs/PRD.md` §11](docs/PRD.md) for details.

---

## License

Private project — all rights reserved unless otherwise specified.
