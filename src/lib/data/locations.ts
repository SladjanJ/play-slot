import { createClient } from "@/lib/supabase/server";

export type CountryOption = {
  id: string;
  code: string;
  name_en: string;
  name_sr: string;
};

export type CityOption = {
  id: string;
  country_id: string;
  name_en: string;
  name_sr: string;
};

export async function getCountriesAndCities() {
  const supabase = await createClient();

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

  return {
    countries: (countries ?? []) as CountryOption[],
    cities: (cities ?? []) as CityOption[],
  };
}
