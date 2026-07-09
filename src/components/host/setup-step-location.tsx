"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { FieldError } from "@/components/auth/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CityOption, CountryOption } from "@/lib/data/locations";
import {
  COUNTRY_MAP_CENTERS,
  DEFAULT_MAP_CENTER,
} from "@/lib/host/constants";
import { geocodeCity, reverseGeocode } from "@/lib/host/geocode";
import type { PublishVenueInput } from "@/lib/host/validation";

const VenueMapPicker = dynamic(
  () =>
    import("@/components/host/venue-map-picker").then(
      (module) => module.VenueMapPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        …
      </div>
    ),
  },
);

type SetupStepLocationProps = {
  value: Pick<PublishVenueInput, "lat" | "lng" | "address" | "cityId" | "countryId">;
  countries: CountryOption[];
  cities: CityOption[];
  errors?: Record<string, string>;
  onChange: (
    patch: Partial<Pick<PublishVenueInput, "lat" | "lng" | "address">>,
  ) => void;
};

export function SetupStepLocation({
  value,
  countries,
  cities,
  errors,
  onChange,
}: SetupStepLocationProps) {
  const t = useTranslations("host.setup");
  const appLocale = useLocale();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const country = countries.find((item) => item.id === value.countryId);
  const city = cities.find((item) => item.id === value.cityId);

  const mapCenter = useMemo(() => {
    if (value.lat && value.lng) {
      return { lat: value.lat, lng: value.lng };
    }

    if (country?.code && COUNTRY_MAP_CENTERS[country.code]) {
      return COUNTRY_MAP_CENTERS[country.code];
    }

    return DEFAULT_MAP_CENTER;
  }, [country?.code, value.lat, value.lng]);

  useEffect(() => {
    if (!city || !country || (value.lat && value.lng)) return;

    let cancelled = false;

    async function loadCityCenter() {
      setIsGeocoding(true);
      const cityName = appLocale === "sr" ? city!.name_sr : city!.name_en;
      const countryName =
        appLocale === "sr" ? country!.name_sr : country!.name_en;
      const result = await geocodeCity(cityName, countryName);

      if (!cancelled && result) {
        const address = await reverseGeocode(result.lat, result.lng);
        onChange({ lat: result.lat, lng: result.lng, address });
      }

      if (!cancelled) setIsGeocoding(false);
    }

    void loadCityCenter();

    return () => {
      cancelled = true;
    };
  }, [appLocale, city, country, onChange, value.lat, value.lng]);

  async function handlePositionChange(position: { lat: number; lng: number }) {
    onChange({ lat: position.lat, lng: position.lng });
    const address = await reverseGeocode(position.lat, position.lng);
    if (address) {
      onChange({ address });
    }
  }

  const position =
    value.lat && value.lng ? { lat: value.lat, lng: value.lng } : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("locationHint")}</p>

      <VenueMapPicker
        center={mapCenter}
        position={position}
        onPositionChange={handlePositionChange}
      />

      {isGeocoding ? (
        <p className="text-sm text-muted-foreground">{t("loadingMap")}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="address">{t("address")}</Label>
        <Input
          id="address"
          value={value.address}
          onChange={(e) => onChange({ address: e.target.value })}
          aria-invalid={Boolean(errors?.address)}
        />
        <FieldError message={errors?.address} />
      </div>

      {errors?.lat || errors?.lng ? (
        <p className="text-sm text-destructive" role="alert">
          {errors.lat ?? errors.lng}
        </p>
      ) : null}
    </div>
  );
}
