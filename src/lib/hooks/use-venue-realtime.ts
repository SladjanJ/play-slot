"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

type UseVenueRealtimeOptions = {
  venueId: string;
  enabled?: boolean;
};

export function useVenueRealtime({
  venueId,
  enabled = true,
}: UseVenueRealtimeOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !venueId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `venue_id=eq.${venueId}`,
        },
        () => {
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slot_locks",
          filter: `venue_id=eq.${venueId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, router, venueId]);
}
