-- Players can read pending/confirmed bookings on published venues (calendar occupancy).
-- Does not expose data beyond what the calendar needs; UI must not show player_id.
CREATE POLICY bookings_select_published_venue_occupancy ON public.bookings
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'player'
    AND status IN ('pending', 'confirmed')
    AND EXISTS (
      SELECT 1
      FROM public.venues v
      WHERE v.id = venue_id
        AND v.status = 'published'
    )
  );
