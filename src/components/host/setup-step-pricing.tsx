"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { FieldError } from "@/components/auth/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CountryOption } from "@/lib/data/locations";
import { SLOT_DURATION_OPTIONS } from "@/lib/host/constants";
import { currencyForCountryCode } from "@/lib/host/currency";
import type { PublishVenueInput } from "@/lib/host/validation";

type SetupStepPricingProps = {
  value: Pick<
    PublishVenueInput,
    | "slotDurationMinutes"
    | "maxConsecutiveSlots"
    | "pricePerSlot"
    | "confirmationMode"
    | "countryId"
  >;
  countries: CountryOption[];
  errors?: Record<string, string>;
  onChange: (
    patch: Partial<
      Pick<
        PublishVenueInput,
        | "slotDurationMinutes"
        | "maxConsecutiveSlots"
        | "pricePerSlot"
        | "confirmationMode"
      >
    >,
  ) => void;
};

export function SetupStepPricing({
  value,
  countries,
  errors,
  onChange,
}: SetupStepPricingProps) {
  const t = useTranslations("host.setup");

  const currency = useMemo(() => {
    const country = countries.find((item) => item.id === value.countryId);
    return country ? currencyForCountryCode(country.code) : "EUR";
  }, [countries, value.countryId]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="slotDuration">{t("slotDuration")}</Label>
        <Select
          id="slotDuration"
          value={String(value.slotDurationMinutes)}
          onChange={(e) =>
            onChange({ slotDurationMinutes: Number(e.target.value) })
          }
          aria-invalid={Boolean(errors?.slotDurationMinutes)}
        >
          {SLOT_DURATION_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {t("slotDurationMinutes", { minutes })}
            </option>
          ))}
        </Select>
        <FieldError message={errors?.slotDurationMinutes} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxConsecutiveSlots">{t("maxConsecutiveSlots")}</Label>
        <Input
          id="maxConsecutiveSlots"
          type="number"
          min={1}
          max={12}
          value={value.maxConsecutiveSlots}
          onChange={(e) =>
            onChange({ maxConsecutiveSlots: Number(e.target.value) })
          }
          aria-invalid={Boolean(errors?.maxConsecutiveSlots)}
        />
        <FieldError message={errors?.maxConsecutiveSlots} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricePerSlot">
          {t("pricePerSlot", { currency })}
        </Label>
        <Input
          id="pricePerSlot"
          type="number"
          min={0}
          step="0.01"
          value={value.pricePerSlot || ""}
          onChange={(e) =>
            onChange({ pricePerSlot: Number(e.target.value) })
          }
          aria-invalid={Boolean(errors?.pricePerSlot)}
        />
        <FieldError message={errors?.pricePerSlot} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmationMode">{t("confirmationMode")}</Label>
        <Select
          id="confirmationMode"
          value={value.confirmationMode}
          onChange={(e) =>
            onChange({
              confirmationMode: e.target.value as PublishVenueInput["confirmationMode"],
            })
          }
          aria-invalid={Boolean(errors?.confirmationMode)}
        >
          <option value="pending">{t("confirmationPending")}</option>
          <option value="auto">{t("confirmationAuto")}</option>
        </Select>
        <p className="text-xs text-muted-foreground">
          {value.confirmationMode === "auto"
            ? t("confirmationAutoHint")
            : t("confirmationPendingHint")}
        </p>
        <FieldError message={errors?.confirmationMode} />
      </div>
    </div>
  );
}
