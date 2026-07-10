import {
  addDaysToDateString,
  getDbDayOfWeek,
  parseCloseTimeToMinutes,
  parseTimeToMinutes,
  zonedDateTimeToUtc,
} from "@/lib/booking/timezone";
import { BOOKING_MIN_ADVANCE_HOURS } from "@/lib/booking/constants";

export type SlotStatus = "available" | "booked" | "locked" | "past";

export type TimeSlot = {
  startAt: string;
  endAt: string;
  status: SlotStatus;
  lockedByMe: boolean;
};

export type BookingOccupancy = OccupiedRange & {
  id: string;
  status: "pending" | "confirmed";
  playerName: string;
  playerEmail: string;
  playerPhone: string | null;
  slotCount: number;
  totalPrice: number;
};

export type HostSlotBooking = {
  id: string;
  status: "pending" | "confirmed";
  playerName: string;
  playerEmail: string;
  playerPhone: string | null;
  slotCount: number;
  totalPrice: number;
  startAt: string;
  endAt: string;
};

export type HostTimeSlot = TimeSlot & {
  booking?: HostSlotBooking;
};

export type WorkingHourRow = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

export type OccupiedRange = {
  start_at: string;
  end_at: string;
  locked_by?: string;
  expires_at?: string;
};

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function generateSlotsForDay({
  dateStr,
  timezone,
  slotDurationMinutes,
  workingHours,
  bookings,
  locks,
  currentUserId,
  now = new Date(),
}: {
  dateStr: string;
  timezone: string;
  slotDurationMinutes: number;
  workingHours: WorkingHourRow[];
  bookings: OccupiedRange[];
  locks: OccupiedRange[];
  currentUserId: string;
  now?: Date;
}): TimeSlot[] {
  const dayOfWeek = getDbDayOfWeek(dateStr, timezone);
  const dayHours = workingHours.find((h) => h.day_of_week === dayOfWeek);

  if (!dayHours || dayHours.is_closed || !dayHours.opens_at || !dayHours.closes_at) {
    return [];
  }

  const openMinutes = parseTimeToMinutes(dayHours.opens_at);
  const closeMinutes = parseCloseTimeToMinutes(
    dayHours.closes_at,
    dayHours.opens_at,
  );
  const slots: TimeSlot[] = [];
  const nowMs = now.getTime();
  const minAdvanceMs = BOOKING_MIN_ADVANCE_HOURS * 60 * 60 * 1000;

  for (
    let startMinutes = openMinutes;
    startMinutes + slotDurationMinutes <= closeMinutes;
    startMinutes += slotDurationMinutes
  ) {
    const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`;
    const endMinutes = startMinutes + slotDurationMinutes;

    let endDateStr = dateStr;
    let endTime: string;
    if (endMinutes >= 24 * 60) {
      endDateStr = addDaysToDateString(dateStr, 1);
      endTime = "00:00";
    } else {
      endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    }

    const startAt = zonedDateTimeToUtc(dateStr, startTime, timezone);
    const endAt = zonedDateTimeToUtc(endDateStr, endTime, timezone);
    const startMs = startAt.getTime();
    const endMs = endAt.getTime();

    let status: SlotStatus = "available";
    let lockedByMe = false;

    if (startMs - nowMs < minAdvanceMs) {
      status = "past";
    } else {
      for (const booking of bookings) {
        const bStart = new Date(booking.start_at).getTime();
        const bEnd = new Date(booking.end_at).getTime();
        if (rangesOverlap(startMs, endMs, bStart, bEnd)) {
          status = "booked";
          break;
        }
      }

      if (status === "available") {
        for (const lock of locks) {
          const expiresAt = lock.expires_at
            ? new Date(lock.expires_at).getTime()
            : 0;
          if (expiresAt <= nowMs) continue;

          const lStart = new Date(lock.start_at).getTime();
          const lEnd = new Date(lock.end_at).getTime();
          if (rangesOverlap(startMs, endMs, lStart, lEnd)) {
            if (lock.locked_by === currentUserId) {
              lockedByMe = true;
            } else {
              status = "locked";
            }
            break;
          }
        }
      }
    }

    slots.push({
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      status,
      lockedByMe,
    });
  }

  return slots;
}

export function canBookConsecutiveSlots(
  slots: TimeSlot[],
  startIndex: number,
  slotCount: number,
): boolean {
  if (startIndex < 0 || slotCount < 1 || startIndex + slotCount > slots.length) {
    return false;
  }

  for (let i = startIndex; i < startIndex + slotCount; i++) {
    const slot = slots[i];
    if (!slot || slot.status !== "available") {
      return false;
    }
    if (i > startIndex) {
      const prev = slots[i - 1];
      if (!prev || prev.endAt !== slot.startAt) {
        return false;
      }
    }
  }

  return true;
}

export function computeBookingEndAt(
  startAt: string,
  slotCount: number,
  slotDurationMinutes: number,
): string {
  const end = new Date(startAt);
  end.setUTCMinutes(end.getUTCMinutes() + slotCount * slotDurationMinutes);
  return end.toISOString();
}

export function formatPrice(
  amount: number,
  currency: string,
  locale: string,
): string {
  const intlLocale = locale === "sr" ? "sr-RS" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function toHostSlotBooking(booking: BookingOccupancy): HostSlotBooking {
  return {
    id: booking.id,
    status: booking.status,
    playerName: booking.playerName,
    playerEmail: booking.playerEmail,
    playerPhone: booking.playerPhone,
    slotCount: booking.slotCount,
    totalPrice: booking.totalPrice,
    startAt: booking.start_at,
    endAt: booking.end_at,
  };
}

export function enrichSlotsWithBookings(
  slots: TimeSlot[],
  bookings: BookingOccupancy[],
): HostTimeSlot[] {
  return slots.map((slot) => {
    if (slot.status !== "booked") {
      return slot;
    }

    const startMs = new Date(slot.startAt).getTime();
    const endMs = new Date(slot.endAt).getTime();

    for (const booking of bookings) {
      const bStart = new Date(booking.start_at).getTime();
      const bEnd = new Date(booking.end_at).getTime();
      if (rangesOverlap(startMs, endMs, bStart, bEnd)) {
        return {
          ...slot,
          booking: toHostSlotBooking(booking),
        };
      }
    }

    return slot;
  });
}

/** Keeps booked slots visible even when working hours no longer cover them. */
export function enrichHostSlotsWithBookings(
  slots: TimeSlot[],
  bookings: BookingOccupancy[],
  slotDurationMinutes: number,
): HostTimeSlot[] {
  const enriched = enrichSlotsWithBookings(slots, bookings);
  const extraSlots: HostTimeSlot[] = [];
  const slotMs = slotDurationMinutes * 60 * 1000;

  for (const booking of bookings) {
    let cursor = new Date(booking.start_at).getTime();
    const bookingEnd = new Date(booking.end_at).getTime();

    while (cursor < bookingEnd) {
      const slotEnd = Math.min(cursor + slotMs, bookingEnd);
      const startAt = new Date(cursor).toISOString();
      const endAt = new Date(slotEnd).toISOString();

      const coveredByWorkingHours = slots.some((slot) => {
        const slotStart = new Date(slot.startAt).getTime();
        const slotEndMs = new Date(slot.endAt).getTime();
        return rangesOverlap(cursor, slotEnd, slotStart, slotEndMs);
      });

      if (!coveredByWorkingHours) {
        extraSlots.push({
          startAt,
          endAt,
          status: "booked",
          lockedByMe: false,
          booking: toHostSlotBooking(booking),
        });
      }

      cursor = slotEnd;
    }
  }

  return [...enriched, ...extraSlots].sort((a, b) =>
    a.startAt.localeCompare(b.startAt),
  );
}
