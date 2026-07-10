# PlaySlot

Web aplikacija za online rezervaciju fudbalskih termina (MVP).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Supabase (Auth, PostgreSQL, Realtime)
- shadcn/ui + Tailwind CSS v4
- next-intl (SR / EN)

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill in Supabase keys and optional RESEND / CRON secrets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase

1. Create a Supabase project (or use local stack).
2. Apply migrations from `supabase/migrations/`.
3. In **Authentication → URL Configuration** (localhost):
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`, `http://localhost:3000/auth/callback`

### Environment variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server notifications / maintenance)

Optional:

- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — booking emails
- `CRON_SECRET` — protects `/api/cron/maintenance`

### Scheduled jobs

Pending booking expiry (24h) and slot-lock cleanup run via:

```
GET /api/cron/maintenance
Authorization: Bearer <CRON_SECRET>
```

On Vercel, `vercel.json` schedules this every 15 minutes when `CRON_SECRET` is set.

For local dev, call the endpoint manually or use an external cron.

## Manual testing

Create test accounts in Supabase Auth (email verification required):

| Role   | Suggested email     |
|--------|-----------------------|
| Host   | `host@test.com`       |
| Player | `player@test.com`     |

Use any password meeting the policy (min 8 chars, 1 number).

## Docs

- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/Tech.md`](docs/Tech.md) — architecture
- [`docs/DB.md`](docs/DB.md) — database schema

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # production server
```
