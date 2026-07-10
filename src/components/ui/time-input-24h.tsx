"use client";

import { Select } from "@/components/ui/select";
import { formatTimeForInput } from "@/lib/booking/timezone";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

type TimeInput24hProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
};

function parseParts(value: string): { hour: string; minute: string } {
  const normalized = formatTimeForInput(value);
  if (!normalized) {
    return { hour: "08", minute: "00" };
  }

  const [hour, minute] = normalized.split(":");
  return { hour, minute };
}

export function TimeInput24h({
  id,
  value,
  onChange,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: TimeInput24hProps) {
  const { hour, minute } = parseParts(value);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      className={cn("flex items-center gap-1.5", className)}
    >
      <Select
        id={id}
        value={hour}
        disabled={disabled}
        aria-label={ariaLabel ? `${ariaLabel}, hour` : "Hour"}
        className="w-[4.5rem] shrink-0 tabular-nums"
        onChange={(event) => onChange(`${event.target.value}:${minute}`)}
      >
        {HOURS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <span className="text-sm font-medium text-muted-foreground" aria-hidden>
        :
      </span>
      <Select
        value={minute}
        disabled={disabled}
        aria-label={ariaLabel ? `${ariaLabel}, minute` : "Minute"}
        className="w-[4.5rem] shrink-0 tabular-nums"
        onChange={(event) => onChange(`${hour}:${event.target.value}`)}
      >
        {MINUTES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}
