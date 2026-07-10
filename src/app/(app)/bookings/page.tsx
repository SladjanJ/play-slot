import { BookingsPanel } from "@/components/player/bookings-panel";
import { getPlayerBookings } from "@/lib/data/player-bookings";

type BookingsPageProps = {
  searchParams: Promise<{ success?: string }>;
};

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const { success } = await searchParams;
  const bookings = await getPlayerBookings();

  return (
    <BookingsPanel bookings={bookings} successMessage={success} />
  );
}
