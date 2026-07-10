import { createClient } from "@/lib/supabase/server";

export type PlayerBookingRow = {
  id: string;
  venue_id: string;
  start_at: string;
  end_at: string;
  slot_count: number;
  total_price: number;
  price_per_slot: number;
  currency: string;
  status: string;
  cancellation_reason: string | null;
  created_at: string;
  venue: {
    slug: string;
    company_name: string;
    timezone: string;
  };
};

export async function getPlayerBookings(): Promise<PlayerBookingRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      venue_id,
      start_at,
      end_at,
      slot_count,
      total_price,
      price_per_slot,
      status,
      cancellation_reason,
      created_at,
      venues!inner (
        slug,
        company_name,
        timezone,
        currency
      )
    `,
    )
    .eq("player_id", user.id)
    .order("start_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const venue = row.venues as {
      slug: string;
      company_name: string;
      timezone: string;
      currency: string;
    };

    return {
      id: row.id,
      venue_id: row.venue_id,
      start_at: row.start_at,
      end_at: row.end_at,
      slot_count: row.slot_count,
      total_price: Number(row.total_price),
      price_per_slot: Number(row.price_per_slot),
      currency: venue.currency,
      status: row.status,
      cancellation_reason: row.cancellation_reason,
      created_at: row.created_at,
      venue: {
        slug: venue.slug,
        company_name: venue.company_name,
        timezone: venue.timezone,
      },
    };
  });
}
