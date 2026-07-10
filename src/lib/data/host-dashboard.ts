import { redirect } from "next/navigation";

import {
  enrichSlotsWithBookings,
  generateSlotsForDay,
  type BookingOccupancy,
  type HostTimeSlot,
  type WorkingHourRow,
} from "@/lib/booking/slots";
import {
  addDaysToDateString,
  getTodayInTimezone,
  zonedDateTimeToUtc,
} from "@/lib/booking/timezone";
import { createClient } from "@/lib/supabase/server";

export type HostVenueContext = {
  id: string;
  company_name: string;
  timezone: string;
  slot_duration_minutes: number;
  currency: string;
  working_hours: WorkingHourRow[];
};

export type HostBookingRow = {
  id: string;
  start_at: string;
  end_at: string;
  slot_count: number;
  total_price: number;
  status: string;
  player_name: string;
  player_email: string;
  player_phone: string | null;
};

const BOOKING_WITH_PLAYER_SELECT = `
  id,
  start_at,
  end_at,
  slot_count,
  total_price,
  status,
  profiles!bookings_player_id_fkey (
    first_name,
    last_name,
    email,
    phone
  )
`;

type ProfileRow = {
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
} | null;

type BookingWithProfileRow = {
  id: string;
  start_at: string;
  end_at: string;
  slot_count: number;
  total_price: number;
  status: string;
  profiles: ProfileRow;
};

function formatPlayerName(profile: ProfileRow): string {
  if (!profile) return "";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ");
}

function mapToBookingOccupancy(row: BookingWithProfileRow): BookingOccupancy {
  const profile = row.profiles;

  return {
    id: row.id,
    start_at: row.start_at,
    end_at: row.end_at,
    status: row.status as "pending" | "confirmed",
    playerName: formatPlayerName(profile),
    playerEmail: profile?.email ?? "",
    playerPhone: profile?.phone ?? null,
    slotCount: row.slot_count,
    totalPrice: Number(row.total_price),
  };
}

function mapBookingRows(rows: BookingWithProfileRow[]): HostBookingRow[] {
  return rows.map((row) => ({
    id: row.id,
    start_at: row.start_at,
    end_at: row.end_at,
    slot_count: row.slot_count,
    total_price: Number(row.total_price),
    status: row.status,
    player_name: formatPlayerName(row.profiles),
    player_email: row.profiles?.email ?? "",
    player_phone: row.profiles?.phone ?? null,
  }));
}

async function getHostVenue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hostId: string,
): Promise<HostVenueContext | null> {
  const { data, error } = await supabase
    .from("venues")
    .select(
      `
      id,
      company_name,
      timezone,
      slot_duration_minutes,
      currency,
      status,
      venue_working_hours (
        day_of_week,
        opens_at,
        closes_at,
        is_closed
      )
    `,
    )
    .eq("host_id", hostId)
    .maybeSingle();

  if (error || !data || data.status !== "published") {
    return null;
  }

  return {
    id: data.id,
    company_name: data.company_name,
    timezone: data.timezone,
    slot_duration_minutes: data.slot_duration_minutes,
    currency: data.currency,
    working_hours: (data.venue_working_hours ?? []) as WorkingHourRow[],
  };
}

async function getDayBookingsWithPlayers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string,
  dateStr: string,
  timezone: string,
): Promise<BookingOccupancy[]> {
  const dayStart = zonedDateTimeToUtc(dateStr, "00:00", timezone);
  const dayEnd = zonedDateTimeToUtc(
    addDaysToDateString(dateStr, 1),
    "00:00",
    timezone,
  );

  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_PLAYER_SELECT)
    .eq("venue_id", venueId)
    .in("status", ["pending", "confirmed"])
    .gt("end_at", dayStart.toISOString())
    .lt("start_at", dayEnd.toISOString());

  return (data ?? [])
    .filter((row) => row.status === "pending" || row.status === "confirmed")
    .map((row) => mapToBookingOccupancy(row as BookingWithProfileRow));
}

async function getHostDaySlots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venue: HostVenueContext,
  dateStr: string,
  hostUserId: string,
): Promise<HostTimeSlot[]> {
  const [bookingsWithPlayers, { data: locks }] = await Promise.all([
    getDayBookingsWithPlayers(supabase, venue.id, dateStr, venue.timezone),
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
    bookings: bookingsWithPlayers,
    locks: locks ?? [],
    currentUserId: hostUserId,
  });

  return enrichSlotsWithBookings(slots, bookingsWithPlayers);
}

async function getTodayBookings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venue: HostVenueContext,
): Promise<HostBookingRow[]> {
  const today = getTodayInTimezone(venue.timezone);
  const dayStart = zonedDateTimeToUtc(today, "00:00", venue.timezone);
  const dayEnd = zonedDateTimeToUtc(
    addDaysToDateString(today, 1),
    "00:00",
    venue.timezone,
  );

  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_PLAYER_SELECT)
    .eq("venue_id", venue.id)
    .in("status", ["pending", "confirmed"])
    .gt("end_at", dayStart.toISOString())
    .lt("start_at", dayEnd.toISOString())
    .order("start_at", { ascending: true });

  return mapBookingRows((data ?? []) as BookingWithProfileRow[]);
}

async function getPendingBookings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string,
): Promise<HostBookingRow[]> {
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_PLAYER_SELECT)
    .eq("venue_id", venueId)
    .eq("status", "pending")
    .order("start_at", { ascending: true });

  return mapBookingRows((data ?? []) as BookingWithProfileRow[]);
}

export async function getHostDashboardContext(dateStr?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sr/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    redirect("/sr");
  }

  const venue = await getHostVenue(supabase, user.id);

  if (!venue) {
    redirect("/host/setup");
  }

  const selectedDate = dateStr ?? getTodayInTimezone(venue.timezone);

  const [slots, todayBookings, pendingBookings] = await Promise.all([
    getHostDaySlots(supabase, venue, selectedDate, user.id),
    getTodayBookings(supabase, venue),
    getPendingBookings(supabase, venue.id),
  ]);

  return {
    hostName: profile.first_name,
    venue,
    selectedDate,
    slots,
    todayBookings,
    pendingBookings,
  };
}
