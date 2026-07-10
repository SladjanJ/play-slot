import { VenueBookingPanel } from "@/components/player/venue-booking-panel";
import { getVenueBookingContext } from "@/lib/data/venue-detail";

type VenuePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function VenuePage({ params, searchParams }: VenuePageProps) {
  const { slug } = await params;
  const { date } = await searchParams;
  const { venue, selectedDate, slots, activeLock } =
    await getVenueBookingContext(slug, date);

  return (
    <VenueBookingPanel
      venue={venue}
      selectedDate={selectedDate}
      slots={slots}
      activeLock={activeLock}
    />
  );
}
