-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues (id) ON DELETE RESTRICT,
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  slot_count int NOT NULL CHECK (slot_count > 0),
  price_per_slot numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'rejected')),
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX bookings_venue_id_start_end_idx ON public.bookings (venue_id, start_at, end_at);
CREATE INDEX bookings_player_id_created_at_idx ON public.bookings (player_id, created_at DESC);

CREATE UNIQUE INDEX bookings_active_slot_unique_idx
  ON public.bookings (venue_id, start_at, end_at)
  WHERE status IN ('pending', 'confirmed');

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    venue_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Slot locks
CREATE TABLE public.slot_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  locked_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX slot_locks_venue_id_idx ON public.slot_locks (venue_id);
CREATE INDEX slot_locks_expires_at_idx ON public.slot_locks (expires_at);
CREATE UNIQUE INDEX slot_locks_active_unique_idx ON public.slot_locks (venue_id, start_at, end_at);
