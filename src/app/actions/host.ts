"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { currencyForCountryCode } from "@/lib/host/currency";
import {
  type HostSetupErrorKey,
  type PublishVenueInput,
  publishVenueSchema,
  updateVenueSettingsSchema,
  zodIssuesToHostFieldErrors,
} from "@/lib/host/validation";
import { createClient } from "@/lib/supabase/server";

export type HostActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

export type HostBookingActionState = {
  error?: string;
  success?: string;
};

async function translateError(locale: string, key: HostSetupErrorKey) {
  const t = await getTranslations({ locale, namespace: "host.errors" });
  return t(key);
}

async function translateFieldErrors(
  locale: string,
  fieldErrors: Partial<Record<string, HostSetupErrorKey>>,
) {
  const t = await getTranslations({ locale, namespace: "host.errors" });
  const translated: Record<string, string> = {};

  for (const [field, key] of Object.entries(fieldErrors)) {
    if (!key) continue;
    translated[field] = t(key);
  }

  return translated;
}

export async function publishVenueAction(
  locale: string,
  _prevState: HostActionState,
  formData: FormData,
): Promise<HostActionState> {
  const payloadRaw = formData.get("payload");

  if (typeof payloadRaw !== "string") {
    return { error: await translateError(locale, "generic") };
  }

  let payload: unknown;

  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return { error: await translateError(locale, "generic") };
  }

  const parsed = publishVenueSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToHostFieldErrors(parsed.error.issues),
      ),
      error: await translateError(locale, "generic"),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: await translateError(locale, "notAuthenticated") };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    return { error: await translateError(locale, "notHost") };
  }

  const { data: existingVenue } = await supabase
    .from("venues")
    .select("id, status")
    .eq("host_id", user.id)
    .maybeSingle();

  if (existingVenue?.status === "published") {
    return { error: await translateError(locale, "venueAlreadyPublished") };
  }

  const { data: country } = await supabase
    .from("countries")
    .select("code")
    .eq("id", data.countryId)
    .single();

  if (!country) {
    return { error: await translateError(locale, "countryRequired") };
  }

  const { data: slug, error: slugError } = await supabase.rpc(
    "generate_venue_slug",
    {
      p_company_name: data.companyName,
      p_city_id: data.cityId,
    },
  );

  if (slugError || !slug) {
    return { error: await translateError(locale, "publishFailed") };
  }

  const currency = currencyForCountryCode(country.code);

  const venuePayload = {
    host_id: user.id,
    city_id: data.cityId,
    company_name: data.companyName,
    slug,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    timezone: data.timezone,
    slot_duration_minutes: data.slotDurationMinutes,
    max_consecutive_slots: data.maxConsecutiveSlots,
    price_per_slot: data.pricePerSlot,
    currency,
    confirmation_mode: data.confirmationMode,
    status: "published" as const,
  };

  if (existingVenue) {
    const { error: updateError } = await supabase
      .from("venues")
      .update(venuePayload)
      .eq("id", existingVenue.id);

    if (updateError) {
      return { error: await translateError(locale, "publishFailed") };
    }

    await supabase
      .from("venue_working_hours")
      .delete()
      .eq("venue_id", existingVenue.id);

    const { error: hoursError } = await supabase
      .from("venue_working_hours")
      .insert(
        data.workingHours.map((day) => ({
          venue_id: existingVenue.id,
          day_of_week: day.dayOfWeek,
          opens_at: day.isClosed ? null : day.opensAt,
          closes_at: day.isClosed ? null : day.closesAt,
          is_closed: day.isClosed,
        })),
      );

    if (hoursError) {
      return { error: await translateError(locale, "publishFailed") };
    }
  } else {
    const { data: venue, error: insertError } = await supabase
      .from("venues")
      .insert(venuePayload)
      .select("id")
      .single();

    if (insertError || !venue) {
      return { error: await translateError(locale, "publishFailed") };
    }

    const { error: hoursError } = await supabase
      .from("venue_working_hours")
      .insert(
        data.workingHours.map((day) => ({
          venue_id: venue.id,
          day_of_week: day.dayOfWeek,
          opens_at: day.isClosed ? null : day.opensAt,
          closes_at: day.isClosed ? null : day.closesAt,
          is_closed: day.isClosed,
        })),
      );

    if (hoursError) {
      return { error: await translateError(locale, "publishFailed") };
    }
  }

  revalidatePath("/host/setup");
  revalidatePath("/host/dashboard");
  redirect("/host/dashboard");
}

async function upsertVenueWorkingHours(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string,
  workingHours: PublishVenueInput["workingHours"],
) {
  await supabase.from("venue_working_hours").delete().eq("venue_id", venueId);

  const { error: hoursError } = await supabase.from("venue_working_hours").insert(
    workingHours.map((day) => ({
      venue_id: venueId,
      day_of_week: day.dayOfWeek,
      opens_at: day.isClosed ? null : day.opensAt,
      closes_at: day.isClosed ? null : day.closesAt,
      is_closed: day.isClosed,
    })),
  );

  return hoursError;
}

