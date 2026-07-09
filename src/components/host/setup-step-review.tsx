"use client";

import { useLocale, useTranslations } from "next-intl";

import type { CityOption, CountryOption } from "@/lib/data/locations";
import { DAY_LABEL_KEYS } from "@/lib/host/constants";
import { currencyForCountryCode } from "@/lib/host/currency";
import type { PublishVenueInput } from "@/lib/host/validation";

type SetupStepReviewProps = {
  value: PublishVenueInput;
  countries: CountryOption[];
  cities: CityOption[];
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium sm:max-w-[60%] sm:text-right">
        {value}
      </dd>
    </div>
  );
}

export function SetupStepReview({
  value,
  countries,
  cities,
}: SetupStepReviewProps) {
  const t = useTranslations("host.setup");
  const appLocale = useLocale();

  const country = countries.find((item) => item.id === value.countryId);
  const city = cities.find((item) => item.id === value.cityId);
  const localizedName = (sr: string, en: string) =>
    appLocale === "sr" ? sr : en;

  const currency = country ? currencyForCountryCode(country.code) : "EUR";

  const openDaysSummary = value.workingHours
    .filter((day) => !day.isClosed)
    .map(
      (day) =>
        `${t(`days.${DAY_LABEL_KEYS[day.dayOfWeek]}`)} ${day.opensAt}–${day.closesAt}`,
    )
    .join(", ");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">{t("reviewTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reviewDescription")}
        </p>
      </div>

      <dl className="rounded-xl border border-border/60 bg-background/60 px-4">
        <ReviewRow label={t("companyName")} value={value.companyName} />
        <ReviewRow
          label={t("country")}
          value={
            country
              ? localizedName(country.name_sr, country.name_en)
              : "—"
          }
        />
        <ReviewRow
          label={t("city")}
          value={city ? localizedName(city.name_sr, city.name_en) : "—"}
        />
        <ReviewRow label={t("timezone")} value={value.timezone} />
        <ReviewRow label={t("address")} value={value.address || "—"} />
        <ReviewRow
          label={t("workingHoursTitle")}
          value={openDaysSummary || t("allClosed")}
        />
        <ReviewRow
          label={t("slotDuration")}
          value={t("slotDurationMinutes", {
            minutes: value.slotDurationMinutes,
          })}
        />
        <ReviewRow
          label={t("maxConsecutiveSlots")}
          value={String(value.maxConsecutiveSlots)}
        />
        <ReviewRow
          label={t("pricePerSlot", { currency })}
          value={`${value.pricePerSlot} ${currency}`}
        />
        <ReviewRow
          label={t("confirmationMode")}
          value={
            value.confirmationMode === "auto"
              ? t("confirmationAuto")
              : t("confirmationPending")
          }
        />
      </dl>
    </div>
  );
}
