import { notifyBookingExpired } from "@/lib/notifications/booking-events";
import { createAdminClient } from "@/lib/supabase/admin";

function defaultLocale() {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
  return locale === "en" ? "en" : "sr";
}

export async function runBookingMaintenance() {
  const admin = createAdminClient();
  const locale = defaultLocale();

  const { error: lockError } = await admin.rpc("cleanup_expired_slot_locks");
  if (lockError) {
    console.error("[maintenance] cleanup_expired_slot_locks failed:", lockError.message);
  }

  const { data: expiredIds, error: expireError } = await admin.rpc(
    "expire_pending_bookings",
  );

  if (expireError) {
    console.error("[maintenance] expire_pending_bookings failed:", expireError.message);
    return {
      ok: false as const,
      expiredCount: 0,
      lockCleanupError: lockError?.message ?? null,
      expireError: expireError.message,
    };
  }

  const ids = (expiredIds ?? []) as string[];

  for (const bookingId of ids) {
    await notifyBookingExpired(bookingId, locale);
  }

  return {
    ok: true as const,
    expiredCount: ids.length,
    lockCleanupError: lockError?.message ?? null,
    expireError: null,
  };
}
