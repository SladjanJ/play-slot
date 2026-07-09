import { getHostSetupContext } from "@/lib/data/host-setup";
import { HostSetupWizard } from "@/components/host/setup-wizard";

export default async function HostSetupPage() {
  const { initialData, countries, cities } = await getHostSetupContext();

  return (
    <section className="flex flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16">
      <HostSetupWizard
        initialData={initialData}
        countries={countries}
        cities={cities}
      />
    </section>
  );
}
