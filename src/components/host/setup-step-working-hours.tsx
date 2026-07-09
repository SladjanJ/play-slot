"use client";

import { useTranslations } from "next-intl";

import { WorkingHoursEditor } from "@/components/host/working-hours-editor";
import type { PublishVenueInput } from "@/lib/host/validation";

type SetupStepWorkingHoursProps = {
  value: PublishVenueInput["workingHours"];
  errors?: Record<string, string>;
  onChange: (value: PublishVenueInput["workingHours"]) => void;
};

export function SetupStepWorkingHours({
  value,
  errors,
  onChange,
}: SetupStepWorkingHoursProps) {
  const t = useTranslations("host.setup");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">{t("workingHoursTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("workingHoursDescription")}
        </p>
      </div>
      <WorkingHoursEditor value={value} onChange={onChange} errors={errors} />
    </div>
  );
}
