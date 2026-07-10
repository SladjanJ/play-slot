-- Phase 5: enable Supabase Realtime on booking tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_locks;

-- Allow server-side notification creation for other users (via service role / SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, jsonb) TO service_role;

-- Schedule slot-lock cleanup when pg_cron is available.
-- Pending expiry + notifications run via /api/cron/maintenance (see vercel.json).
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname IN ('expire_pending_bookings', 'cleanup_expired_slot_locks');

    PERFORM cron.schedule(
      'cleanup_expired_slot_locks',
      '*/5 * * * *',
      $$SELECT public.cleanup_expired_slot_locks()$$
    );
  END IF;
END;
$cron$;
