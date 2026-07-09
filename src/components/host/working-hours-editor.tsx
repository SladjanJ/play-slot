"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAY_LABEL_KEYS, type WorkingDayForm } from "@/lib/host/constants";

type WorkingHoursEditorProps = {
  value: WorkingDayForm[];
  onChange: (value: WorkingDayForm[]) => void;
  errors?: Record<string, string>;
};

export function WorkingHoursEditor({
  value,
  onChange,
  errors,
}: WorkingHoursEditorProps) {
  const t = useTranslations("host.setup");

  function updateDay(index: number, patch: Partial<WorkingDayForm>) {
    onChange(value.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  function applyToAllDays() {
    const template = value[0];
    if (!template) return;

    onChange(
      value.map((day) => ({
        ...day,
        opensAt: template.opensAt,
        closesAt: template.closesAt,
        isClosed: template.isClosed,
      })),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("workingHoursHint")}</p>
        <Button type="button" variant="outline" size="sm" onClick={applyToAllDays}>
          {t("applyToAllDays")}
        </Button>
      </div>

      <div className="space-y-3">
        {value.map((day, index) => (
          <div
            key={day.dayOfWeek}
            className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center"
          >
            <span className="text-sm font-medium">
              {t(`days.${DAY_LABEL_KEYS[day.dayOfWeek]}`)}
            </span>

            <div className="space-y-1.5">
              <Label htmlFor={`opens-${day.dayOfWeek}`} className="text-xs">
                {t("opensAt")}
              </Label>
              <Input
                id={`opens-${day.dayOfWeek}`}
                type="time"
                value={day.opensAt}
                disabled={day.isClosed}
                onChange={(e) => updateDay(index, { opensAt: e.target.value })}
                aria-invalid={Boolean(errors?.[`workingHours.${index}.opensAt`])}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`closes-${day.dayOfWeek}`} className="text-xs">
                {t("closesAt")}
              </Label>
              <Input
                id={`closes-${day.dayOfWeek}`}
                type="time"
                value={day.closesAt}
                disabled={day.isClosed}
                onChange={(e) => updateDay(index, { closesAt: e.target.value })}
                aria-invalid={Boolean(errors?.[`workingHours.${index}.closesAt`])}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={day.isClosed}
                onChange={(e) =>
                  updateDay(index, {
                    isClosed: e.target.checked,
                    opensAt: e.target.checked ? "" : day.opensAt || "08:00",
                    closesAt: e.target.checked ? "" : day.closesAt || "22:00",
                  })
                }
                className="size-4 rounded border-input accent-primary"
              />
              {t("closed")}
            </label>
          </div>
        ))}
      </div>

      {errors?.workingHours ? (
        <p className="text-sm text-destructive" role="alert">
          {errors.workingHours}
        </p>
      ) : null}
    </div>
  );
}
