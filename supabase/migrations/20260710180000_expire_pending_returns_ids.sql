-- Phase 5: expire_pending_bookings returns expired booking IDs for notification hooks.
-- pg_cron only cleans slot locks; expiry + emails run via /api/cron/maintenance.

DROP FUNCTION IF EXISTS public.expire_pending_bookings();

CREATE FUNCTION public.expire_pending_bookings()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.bookings
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND created_at < now() - interval '24 hours'
  RETURNING id;
$$;

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'expire_pending_bookings';
  END IF;
END;
$cron$;