export async function updateVenueSettingsAction(
  locale: string,
  _prevState: HostActionState,
  formData: FormData,
): Promise<HostActionState> {
  const payloadRaw = formData.get("payload");

  if (typeof payloadRaw !== "string") {
    return { error: await translateError(locale, "generic") };
  }

  let payload: unknown;

  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return { error: await translateError(locale, "generic") };
  }

  const parsed = updateVenueSettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToHostFieldErrors(parsed.error.issues),
      ),
      error: await translateError(locale, "generic"),
    };
  }

  const data = parsed.data;
  const auth = await requireHost(locale);
  if ("error" in auth) {
    return { error: auth.error };
  }

  const { supabase, user } = auth;

  const { data: existingVenue } = await supabase
    .from("venues")
    .select("id, slug, company_name, city_id, confirmation_mode, status")
    .eq("host_id", user.id)
    .maybeSingle();

  if (!existingVenue || existingVenue.status !== "published") {
    return { error: await translateError(locale, "venueNotPublished") };
  }

  const switchingToAuto =
    existingVenue.confirmation_mode === "pending" &&
    data.confirmationMode === "auto";

  if (switchingToAuto) {
    const { count: pendingCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", existingVenue.id)
      .eq("status", "pending");

    if ((pendingCount ?? 0) > 0 && !data.cancelPendingBookings) {
      return { error: await translateError(locale, "pendingCancellationRequired") };
    }

    if ((pendingCount ?? 0) > 0 && data.cancelPendingBookings) {
      const { error: cancelError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: "Host switched to automatic confirmation",
        })
        .eq("venue_id", existingVenue.id)
        .eq("status", "pending");

      if (cancelError) {
        return { error: await translateError(locale, "settingsUpdateFailed") };
      }
    }
  }

  const { data: country } = await supabase
    .from("countries")
    .select("code")
    .eq("id", data.countryId)
    .single();

  if (!country) {
    return { error: await translateError(locale, "countryRequired") };
  }

  const companyOrCityChanged =
    data.companyName !== existingVenue.company_name ||
    data.cityId !== existingVenue.city_id;

  let slug = existingVenue.slug;

  if (companyOrCityChanged) {
    const { data: newSlug, error: slugError } = await supabase.rpc(
      "generate_venue_slug",
      {
        p_company_name: data.companyName,
        p_city_id: data.cityId,
      },
    );

    if (slugError || !newSlug) {
      return { error: await translateError(locale, "settingsUpdateFailed") };
    }

    slug = newSlug;
  }

  const currency = currencyForCountryCode(country.code);

  const { error: venueError } = await supabase
    .from("venues")
    .update({
      city_id: data.cityId,
      company_name: data.companyName,
      slug,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      timezone: data.timezone,
      slot_duration_minutes: data.slotDurationMinutes,
      max_consecutive_slots: data.maxConsecutiveSlots,
      price_per_slot: data.pricePerSlot,
      currency,
      confirmation_mode: data.confirmationMode,
    })
    .eq("id", existingVenue.id);

  if (venueError) {
    return { error: await translateError(locale, "settingsUpdateFailed") };
  }

  const hoursError = await upsertVenueWorkingHours(
    supabase,
    existingVenue.id,
    data.workingHours,
  );

  if (hoursError) {
    return { error: await translateError(locale, "settingsUpdateFailed") };
  }

  const phone = data.phone?.trim() || null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ phone })
    .eq("id", user.id);

  if (profileError) {
    return { error: await translateError(locale, "settingsUpdateFailed") };
  }

  revalidatePath("/host/settings");
  revalidatePath("/host/dashboard");
  revalidatePath("/search");
  revalidatePath(`/venues/${existingVenue.slug}`);
  if (slug !== existingVenue.slug) {
    revalidatePath(`/venues/${slug}`);
  }

  const t = await getTranslations({ locale, namespace: "host.settings" });
  redirect(`/host/settings?success=${encodeURIComponent(t("savedSuccess"))}`);
}

async function requireHost(locale: string) {
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

  if (profile?.role !== "host") {
    return { error: await translateError(locale, "notHost") } as const;
  }

  return { supabase, user } as const;
}

async function translateBookingError(locale: string, key: string) {
  const t = await getTranslations({ locale, namespace: "host.errors" });
  return t(key as HostSetupErrorKey);
}

export async function approveBookingAction(
  locale: string,
  _prevState: HostBookingActionState,
  formData: FormData,
): Promise<HostBookingActionState> {
  const bookingId = String(formData.get("bookingId") ?? "");

  if (!bookingId) {
    return { error: await translateBookingError(locale, "generic") };
  }

  const auth = await requireHost(locale);
  if ("error" in auth) return auth;

  const { supabase } = auth;

  const { data: booking, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError || !booking) {
    return { error: await translateBookingError(locale, "bookingActionFailed") };
  }

  revalidatePath("/host/dashboard");
  return { success: "approved" };
}

export async function rejectBookingAction(
  locale: string,
  _prevState: HostBookingActionState,
  formData: FormData,
): Promise<HostBookingActionState> {
  const bookingId = String(formData.get("bookingId") ?? "");

  if (!bookingId) {
    return { error: await translateBookingError(locale, "generic") };
  }

  const auth = await requireHost(locale);
  if ("error" in auth) return auth;

  const { supabase } = auth;

  const { data: booking, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError || !booking) {
    return { error: await translateBookingError(locale, "bookingActionFailed") };
  }

  revalidatePath("/host/dashboard");
  return { success: "rejected" };
}
