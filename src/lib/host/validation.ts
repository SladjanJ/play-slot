import { z, type ZodIssue } from "zod";

import { TIMEZONE_OPTIONS } from "@/lib/auth/validation";
import {
  DEFAULT_CONFIRMATION_MODE,
  DEFAULT_MAX_CONSECUTIVE_SLOTS,
  DEFAULT_SLOT_DURATION,
  SLOT_DURATION_OPTIONS,
} from "@/lib/host/constants";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const workingDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    opensAt: z.string(),
    closesAt: z.string(),
    isClosed: z.boolean(),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) return;

    if (!timeRegex.test(day.opensAt)) {
      ctx.addIssue({
        code: "custom",
        message: "opensAtRequired",
        path: ["opensAt"],
      });
    }

    if (!timeRegex.test(day.closesAt)) {
      ctx.addIssue({
        code: "custom",
        message: "closesAtRequired",
        path: ["closesAt"],
      });
    }

    if (
      timeRegex.test(day.opensAt) &&
      timeRegex.test(day.closesAt) &&
      day.opensAt >= day.closesAt
    ) {
      ctx.addIssue({
        code: "custom",
        message: "closesAfterOpens",
        path: ["closesAt"],
      });
    }
  });

export const hostSetupBasicsSchema = z.object({
  companyName: z.string().trim().min(1, "companyNameRequired"),
  countryId: z.string().uuid("countryRequired"),
  cityId: z.string().uuid("cityRequired"),
  timezone: z
    .string()
    .trim()
    .min(1, "timezoneRequired")
    .refine(
      (value) => TIMEZONE_OPTIONS.includes(value as (typeof TIMEZONE_OPTIONS)[number]),
      "timezoneRequired",
    ),
});

export const hostSetupLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().trim().min(1, "addressRequired"),
});

export const hostSetupWorkingHoursSchema = z.object({
  workingHours: z
    .array(workingDaySchema)
    .length(7, "workingHoursRequired")
    .refine(
      (days) => days.some((day) => !day.isClosed),
      "atLeastOneOpenDay",
    ),
});

export const hostSetupPricingSchema = z.object({
  slotDurationMinutes: z
    .number()
    .refine(
      (value) =>
        SLOT_DURATION_OPTIONS.includes(value as (typeof SLOT_DURATION_OPTIONS)[number]),
      "slotDurationRequired",
    ),
  maxConsecutiveSlots: z.number().int().min(1, "maxSlotsMin").max(12, "maxSlotsMax"),
  pricePerSlot: z
    .number({ error: "priceRequired" })
    .positive("pricePositive"),
  confirmationMode: z.enum(["auto", "pending"], {
    error: "confirmationModeRequired",
  }),
});

export const publishVenueSchema = hostSetupBasicsSchema
  .merge(hostSetupLocationSchema)
  .merge(hostSetupWorkingHoursSchema)
  .merge(hostSetupPricingSchema);

export const updateVenueSettingsSchema = publishVenueSchema.extend({
  phone: z.string().trim().optional(),
  cancelPendingBookings: z.boolean().optional(),
});

export type PublishVenueInput = z.infer<typeof publishVenueSchema>;
export type UpdateVenueSettingsInput = z.infer<typeof updateVenueSettingsSchema>;

export type HostSetupErrorKey =
  | "generic"
  | "notAuthenticated"
  | "notHost"
  | "venueAlreadyPublished"
  | "publishFailed"
  | "companyNameRequired"
  | "countryRequired"
  | "cityRequired"
  | "timezoneRequired"
  | "addressRequired"
  | "locationRequired"
  | "workingHoursRequired"
  | "atLeastOneOpenDay"
  | "opensAtRequired"
  | "closesAtRequired"
  | "closesAfterOpens"
  | "slotDurationRequired"
  | "maxSlotsMin"
  | "maxSlotsMax"
  | "priceRequired"
  | "pricePositive"
  | "confirmationModeRequired"
  | "bookingActionFailed"
  | "venueNotPublished"
  | "settingsUpdateFailed"
  | "pendingCancellationRequired";

export function zodIssuesToHostFieldErrors(
  issues: ZodIssue[],
): Partial<Record<string, HostSetupErrorKey>> {
  const fieldErrors: Partial<Record<string, HostSetupErrorKey>> = {};

  for (const issue of issues) {
    const field = issue.path.map(String).join(".");
    if (!field || fieldErrors[field]) continue;
    fieldErrors[field] = (issue.message ?? "generic") as HostSetupErrorKey;
  }

  return fieldErrors;
}

export function defaultPublishVenueInput(
  partial?: Partial<PublishVenueInput>,
): PublishVenueInput {
  return {
    companyName: partial?.companyName ?? "",
    countryId: partial?.countryId ?? "",
    cityId: partial?.cityId ?? "",
    timezone: partial?.timezone ?? "",
    lat: partial?.lat ?? 0,
    lng: partial?.lng ?? 0,
    address: partial?.address ?? "",
    workingHours: partial?.workingHours ?? [],
    slotDurationMinutes: partial?.slotDurationMinutes ?? DEFAULT_SLOT_DURATION,
    maxConsecutiveSlots:
      partial?.maxConsecutiveSlots ?? DEFAULT_MAX_CONSECUTIVE_SLOTS,
    pricePerSlot: partial?.pricePerSlot ?? 0,
    confirmationMode: partial?.confirmationMode ?? DEFAULT_CONFIRMATION_MODE,
  };
}
