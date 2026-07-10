-- Players can read host contact info for published venues (phone, name).
CREATE POLICY profiles_select_published_venue_host ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'player'
    AND EXISTS (
      SELECT 1
      FROM public.venues v
      WHERE v.host_id = profiles.id
        AND v.status = 'published'
    )
  );
