-- Enable RLS on all application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- countries & cities (public read)
CREATE POLICY countries_select_public ON public.countries
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY cities_select_public ON public.cities
  FOR SELECT TO anon, authenticated
  USING (true);

-- venues
CREATE POLICY venues_select_public_or_own ON public.venues
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR host_id = auth.uid());

CREATE POLICY venues_insert_own ON public.venues
  FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid() AND public.get_my_role() = 'host');

CREATE POLICY venues_update_own ON public.venues
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

CREATE POLICY venues_delete_own ON public.venues
  FOR DELETE TO authenticated
  USING (host_id = auth.uid());

-- venue_working_hours
CREATE POLICY venue_working_hours_select ON public.venue_working_hours
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.venues v
      WHERE v.id = venue_id
        AND (v.status = 'published' OR v.host_id = auth.uid())
    )
  );

CREATE POLICY venue_working_hours_insert_own ON public.venue_working_hours
  FOR INSERT TO authenticated
  WITH CHECK (public.is_venue_owner(venue_id));

CREATE POLICY venue_working_hours_update_own ON public.venue_working_hours
  FOR UPDATE TO authenticated
  USING (public.is_venue_owner(venue_id))
  WITH CHECK (public.is_venue_owner(venue_id));

CREATE POLICY venue_working_hours_delete_own ON public.venue_working_hours
  FOR DELETE TO authenticated
  USING (public.is_venue_owner(venue_id));

-- bookings
CREATE POLICY bookings_select_player ON public.bookings
  FOR SELECT TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY bookings_select_host ON public.bookings
  FOR SELECT TO authenticated
  USING (public.is_venue_owner(venue_id));

CREATE POLICY bookings_insert_player ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND public.get_my_role() = 'player'
    AND EXISTS (
      SELECT 1
      FROM public.venues v
      WHERE v.id = venue_id
        AND v.status = 'published'
    )
  );

CREATE POLICY bookings_update_player ON public.bookings
  FOR UPDATE TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

CREATE POLICY bookings_update_host ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.is_venue_owner(venue_id))
  WITH CHECK (public.is_venue_owner(venue_id));

-- slot_locks
CREATE POLICY slot_locks_select_player_own ON public.slot_locks
  FOR SELECT TO authenticated
  USING (locked_by = auth.uid());

CREATE POLICY slot_locks_select_published_venue ON public.slot_locks
  FOR SELECT TO authenticated
  USING (
    expires_at > now()
    AND EXISTS (
      SELECT 1
      FROM public.venues v
      WHERE v.id = venue_id
        AND v.status = 'published'
    )
  );

CREATE POLICY slot_locks_select_host ON public.slot_locks
  FOR SELECT TO authenticated
  USING (public.is_venue_owner(venue_id));

CREATE POLICY slot_locks_insert_player ON public.slot_locks
  FOR INSERT TO authenticated
  WITH CHECK (
    locked_by = auth.uid()
    AND public.get_my_role() = 'player'
    AND EXISTS (
      SELECT 1
      FROM public.venues v
      WHERE v.id = venue_id
        AND v.status = 'published'
    )
  );

CREATE POLICY slot_locks_delete_own ON public.slot_locks
  FOR DELETE TO authenticated
  USING (locked_by = auth.uid());

-- notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
