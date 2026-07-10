"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { FieldError } from "@/components/auth/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TIMEZONE_OPTIONS } from "@/lib/auth/validation";
import type { CityOption, CountryOption } from "@/lib/data/locations";
import type { PublishVenueInput } from "@/lib/host/validation";

type SetupStepBasicsProps = {
  value: Pick<
    PublishVenueInput,
    "companyName" | "countryId" | "cityId" | "timezone"
  > & {
    phone?: string;
  };
  countries: CountryOption[];
  cities: CityOption[];
  errors?: Record<string, string>;
  showContactPhone?: boolean;
  onChange: (
    patch: Partial<
      Pick<PublishVenueInput, "companyName" | "countryId" | "cityId" | "timezone"> & {
        phone?: string;
      }
    >,
  ) => void;
};

export function SetupStepBasics({
  value,
  countries,
  cities,
  errors,
  showContactPhone = false,
  onChange,
}: SetupStepBasicsProps) {
  const t = useTranslations("host.setup");
  const tSettings = useTranslations("host.settings");
  const appLocale = useLocale();

  const filteredCities = useMemo(
    () => cities.filter((city) => city.country_id === value.countryId),
    [cities, value.countryId],
  );

  const localizedName = (sr: string, en: string) =>
    appLocale === "sr" ? sr : en;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">{t("companyName")}</Label>
        <Input
          id="companyName"
          value={value.companyName}
          onChange={(e) => onChange({ companyName: e.target.value })}
          aria-invalid={Boolean(errors?.companyName)}
        />
        <FieldError message={errors?.companyName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">{t("country")}</Label>
        <Select
          id="country"
          value={value.countryId}
          onChange={(e) =>
            onChange({ countryId: e.target.value, cityId: "" })
          }
          aria-invalid={Boolean(errors?.countryId)}
        >
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {localizedName(country.name_sr, country.name_en)}
            </option>
          ))}
        </Select>
        <FieldError message={errors?.countryId} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cityId">{t("city")}</Label>
        <Select
          id="cityId"
          value={value.cityId}
          onChange={(e) => onChange({ cityId: e.target.value })}
          aria-invalid={Boolean(errors?.cityId)}
        >
          <option value="">{t("selectCity")}</option>
          {filteredCities.map((city) => (
            <option key={city.id} value={city.id}>
              {localizedName(city.name_sr, city.name_en)}
            </option>
          ))}
        </Select>
        <FieldError message={errors?.cityId} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">{t("timezone")}</Label>
        <Select
          id="timezone"
          value={value.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          aria-invalid={Boolean(errors?.timezone)}
        >
          <option value="">{t("selectTimezone")}</option>
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
        <FieldError message={errors?.timezone} />
      </div>

      {showContactPhone ? (
        <div className="space-y-2">
          <Label htmlFor="contactPhone">{tSettings("contactPhone")}</Label>
          <Input
            id="contactPhone"
            type="tel"
            autoComplete="tel"
            value={value.phone ?? ""}
            onChange={(e) => onChange({ phone: e.target.value })}
            aria-invalid={Boolean(errors?.phone)}
          />
          <p className="text-xs text-muted-foreground">
            {tSettings("contactPhoneHint")}
          </p>
          <FieldError message={errors?.phone} />
        </div>
      ) : null}
    </div>
  );
}
