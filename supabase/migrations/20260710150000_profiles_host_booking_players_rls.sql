-- Hosts can read player profiles when the player has a booking on the host's venue.
CREATE POLICY profiles_select_venue_booking_players ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.venues v ON v.id = b.venue_id
      WHERE b.player_id = profiles.id
        AND v.host_id = auth.uid()
    )
  );
