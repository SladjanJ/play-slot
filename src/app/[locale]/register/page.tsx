import { setRequestLocale } from "next-intl/server";

import { RegisterForm } from "@/components/auth/register-form";
import { getCountriesAndCities } from "@/lib/data/locations";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { countries, cities } = await getCountriesAndCities();

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <RegisterForm locale={locale} countries={countries} cities={cities} />
      </div>
    </section>
  );
}
