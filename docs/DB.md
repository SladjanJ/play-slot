# PlaySlot — Database Design

> **Version:** 1.0 (MVP)  
> **Platform:** Supabase (PostgreSQL 15+)  
> **Last updated:** 2026-07-05

## 1. Overview

- All timestamps stored in **UTC**
- Display converted to `venues.timezone` (Host-selected at registration)
- **RLS enabled** on every application table
- `auth.users` managed by Supabase Auth; app data in `public` schema

---

## 2. Entity Relationship

```
auth.users 1──1 profiles
profiles 1──0..1 venues (MVP: max 1 venue per host)
countries 1──* cities
cities 1──* venues
venues 1──* venue_working_hours
venues 1──* bookings
profiles 1──* bookings (as player)
venues 1──* slot_locks
profiles 1──* notifications
profiles 1──* slot_locks (locked_by)
```

---

## 3. Tables

### 3.1 `profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → auth.users.id ON DELETE CASCADE |
| email | text NOT NULL | Denormalized from auth |
| first_name | text NOT NULL | |
| last_name | text | Nullable for Host if single name |
| phone | text | Nullable |
| role | text NOT NULL | CHECK: `player`, `host`, `admin` |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Indexes:** `role`, `email`

---

### 3.2 `countries`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| code | text UNIQUE NOT NULL | ISO 3166-1 alpha-2: RS, BA, ME… |
| name_en | text NOT NULL | |
| name_sr | text NOT NULL | |
| created_at | timestamptz | DEFAULT now() |

**RLS:** SELECT public (anon + authenticated)

---

### 3.3 `cities`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| country_id | uuid FK → countries.id | NOT NULL |
| name_en | text NOT NULL | |
| name_sr | text NOT NULL | |
| created_at | timestamptz | DEFAULT now() |

**Indexes:** `country_id`, `(country_id, name_en)`

**RLS:** SELECT public

---

### 3.4 `venues`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| host_id | uuid FK → profiles.id | UNIQUE (MVP: 1 venue per host) |
| city_id | uuid FK → cities.id | NOT NULL |
| company_name | text NOT NULL | Searchable display name |
| slug | text UNIQUE NOT NULL | URL-safe, auto-generated |
| address | text | From geocoding |
| lat | double precision NOT NULL | |
| lng | double precision NOT NULL | |
| timezone | text NOT NULL | IANA: Europe/Belgrade |
| slot_duration_minutes | int NOT NULL | e.g. 60 |
| max_consecutive_slots | int NOT NULL DEFAULT 3 | Max slots per booking |
| price_per_slot | numeric(10,2) NOT NULL | |
| currency | text NOT NULL DEFAULT 'EUR' | RSD for RS venues |
| confirmation_mode | text NOT NULL | CHECK: `auto`, `pending` |
| status | text NOT NULL DEFAULT 'draft' | CHECK: `draft`, `published` |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Indexes:** `city_id`, `status`, `company_name` (GIN trgm for search), `slug`

**RLS:**

- SELECT: `status = 'published'` OR `host_id = auth.uid()`
- INSERT/UPDATE/DELETE: `host_id = auth.uid()`

---

### 3.5 `venue_working_hours`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| venue_id | uuid FK → venues.id ON DELETE CASCADE | |
| day_of_week | smallint NOT NULL | 0=Mon … 6=Sun |
| opens_at | time | Nullable if closed |
| closes_at | time | Nullable if closed |
| is_closed | boolean NOT NULL DEFAULT false | |

**Unique:** `(venue_id, day_of_week)`

**RLS:** via venue ownership

---

### 3.6 `bookings`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| venue_id | uuid FK → venues.id | NOT NULL |
| player_id | uuid FK → profiles.id | NOT NULL |
| start_at | timestamptz NOT NULL | UTC |
| end_at | timestamptz NOT NULL | UTC |
| slot_count | int NOT NULL | Number of consecutive slots |
| price_per_slot | numeric(10,2) NOT NULL | Snapshot at booking time |
| total_price | numeric(10,2) NOT NULL | slot_count × price_per_slot |
| status | text NOT NULL | See enum below |
| cancellation_reason | text | Required on player cancel |
| cancelled_at | timestamptz | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Status enum:** `pending`, `confirmed`, `cancelled`, `expired`, `rejected`

**Indexes:**

