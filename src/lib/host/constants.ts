export const SLOT_DURATION_OPTIONS = [30, 60, 90, 120] as const;

export const DEFAULT_SLOT_DURATION = 60;
export const DEFAULT_MAX_CONSECUTIVE_SLOTS = 3;
export const DEFAULT_CONFIRMATION_MODE = "pending" as const;

export const SETUP_STEPS = [
  "basics",
  "location",
  "workingHours",
  "pricing",
  "review",
] as const;

export type SetupStep = (typeof SETUP_STEPS)[number];

export type WorkingDayForm = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

/** 0 = Monday … 6 = Sunday (matches DB `day_of_week`). */
export function createDefaultWorkingHours(): WorkingDayForm[] {
  return [
    { dayOfWeek: 0, opensAt: "08:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 1, opensAt: "08:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 2, opensAt: "08:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 3, opensAt: "08:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 4, opensAt: "08:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 5, opensAt: "", closesAt: "", isClosed: true },
    { dayOfWeek: 6, opensAt: "", closesAt: "", isClosed: true },
  ];
}

export const DAY_LABEL_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

/** Approximate map centers when a city has no pin yet. */
export const COUNTRY_MAP_CENTERS: Record<string, { lat: number; lng: number }> = {
  RS: { lat: 44.8176, lng: 20.4569 },
  BA: { lat: 43.8563, lng: 18.4131 },
  ME: { lat: 42.4304, lng: 19.2594 },
  HR: { lat: 45.815, lng: 15.9819 },
  MK: { lat: 41.9973, lng: 21.428 },
  AL: { lat: 41.3275, lng: 19.8187 },
  SI: { lat: 46.0569, lng: 14.5058 },
};

export const DEFAULT_MAP_CENTER = { lat: 44.8176, lng: 20.4569 };
