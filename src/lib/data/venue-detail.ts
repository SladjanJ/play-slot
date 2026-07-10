import { notFound } from "next/navigation";

import {
  generateSlotsForDay,
  type WorkingHourRow,
} from "@/lib/booking/slots";
import {
  addDaysToDateString,
  getTodayInTimezone,
  zonedDateTimeToUtc,
} from "@/lib/booking/timezone";
import { createClient } from "@/lib/supabase/server";

export type VenueDetail = {
  id: string;
  slug: string;
  company_name: string;
  address: string | null;
  lat: number;
  lng: number;
  timezone: string;
  slot_duration_minutes: number;
  max_consecutive_slots: number;
  price_per_slot: number;
  currency: string;
  confirmation_mode: "auto" | "pending";
  city_name_en: string;
  city_name_sr: string;
  country_name_en: string;
  country_name_sr: string;
  working_hours: WorkingHourRow[];
  host_phone: string | null;
};

export async function getPublishedVenueBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .select(
      `
      id,
      slug,
      company_name,
      address,
      lat,
      lng,
      timezone,
      slot_duration_minutes,
      max_consecutive_slots,
      price_per_slot,
      currency,
      confirmation_mode,
      host_id,
      profiles!venues_host_id_fkey (
        phone
      ),
      cities!inner (
        name_en,
        name_sr,
        countries!inner (
          name_en,
          name_sr
        )
      ),
      venue_working_hours (
        day_of_week,
        opens_at,
        closes_at,
        is_closed
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const city = data.cities as {
    name_en: string;
    name_sr: string;
    countries: { name_en: string; name_sr: string };
  };

  const hostProfile = data.profiles as { phone: string | null } | null;

  const venue: VenueDetail = {
    id: data.id,
    slug: data.slug,
    company_name: data.company_name,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    timezone: data.timezone,
    slot_duration_minutes: data.slot_duration_minutes,
    max_consecutive_slots: data.max_consecutive_slots,
    price_per_slot: Number(data.price_per_slot),
    currency: data.currency,
    confirmation_mode: data.confirmation_mode as "auto" | "pending",
    city_name_en: city.name_en,
    city_name_sr: city.name_sr,
    country_name_en: city.countries.name_en,
    country_name_sr: city.countries.name_sr,
    working_hours: (data.venue_working_hours ?? []) as WorkingHourRow[],
    host_phone: hostProfile?.phone ?? null,
  };

  return venue;
}

export async function getVenueDaySlots({
  venue,
  dateStr,
  userId,
}: {
  venue: VenueDetail;
  dateStr: string;
  userId: string;
}) {
  const supabase = await createClient();

  const dayStart = zonedDateTimeToUtc(dateStr, "00:00", venue.timezone);
  const dayEnd = zonedDateTimeToUtc(
    addDaysToDateString(dateStr, 1),
    "00:00",
    venue.timezone,
  );

  const [{ data: bookings }, { data: locks }] = await Promise.all([
    supabase
      .from("bookings")
      .select("start_at, end_at, status")
      .eq("venue_id", venue.id)
      .in("status", ["pending", "confirmed"])
      .gt("end_at", dayStart.toISOString())
      .lt("start_at", dayEnd.toISOString()),
    supabase
      .from("slot_locks")
      .select("start_at, end_at, locked_by, expires_at")
      .eq("venue_id", venue.id)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const slots = generateSlotsForDay({
    dateStr,
    timezone: venue.timezone,
    slotDurationMinutes: venue.slot_duration_minutes,
    workingHours: venue.working_hours,
    bookings: bookings ?? [],
    locks: locks ?? [],
    currentUserId: userId,
  });

  return slots;
}

export async function getVenueBookingContext(slug: string, dateStr?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const venue = await getPublishedVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  const selectedDate = dateStr ?? getTodayInTimezone(venue.timezone);
  const slots = await getVenueDaySlots({
    venue,
    dateStr: selectedDate,
    userId: user.id,
  });

  const { data: activeLock } = await supabase
    .from("slot_locks")
    .select("id, start_at, end_at, expires_at")
    .eq("venue_id", venue.id)
    .eq("locked_by", user.id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return {
    venue,
    selectedDate,
    slots,
    activeLock,
    userId: user.id,
  };
}
