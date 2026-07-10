"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import type { CityOption, CountryOption } from "@/lib/data/locations";
import type { VenueSearchResult } from "@/lib/data/player-search";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatPrice } from "@/lib/booking/slots";

type SearchPanelProps = {
  locale: string;
  countries: CountryOption[];
  cities: CityOption[];
  venues: VenueSearchResult[];
  filters: {
    query?: string;
    countryId?: string;
    cityId?: string;
  };
};

export function SearchPanel({
  locale,
  countries,
  cities,
  venues,
  filters,
}: SearchPanelProps) {
  const t = useTranslations("player.search");
  const router = useRouter();

  const [query, setQuery] = useState(filters.query ?? "");
  const [countryId, setCountryId] = useState(filters.countryId ?? "");
  const [cityId, setCityId] = useState(filters.cityId ?? "");

  const filteredCities = useMemo(
    () =>
      countryId
        ? cities.filter((city) => city.country_id === countryId)
        : cities,
    [cities, countryId],
  );

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (countryId) params.set("country", countryId);
    if (cityId) params.set("city", cityId);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }, [query, countryId, cityId, router]);

  const locationName = (venue: VenueSearchResult) => {
    const cityName = locale === "sr" ? venue.city_name_sr : venue.city_name_en;
    const countryName =
      locale === "sr" ? venue.country_name_sr : venue.country_name_en;
    return `${cityName}, ${countryName}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <form
        className="grid gap-4 rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="space-y-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor="search-query">{t("companyName")}</Label>
          <Input
            id="search-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("companyPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-country">{t("country")}</Label>
          <Select
            id="search-country"
            value={countryId}
            onChange={(event) => {
              setCountryId(event.target.value);
              setCityId("");
            }}
          >
            <option value="">{t("allCountries")}</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {locale === "sr" ? country.name_sr : country.name_en}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-city">{t("city")}</Label>
          <Select
            id="search-city"
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
            disabled={!countryId}
          >
            <option value="">{t("allCities")}</option>
            {filteredCities.map((city) => (
              <option key={city.id} value={city.id}>
                {locale === "sr" ? city.name_sr : city.name_en}
              </option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" className="w-full sm:w-auto">
            {t("submit")}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">
          {t("results", { count: venues.length })}
        </h2>

        {venues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-10 text-center text-muted-foreground">
            {t("noResults")}
          </div>
        ) : (
          <ul className="grid gap-4">
            {venues.map((venue) => (
              <li
                key={venue.id}
                className="rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="font-heading text-xl font-semibold">
                      {venue.company_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {locationName(venue)}
                    </p>
                    {venue.address ? (
                      <p className="text-sm text-muted-foreground">
                        {venue.address}
                      </p>
                    ) : null}
                    <p className="text-sm font-medium">
                      {t("priceFrom", {
                        price: formatPrice(
                          venue.price_per_slot,
                          venue.currency,
                          locale,
                        ),
                        minutes: venue.slot_duration_minutes,
                      })}
                    </p>
                  </div>

                  <AppLink href={`/venues/${venue.slug}`} className="shrink-0">
                    {t("viewCalendar")}
                  </AppLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
