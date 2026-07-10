import { HostDashboardPanel } from "@/components/host/host-dashboard-panel";
import { getHostDashboardContext } from "@/lib/data/host-dashboard";

type HostDashboardPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function HostDashboardPage({
  searchParams,
}: HostDashboardPageProps) {
  const { date } = await searchParams;
  const { hostName, venue, selectedDate, slots, todayBookings, pendingBookings } =
    await getHostDashboardContext(date);

  return (
    <HostDashboardPanel
      hostName={hostName}
      venue={venue}
      selectedDate={selectedDate}
      slots={slots}
      todayBookings={todayBookings}
      pendingBookings={pendingBookings}
    />
  );
}
