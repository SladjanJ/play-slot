const WEEKDAY_TO_DB: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

/** YYYY-MM-DD in the venue timezone. */
export function getTodayInTimezone(timezone: string): string {
  return formatDateInTimezone(new Date(), timezone);
}

export function formatDateInTimezone(
  date: Date,
  timezone: string,
  locale = "en-CA",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatTimeInTimezone(
  date: Date,
  timezone: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** DB day_of_week (0 = Monday) for a calendar date in the venue timezone. */
export function getDbDayOfWeek(dateStr: string, timezone: string): number {
  const noonUtc = zonedDateTimeToUtc(dateStr, "12:00", timezone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  }).format(noonUtc);
  return WEEKDAY_TO_DB[weekday] ?? 0;
}

/** Local date + HH:mm in venue timezone → UTC Date. */
export function zonedDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(guess);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const zonedAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    0,
  );

  const offsetMs = zonedAsUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function formatTimeForInput(value: string | null | undefined): string {
  if (!value) return "";

  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function parseTimeToMinutes(time: string): number {
  const normalized = formatTimeForInput(time);
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

/** closes_at "00:00" with a later opens_at means end-of-day (24:00), not start-of-day. */
export function parseCloseTimeToMinutes(
  closesAt: string,
  opensAt: string,
): number {
  const close = parseTimeToMinutes(closesAt);
  const open = parseTimeToMinutes(opensAt);

  if (close === 0 && open > 0) return 24 * 60;
  if (close > 0 && close <= open) return close + 24 * 60;

  return close;
}

/** Human-readable close time; keeps 00:00 when it means end-of-day. */
export function formatCloseTimeForDisplay(
  closesAt: string,
  opensAt: string,
): string {
  const closes = formatTimeForInput(closesAt);
  const opens = formatTimeForInput(opensAt);

  if (closes === "00:00" && opens && parseTimeToMinutes(opens) > 0) {
    return "00:00";
  }

  return closes;
}

export function getDayWorkingHoursLabel(
  workingHours: Array<{
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    is_closed: boolean;
  }>,
  dateStr: string,
  timezone: string,
): string | null {
  const dayOfWeek = getDbDayOfWeek(dateStr, timezone);
  const dayHours = workingHours.find((hours) => hours.day_of_week === dayOfWeek);

  if (!dayHours || dayHours.is_closed || !dayHours.opens_at || !dayHours.closes_at) {
    return null;
  }

  const opens = formatTimeForInput(dayHours.opens_at);
  const closes = formatCloseTimeForDisplay(dayHours.closes_at, dayHours.opens_at);

  return `${opens}–${closes}`;
}
