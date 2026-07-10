import { cookies } from "next/headers";

import { SearchPanel } from "@/components/player/search-panel";
import { getPlayerSearchContext } from "@/lib/data/player-search";
import { isAppLocale } from "@/lib/locale";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    country?: string;
    city?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : "sr";

  const filters = {
    query: params.q,
    countryId: params.country,
    cityId: params.city,
  };

  const { countries, cities, venues } = await getPlayerSearchContext(filters);

  return (
    <SearchPanel
      locale={locale}
      countries={countries}
      cities={cities}
      venues={venues}
      filters={filters}
    />
  );
}
