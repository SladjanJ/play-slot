import { z, type ZodIssue } from "zod";

import { BOOKING_MIN_ADVANCE_HOURS, CANCEL_MIN_HOURS } from "@/lib/booking/constants";

export const acquireSlotLockSchema = z.object({
  venueId: z.string().uuid(),
  startAt: z.string().min(1),
  slotCount: z.number().int().min(1).max(12),
});

export const createBookingSchema = z.object({
  venueId: z.string().uuid(),
  startAt: z.string().min(1),
  slotCount: z.number().int().min(1).max(12),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  cancellationReason: z
    .string()
    .trim()
    .min(3, "reasonRequired")
    .max(500, "reasonTooLong"),
});

export type BookingErrorKey =
  | "generic"
  | "notAuthenticated"
  | "notPlayer"
  | "venueNotFound"
  | "slotsUnavailable"
  | "invalidSlotCount"
  | "lockFailed"
  | "bookingFailed"
  | "bookingNotFound"
  | "cannotCancel"
  | "cancelTooLate"
  | "bookingTooSoon"
  | "reasonRequired"
  | "reasonTooLong";

export function zodIssuesToBookingFieldErrors(
  issues: ZodIssue[],
): Partial<Record<string, BookingErrorKey>> {
  const fieldErrors: Partial<Record<string, BookingErrorKey>> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    fieldErrors[field] = (issue.message as BookingErrorKey) ?? "generic";
  }

  return fieldErrors;
}

export function canCancelBooking(
  startAt: string,
  status: string,
  now = new Date(),
): { allowed: boolean; reason?: "cannotCancel" | "cancelTooLate" } {
  if (status !== "pending" && status !== "confirmed") {
    return { allowed: false, reason: "cannotCancel" };
  }

  const startMs = new Date(startAt).getTime();
  const minMs = CANCEL_MIN_HOURS * 60 * 60 * 1000;

  if (startMs - now.getTime() < minMs) {
    return { allowed: false, reason: "cancelTooLate" };
  }

  return { allowed: true };
}

export function canBookSlot(
  startAt: string,
  now = new Date(),
): { allowed: boolean; reason?: "bookingTooSoon" } {
  const startMs = new Date(startAt).getTime();
  const minMs = BOOKING_MIN_ADVANCE_HOURS * 60 * 60 * 1000;

  if (startMs - now.getTime() < minMs) {
    return { allowed: false, reason: "bookingTooSoon" };
  }

  return { allowed: true };
}
