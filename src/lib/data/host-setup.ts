import { redirect } from "next/navigation";

import { createDefaultWorkingHours } from "@/lib/host/constants";
import type { PublishVenueInput } from "@/lib/host/validation";
import { createClient } from "@/lib/supabase/server";
import type { CityOption, CountryOption } from "@/lib/data/locations";

export type HostSetupInitialData = {
  companyName: string;
  countryId: string;
  cityId: string;
  timezone: string;
  workingHours: PublishVenueInput["workingHours"];
};

export async function getHostSetupContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sr/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    redirect("/sr");
  }

  const { data: existingVenue } = await supabase
    .from("venues")
    .select("status")
    .eq("host_id", user.id)
    .maybeSingle();

  if (existingVenue?.status === "published") {
    redirect("/host/dashboard");
  }

  const metadata = user.user_metadata ?? {};
  const cityId = typeof metadata.city_id === "string" ? metadata.city_id : "";

  const [{ data: countries }, { data: cities }] = await Promise.all([
    supabase
      .from("countries")
      .select("id, code, name_en, name_sr")
      .order("name_en"),
    supabase
      .from("cities")
      .select("id, country_id, name_en, name_sr")
      .order("name_en"),
  ]);

  const cityList = (cities ?? []) as CityOption[];
  const countryList = (countries ?? []) as CountryOption[];
  const matchedCity = cityList.find((city) => city.id === cityId);

  const initialData: HostSetupInitialData = {
    companyName:
      typeof metadata.company_name === "string" ? metadata.company_name : "",
    countryId: matchedCity?.country_id ?? countryList[0]?.id ?? "",
    cityId,
    timezone: typeof metadata.timezone === "string" ? metadata.timezone : "",
    workingHours: createDefaultWorkingHours(),
  };

  return {
    userId: user.id,
    initialData,
    countries: countryList,
    cities: cityList,
  };
}
