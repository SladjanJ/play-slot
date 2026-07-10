import { redirect } from "next/navigation";

import { formatTimeForInput } from "@/lib/booking/timezone";
import { createDefaultWorkingHours } from "@/lib/host/constants";
import type { UpdateVenueSettingsInput } from "@/lib/host/validation";
import { createClient } from "@/lib/supabase/server";
import type { CityOption, CountryOption } from "@/lib/data/locations";
import type { WorkingHourRow } from "@/lib/booking/slots";

export type HostSettingsInitialData = UpdateVenueSettingsInput & {
  initialConfirmationMode: "auto" | "pending";
  pendingBookingsCount: number;
  venueSlug: string;
};

function mapWorkingHoursFromDb(rows: WorkingHourRow[]) {
  if (rows.length === 0) {
    return createDefaultWorkingHours();
  }

  return rows
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((row) => ({
      dayOfWeek: row.day_of_week,
      opensAt: formatTimeForInput(row.opens_at),
      closesAt: formatTimeForInput(row.closes_at),
      isClosed: row.is_closed,
    }));
}

export async function getHostSettingsContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sr/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, phone")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    redirect("/sr");
  }

  const { data: venue } = await supabase
    .from("venues")
    .select(
      `
      id,
      slug,
      company_name,
      city_id,
      timezone,
      lat,
      lng,
      address,
      slot_duration_minutes,
      max_consecutive_slots,
      price_per_slot,
      confirmation_mode,
      cities!inner (
        country_id
      ),
      venue_working_hours (
        day_of_week,
        opens_at,
        closes_at,
        is_closed
      )
    `,
    )
    .eq("host_id", user.id)
    .eq("status", "published")
    .maybeSingle();

  if (!venue) {
    redirect("/host/setup");
  }

  const city = venue.cities as { country_id: string };

  const [{ data: countries }, { data: cities }, { count: pendingCount }] =
    await Promise.all([
      supabase
        .from("countries")
        .select("id, code, name_en, name_sr")
        .order("name_en"),
      supabase
        .from("cities")
        .select("id, country_id, name_en, name_sr")
        .order("name_en"),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venue.id)
        .eq("status", "pending"),
    ]);

  const confirmationMode = venue.confirmation_mode as "auto" | "pending";

  const initialData: HostSettingsInitialData = {
    companyName: venue.company_name,
    countryId: city.country_id,
    cityId: venue.city_id,
    timezone: venue.timezone,
    lat: venue.lat,
    lng: venue.lng,
    address: venue.address ?? "",
    workingHours: mapWorkingHoursFromDb(
      (venue.venue_working_hours ?? []) as WorkingHourRow[],
    ),
    slotDurationMinutes: venue.slot_duration_minutes,
    maxConsecutiveSlots: venue.max_consecutive_slots,
    pricePerSlot: Number(venue.price_per_slot),
    confirmationMode,
    phone: profile.phone ?? "",
    initialConfirmationMode: confirmationMode,
    pendingBookingsCount: pendingCount ?? 0,
    venueSlug: venue.slug,
  };

  return {
    initialData,
    countries: (countries ?? []) as CountryOption[],
    cities: (cities ?? []) as CityOption[],
  };
}
