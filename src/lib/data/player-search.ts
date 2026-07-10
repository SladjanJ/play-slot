import { createClient } from "@/lib/supabase/server";
import { getCountriesAndCities } from "@/lib/data/locations";

export type VenueSearchResult = {
  id: string;
  slug: string;
  company_name: string;
  address: string | null;
  price_per_slot: number;
  currency: string;
  slot_duration_minutes: number;
  city_id: string;
  city_name_en: string;
  city_name_sr: string;
  country_name_en: string;
  country_name_sr: string;
};

export type SearchFilters = {
  query?: string;
  countryId?: string;
  cityId?: string;
};

export async function searchPublishedVenues(
  filters: SearchFilters,
): Promise<VenueSearchResult[]> {
  const supabase = await createClient();

  let cityIdsForCountry: string[] | null = null;

  if (filters.countryId && !filters.cityId) {
    const { data: countryCities } = await supabase
      .from("cities")
      .select("id")
      .eq("country_id", filters.countryId);

    cityIdsForCountry = (countryCities ?? []).map((city) => city.id);

    if (cityIdsForCountry.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("venues")
    .select(
      `
      id,
      slug,
      company_name,
      address,
      price_per_slot,
      currency,
      slot_duration_minutes,
      city_id,
      cities!inner (
        name_en,
        name_sr,
        country_id,
        countries!inner (
          name_en,
          name_sr
        )
      )
    `,
    )
    .eq("status", "published")
    .order("company_name");

  if (filters.cityId) {
    query = query.eq("city_id", filters.cityId);
  } else if (cityIdsForCountry) {
    query = query.in("city_id", cityIdsForCountry);
  }

  if (filters.query?.trim()) {
    query = query.ilike("company_name", `%${filters.query.trim()}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const city = row.cities as {
      name_en: string;
      name_sr: string;
      countries: { name_en: string; name_sr: string };
    };

    return {
      id: row.id,
      slug: row.slug,
      company_name: row.company_name,
      address: row.address,
      price_per_slot: Number(row.price_per_slot),
      currency: row.currency,
      slot_duration_minutes: row.slot_duration_minutes,
      city_id: row.city_id,
      city_name_en: city.name_en,
      city_name_sr: city.name_sr,
      country_name_en: city.countries.name_en,
      country_name_sr: city.countries.name_sr,
    };
  });
}

export async function getPlayerSearchContext(filters: SearchFilters) {
  const [{ countries, cities }, venues] = await Promise.all([
    getCountriesAndCities(),
    searchPublishedVenues(filters),
  ]);

  return { countries, cities, venues, filters };
}
