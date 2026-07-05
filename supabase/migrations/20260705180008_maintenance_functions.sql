CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.bookings
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND created_at < now() - interval '24 hours';
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_slot_locks()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.slot_locks
  WHERE expires_at < now();
$$;

-- Optional: schedule via Supabase Dashboard (Database > Extensions > pg_cron)
-- when pg_cron is enabled on the project:
--   SELECT cron.schedule('expire_pending_bookings', '*/15 * * * *', $$SELECT public.expire_pending_bookings()$$);
--   SELECT cron.schedule('cleanup_expired_slot_locks', '*/5 * * * *', $$SELECT public.cleanup_expired_slot_locks()$$);
