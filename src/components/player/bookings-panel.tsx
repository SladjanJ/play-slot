"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import {
  cancelBookingAction,
  type BookingActionState,
} from "@/app/actions/booking";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canCancelBooking } from "@/lib/booking/validation";
import { formatPrice } from "@/lib/booking/slots";
import { formatTimeInTimezone } from "@/lib/booking/timezone";
import type { PlayerBookingRow } from "@/lib/data/player-bookings";

type BookingsPanelProps = {
  bookings: PlayerBookingRow[];
  successMessage?: string;
};

const initialState: BookingActionState = {};

function statusLabelKey(status: string) {
  switch (status) {
    case "pending":
      return "statusPending";
    case "confirmed":
      return "statusConfirmed";
    case "cancelled":
      return "statusCancelled";
    case "expired":
      return "statusExpired";
    case "rejected":
      return "statusRejected";
    default:
      return "statusUnknown";
  }
}

export function BookingsPanel({ bookings, successMessage }: BookingsPanelProps) {
  const t = useTranslations("player.bookings");
  const locale = useLocale();
  const [cancelTarget, setCancelTarget] = useState<PlayerBookingRow | null>(
    null,
  );
  const [reason, setReason] = useState("");

  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelBookingAction.bind(null, locale),
    initialState,
  );

  const formatDateTime = (booking: PlayerBookingRow) => {
    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);
    const date = new Intl.DateTimeFormat(locale === "sr" ? "sr-RS" : "en-GB", {
      timeZone: booking.venue.timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(start);
    const startTime = formatTimeInTimezone(
      start,
      booking.venue.timezone,
      locale,
    );
    const endTime = formatTimeInTimezone(end, booking.venue.timezone, locale);
    return `${date} · ${startTime} – ${endTime}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <AppLink href="/search" variant="outline">
          {t("findVenue")}
        </AppLink>
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {successMessage}
        </div>
      ) : null}

      {cancelState.success ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {cancelState.success}
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-10 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <AppLink href="/search" className="mt-4">
            {t("findVenue")}
          </AppLink>
        </div>
      ) : (
        <ul className="grid gap-4">
          {bookings.map((booking) => {
            const cancelCheck = canCancelBooking(
              booking.start_at,
              booking.status,
            );

            return (
              <li
                key={booking.id}
                className="rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="font-heading text-lg font-semibold">
                      {booking.venue.company_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(booking)}
                    </p>
                    <p className="text-sm">
                      {t("slots", { count: booking.slot_count })} ·{" "}
                      {formatPrice(
                        booking.total_price,
                        booking.currency,
                        locale,
                      )}
                    </p>
                    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {t(statusLabelKey(booking.status))}
                    </span>
                    {booking.cancellation_reason ? (
                      <p className="text-sm text-muted-foreground">
                        {t("cancelReason", {
                          reason: booking.cancellation_reason,
                        })}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <AppLink
                      href={`/venues/${booking.venue.slug}`}
                      variant="outline"
                      size="sm"
                    >
                      {t("viewVenue")}
                    </AppLink>
                    {cancelCheck.allowed ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCancelTarget(booking);
                          setReason("");
                        }}
                      >
                        {t("cancel")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelTitle")}</DialogTitle>
            <DialogDescription>{t("cancelDescription")}</DialogDescription>
          </DialogHeader>

          {cancelTarget ? (
            <form action={cancelAction} className="space-y-4">
              <input type="hidden" name="bookingId" value={cancelTarget.id} />
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">{t("cancelReasonLabel")}</Label>
                <Input
                  id="cancellation-reason"
                  name="cancellationReason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={t("cancelReasonPlaceholder")}
                  required
                />
                {cancelState.fieldErrors?.cancellationReason ? (
                  <p className="text-sm text-destructive">
                    {cancelState.fieldErrors.cancellationReason}
                  </p>
                ) : null}
              </div>

              {cancelState.error ? (
                <p className="text-sm text-destructive">{cancelState.error}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelTarget(null)}
                >
                  {t("cancelDismiss")}
                </Button>
                <Button type="submit" variant="destructive" disabled={cancelPending}>
                  {cancelPending ? t("cancelling") : t("cancelConfirm")}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
