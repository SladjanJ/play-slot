"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { SLOT_LOCK_MINUTES } from "@/lib/booking/constants";
import { computeBookingEndAt } from "@/lib/booking/slots";
import { sameInstant } from "@/lib/booking/timestamps";
import {
  acquireSlotLockSchema,
  canCancelBooking,
  cancelBookingSchema,
  createBookingSchema,
  type BookingErrorKey,
  zodIssuesToBookingFieldErrors,
} from "@/lib/booking/validation";
import { createClient } from "@/lib/supabase/server";

export type BookingActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
  lockId?: string;
  expiresAt?: string;
  bookingId?: string;
};

async function translateError(locale: string, key: BookingErrorKey) {
  const t = await getTranslations({ locale, namespace: "booking.errors" });
  return t(key);
}

async function translateFieldErrors(
  locale: string,
  fieldErrors: Partial<Record<string, BookingErrorKey>>,
) {
  const t = await getTranslations({ locale, namespace: "booking.errors" });
  const translated: Record<string, string> = {};

  for (const [field, key] of Object.entries(fieldErrors)) {
    if (!key) continue;
    translated[field] = t(key);
  }

  return translated;
}

async function requirePlayer(locale: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: await translateError(locale, "notAuthenticated") } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "player") {
    return { error: await translateError(locale, "notPlayer") } as const;
  }

  return { supabase, user } as const;
}

async function getPublishedVenue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string,
) {
  const { data: venue } = await supabase
    .from("venues")
    .select(
      "id, slug, slot_duration_minutes, max_consecutive_slots, price_per_slot, currency, confirmation_mode, status",
    )
    .eq("id", venueId)
    .eq("status", "published")
    .maybeSingle();

  return venue;
}

export async function acquireSlotLockAction(
  locale: string,
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const parsed = acquireSlotLockSchema.safeParse({
    venueId: String(formData.get("venueId") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    slotCount: Number(formData.get("slotCount") ?? 0),
  });

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToBookingFieldErrors(parsed.error.issues),
      ),
      error: await translateError(locale, "generic"),
    };
  }

  const auth = await requirePlayer(locale);
  if ("error" in auth) return auth;

  const { supabase, user } = auth;
  const { venueId, startAt, slotCount } = parsed.data;

  const venue = await getPublishedVenue(supabase, venueId);
  if (!venue) {
    return { error: await translateError(locale, "venueNotFound") };
  }

  if (slotCount > venue.max_consecutive_slots) {
    return { error: await translateError(locale, "invalidSlotCount") };
  }

  const endAt = computeBookingEndAt(
    startAt,
    slotCount,
    venue.slot_duration_minutes,
  );

  await supabase.rpc("cleanup_expired_slot_locks");

  await supabase
    .from("slot_locks")
    .delete()
    .eq("venue_id", venueId)
    .eq("locked_by", user.id);

  const expiresAt = new Date(
    Date.now() + SLOT_LOCK_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: lock, error: lockError } = await supabase
    .from("slot_locks")
    .insert({
      venue_id: venueId,
      locked_by: user.id,
      start_at: startAt,
      end_at: endAt,
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single();

  if (lockError || !lock) {
    return { error: await translateError(locale, "lockFailed") };
  }

  revalidatePath(`/venues/${venue.slug}`);

  return {
    lockId: lock.id,
    expiresAt: lock.expires_at,
  };
}

export async function releaseSlotLockAction(
  locale: string,
  lockId: string,
): Promise<BookingActionState> {
  const auth = await requirePlayer(locale);
  if ("error" in auth) return auth;

  const { supabase, user } = auth;

  await supabase
    .from("slot_locks")
    .delete()
    .eq("id", lockId)
    .eq("locked_by", user.id);

  return {};
}

export async function createBookingAction(
  locale: string,
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const parsed = createBookingSchema.safeParse({
    venueId: String(formData.get("venueId") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    slotCount: Number(formData.get("slotCount") ?? 0),
  });

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToBookingFieldErrors(parsed.error.issues),
      ),
      error: await translateError(locale, "generic"),
    };
  }

  const auth = await requirePlayer(locale);
  if ("error" in auth) return auth;

  const { supabase, user } = auth;
  const { venueId, startAt, slotCount } = parsed.data;

  const venue = await getPublishedVenue(supabase, venueId);
  if (!venue) {
    return { error: await translateError(locale, "venueNotFound") };
  }

  if (slotCount > venue.max_consecutive_slots) {
    return { error: await translateError(locale, "invalidSlotCount") };
  }

  const endAt = computeBookingEndAt(
    startAt,
    slotCount,
    venue.slot_duration_minutes,
  );

  const { data: activeLock } = await supabase
    .from("slot_locks")
    .select("id, start_at, end_at, expires_at")
    .eq("venue_id", venueId)
    .eq("locked_by", user.id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (
    !activeLock ||
    !sameInstant(activeLock.start_at, startAt) ||
    !sameInstant(activeLock.end_at, endAt)
  ) {
    return { error: await translateError(locale, "slotsUnavailable") };
  }

  const totalPrice = Number(venue.price_per_slot) * slotCount;
  const status =
    venue.confirmation_mode === "auto" ? "confirmed" : "pending";

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      venue_id: venueId,
      player_id: user.id,
      start_at: startAt,
      end_at: endAt,
      slot_count: slotCount,
      price_per_slot: venue.price_per_slot,
      total_price: totalPrice,
      status,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    return { error: await translateError(locale, "bookingFailed") };
  }

  await supabase.from("slot_locks").delete().eq("id", activeLock.id);

  revalidatePath(`/venues/${venue.slug}`);
  revalidatePath("/bookings");

  const t = await getTranslations({ locale, namespace: "booking" });
  redirect(`/bookings?success=${encodeURIComponent(t(status === "confirmed" ? "confirmedSuccess" : "pendingSuccess"))}`);
}

export async function cancelBookingAction(
  locale: string,
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const parsed = cancelBookingSchema.safeParse({
    bookingId: String(formData.get("bookingId") ?? ""),
    cancellationReason: String(formData.get("cancellationReason") ?? ""),
  });

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToBookingFieldErrors(parsed.error.issues),
      ),
      error: await translateError(locale, "generic"),
    };
  }

  const auth = await requirePlayer(locale);
  if ("error" in auth) return auth;

  const { supabase, user } = auth;
  const { bookingId, cancellationReason } = parsed.data;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_at, status, venue_id, venues(slug)")
    .eq("id", bookingId)
    .eq("player_id", user.id)
    .maybeSingle();

  if (!booking) {
    return { error: await translateError(locale, "bookingNotFound") };
  }

  const cancelCheck = canCancelBooking(booking.start_at, booking.status);
  if (!cancelCheck.allowed) {
    return {
      error: await translateError(
        locale,
        cancelCheck.reason ?? "cannotCancel",
      ),
    };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: cancellationReason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("player_id", user.id);

  if (updateError) {
    return { error: await translateError(locale, "bookingFailed") };
  }

  const venue = booking.venues as { slug: string } | null;
  if (venue?.slug) {
    revalidatePath(`/venues/${venue.slug}`);
  }
  revalidatePath("/bookings");

  const t = await getTranslations({ locale, namespace: "booking" });
  return { success: t("cancelSuccess") };
}
