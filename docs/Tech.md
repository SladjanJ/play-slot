# PlaySlot — Technical Architecture

> **Version:** 1.0 (MVP)  
> **Last updated:** 2026-07-09

## 1. Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS v4 |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| i18n | next-intl |
| Maps | Leaflet + OpenStreetMap (no API key) |
| Email | Supabase Auth templates + Edge Functions (Resend recommended) |
| Deployment | Vercel (frontend) + Supabase (backend) — trenutno lokalni dev |

---

## 2. Project Structure (planned)

```
src/
├── app/
│   ├── [locale]/              # Landing, login, register, verify-email (i18n prefix)
│   │   ├── page.tsx           # Landing + header + search
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   └── forgot-password/
│   ├── search/                # Player search (no locale prefix)
│   ├── venues/[slug]/         # Venue calendar + booking
│   ├── bookings/              # Player bookings
│   ├── notifications/
│   └── host/
│       ├── setup/             # Host onboarding wizard
│       ├── dashboard/
│       └── settings/
├── components/
│   ├── ui/                    # shadcn
│   ├── auth/
│   ├── booking/
│   ├── calendar/
│   ├── host/
│   └── layout/
├── lib/
│   ├── supabase/              # client, server, middleware
│   ├── i18n/
│   └── utils/
└── messages/
    ├── en.json
    └── sr.json
```

---

## 3. Routing & i18n

### Locale strategy

- **Landing/marketing:** `/[locale]/...` (`sr`, `en`)
- **App routes:** bez prefiksa (`/search`, `/host/dashboard`)
- Jezik app ruta: cookie / localStorage (postavljen na landing-u)
- Auto-detect: `Accept-Language` browser header na prvom posjetu

### Middleware (`src/proxy.ts`)

Next.js 16 uses `proxy.ts` (replaces deprecated `middleware.ts`).

1. Locale detection via next-intl for `/[locale]/*`
2. Supabase `updateSession` (session refresh + auth guards)
3. Auth guard: unauthenticated → `/login`
4. Email unverified → `/verify-email`
5. Host without published venue → `/host/setup`
6. Role guard: Player ≠ `/host/*`, Host ≠ player booking routes

---

## 4. Authentication

**Provider:** Supabase Auth

| Flow | Implementation |
|------|----------------|
| Register | `supabase.auth.signUp()` + metadata (role) |
| Login | `supabase.auth.signInWithPassword()` |
| Logout | `supabase.auth.signOut()` |
| Verify email | Supabase email link → `/verify-email` + Refresh button |
| Forgot password | `supabase.auth.resetPasswordForEmail()` |

**Profile creation:** Postgres trigger on `auth.users` insert → `profiles` row.

**Password policy:** min 8 znakova, min 1 broj.

**Session:** `@supabase/ssr` — server/client/middleware clients.

---

## 5. Authorization

- Source of truth: `profiles.role` (`player` | `host` | `admin`)
- **Strict RLS** on all tables from day one
- No service-role on client; server actions use authenticated user context
- Helper SQL functions: `get_my_role()`, `is_venue_owner(venue_id)`

---

## 6. Booking Engine

### Slot generation (server-side)

Input: `venue_working_hours`, `slot_duration_minutes`, existing bookings, active locks  
Output: available slot grid for date range

### Booking flow

```
1. Player selects start slot + slot_count
2. INSERT slot_locks (expires_at = now() + 3 min)
3. Player confirms
4. BEGIN transaction
5. Check no overlap (bookings + locks)
6. INSERT booking (confirmed | pending)
7. DELETE slot_lock
8. COMMIT
9. Send emails / notifications
```

### Concurrency

- **UI lock:** 3 min `slot_locks` row
- **DB constraint:** unique partial index on `(venue_id, start_at, end_at)` for active bookings
- **Realtime:** subscribe to `bookings` changes on venue

### Pending expiry

- Scheduled Edge Function or pg_cron: every 15 min
- `UPDATE bookings SET status = 'expired' WHERE status = 'pending' AND created_at < now() - interval '24 hours'`

### Lock cleanup

- Scheduled job: `DELETE FROM slot_locks WHERE expires_at < now()`

---

## 7. Calendar UI

**Approach:** shadcn Calendar + **custom slot grid**

- Week/day view grid
- Slots colored: available / booked / pending / selected
- Host view: show player name on booked slots
- Player view: booked slots show „Zauzeto" / „Booked"
- Realtime subscription refreshes grid

---

## 8. Maps

- **Library:** react-leaflet + leaflet
- **Tiles:** OpenStreetMap
- Host drags/clicks pin → stores `lat`, `lng`, reverse geocode → `address`
- No Google Maps API (cost-free MVP)

---

## 9. Email

| Event | Trigger |
|-------|---------|
| Auth emails | Supabase built-in |
| Booking emails | Edge Function on INSERT/UPDATE bookings |
| Cancellation | Edge Function |
| Pending expiry | Cron job |

**Recommended:** Resend API from Edge Function for custom templates (SR/EN).

---

## 10. Realtime

```typescript
supabase
  .channel(`venue:${venueId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `venue_id=eq.${venueId}` }, handler)
  .subscribe()
```

Also subscribe to `slot_locks` for live lock indicators (optional polish).

---

## 11. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server/edge only
NEXT_PUBLIC_DEFAULT_LOCALE=sr
RESEND_API_KEY=                  # optional Phase 5
```

---

## 12. Key Server Actions / API

| Action | Role |
|--------|------|
| `createBooking` | Player |
| `cancelBooking` | Player |
| `approveBooking` | Host |
| `rejectBooking` | Host |
| `publishVenue` | Host |
| `updateVenueSettings` | Host |
| `acquireSlotLock` | Player |
| `releaseSlotLock` | Player |

All validate via RLS + server-side business rules (5h cancel, max slots, etc.).

---

## 13. Testing (MVP)

- Ručni test nalozi (no seed script in repo)
- README sa test credentials (`host@test.com`, `player@test.com`)
- Supabase local or shared dev project

---

## 14. Security Checklist

- [ ] RLS enabled on all public tables
- [ ] No service role key in client bundle
- [ ] Input validation (Zod) on all forms
- [ ] Rate limiting on booking endpoints (Edge Function or Supabase)
- [ ] HTTPS only in production
- [ ] CSP headers for map tiles

---

## 15. UI Conventions (Base UI / shadcn)

Stack: shadcn-style components built on `@base-ui/react`.

**Button-styled navigation:** use [`ButtonLink`](../src/components/ui/button-link.tsx) — a `Link` with `buttonVariants` classes. Never `Button render={<Link />}`: Base UI `Button` defaults to `nativeButton={true}` and expects a `<button>`, which triggers dev warnings and hurts accessibility when a link is rendered instead.

| Situation | Component |
|-----------|-----------|
| Link that looks like a button | `ButtonLink` |
| Form submit / onClick action | `Button` |
| Dialog/Sheet close or trigger | Base UI primitive with `render={<Button />}` |
| Inline text link | `Link` |

---

## 16. Future Technical Considerations

- Stripe / payment webhooks
- Multi-sport: `sport_type` enum on venues
- Multi-venue: remove 1:1 host-venue constraint
- Admin: service role dashboard or Supabase Studio
- Full city datasets per country (import scripts)