- `(venue_id, start_at, end_at)`
- `(player_id, created_at DESC)`
- Partial unique: `(venue_id, start_at, end_at) WHERE status IN ('pending', 'confirmed')`

**Overlap prevention:** EXCLUDE USING gist (venue_id WITH =, tstzrange(start_at, end_at) WITH &&) WHERE status IN ('pending', 'confirmed') — optional stronger guarantee

**RLS:**

- Player: SELECT/INSERT own; UPDATE own (cancel only)
- Host: SELECT/UPDATE where owns venue

---

### 3.7 `slot_locks`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| venue_id | uuid FK → venues.id | NOT NULL |
| locked_by | uuid FK → profiles.id | NOT NULL |
| start_at | timestamptz NOT NULL | |
| end_at | timestamptz NOT NULL | |
| expires_at | timestamptz NOT NULL | now() + 3 minutes |
| created_at | timestamptz | DEFAULT now() |

**Unique:** `(venue_id, start_at, end_at)` WHERE expires_at > now()

**RLS:**

- Player can INSERT/DELETE own locks
- Host can SELECT locks on own venue

---

### 3.8 `notifications`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| user_id | uuid FK → profiles.id | NOT NULL |
| type | text NOT NULL | e.g. `booking_rejected` |
| title | text NOT NULL | |
| message | text NOT NULL | |
| read | boolean DEFAULT false | |
| metadata | jsonb | booking_id, venue_id, etc. |
| created_at | timestamptz | DEFAULT now() |

**RLS:** user_id = auth.uid()

---

## 4. SQL Functions & Triggers

### 4.1 `handle_new_user()` — trigger on auth.users

Creates `profiles` row from signUp metadata (role, first_name, last_name, phone).

### 4.2 `get_my_role()` → text

```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

### 4.3 `is_venue_owner(p_venue_id uuid)` → boolean

Returns true if authenticated user owns the venue.

### 4.4 `generate_venue_slug(company_name, city_id)` → text

Generates URL-safe unique slug from company name and city.

### 4.5 `updated_at` triggers

Auto-update `updated_at` on profiles, venues, bookings.

---

## 5. RLS Policy Summary

| Table | Policy |
|-------|--------|
| profiles | Users read/update self |
| countries | Public read |
| cities | Public read |
| venues | Public read published; host CRUD own |
| venue_working_hours | Read if venue visible; host CRUD own |
| bookings | Player own + occupancy on published venues; Host own venue bookings |
| slot_locks | Player own locks; Host read own venue |
| notifications | User own |

---

## 6. Seed Data (MVP)

### Countries (Balkan)

RS, BA, ME, HR, MK, AL, SI

### Cities (~5–15 per country)

Examples:

- **RS:** Beograd, Novi Sad, Niš, Kragujevac, Subotica
- **BA:** Sarajevo, Banja Luka, Mostar, Tuzla
- **ME:** Podgorica, Nikšić, Budva
- **HR:** Zagreb, Split, Rijeka, Osijek
- **MK:** Skopje, Bitola
- **AL:** Tirana, Durrës
- **SI:** Ljubljana, Maribor

*(Full list in migration file)*

---

## 7. Migration Order

1. Extensions: `pg_trgm` (search), optionally `btree_gist` (overlap)
2. Lookup tables: countries, cities
3. profiles + trigger
4. venues + venue_working_hours
5. bookings + slot_locks
6. notifications
7. RLS policies
8. Seed countries & cities
9. Cron jobs / functions for expiry & lock cleanup

---

## 8. Query Examples

### Search venues

```sql
SELECT v.*, c.name_en AS city_name, co.name_en AS country_name
FROM venues v
JOIN cities c ON c.id = v.city_id
JOIN countries co ON co.id = c.country_id
WHERE v.status = 'published'
  AND ($1::uuid IS NULL OR v.city_id = $1)
  AND ($2::text IS NULL OR v.company_name ILIKE '%' || $2 || '%');
```

### Available slots (pseudocode)

1. Generate time slots from `venue_working_hours` for date D
2. Subtract confirmed/pending bookings and active locks
3. Return remaining slots

---

## 9. Future Schema Changes

- `sports` table + `venue.sport_id`
- `venue_images` table
- `reviews` table
- Remove UNIQUE(host_id) on venues for multi-venue
- `admin_actions` audit log
- Payment tables: `payments`, `invoices`
