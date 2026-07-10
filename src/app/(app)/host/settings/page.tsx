import { HostSettingsWizard } from "@/components/host/host-settings-wizard";
import { getHostSettingsContext } from "@/lib/data/host-settings";

type HostSettingsPageProps = {
  searchParams: Promise<{ success?: string }>;
};

export default async function HostSettingsPage({
  searchParams,
}: HostSettingsPageProps) {
  const { success } = await searchParams;
  const { initialData, countries, cities } = await getHostSettingsContext();

  return (
    <section className="flex flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16">
      <HostSettingsWizard
        initialData={initialData}
        countries={countries}
        cities={cities}
        successMessage={success}
      />
    </section>
  );
}
