"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import {
  approveBookingAction,
  rejectBookingAction,
  type HostBookingActionState,
} from "@/app/actions/host";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  formatPrice,
  type HostSlotBooking,
  type HostTimeSlot,
} from "@/lib/booking/slots";
import {
  addDaysToDateString,
  formatTimeInTimezone,
  getTodayInTimezone,
} from "@/lib/booking/timezone";
import type { HostBookingRow, HostVenueContext } from "@/lib/data/host-dashboard";
import { cn } from "@/lib/utils";

type HostDashboardPanelProps = {
  hostName: string;
  venue: HostVenueContext;
  selectedDate: string;
  slots: HostTimeSlot[];
  todayBookings: HostBookingRow[];
  pendingBookings: HostBookingRow[];
};

type BookingDetail = {
  id: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string | null;
  slotCount: number;
  totalPrice: number;
  startAt: string;
  endAt: string;
  status: string;
};

const initialActionState: HostBookingActionState = {};

function bookingRowToDetail(booking: HostBookingRow): BookingDetail {
  return {
    id: booking.id,
    playerName: booking.player_name,
    playerEmail: booking.player_email,
    playerPhone: booking.player_phone,
    slotCount: booking.slot_count,
    totalPrice: booking.total_price,
    startAt: booking.start_at,
    endAt: booking.end_at,
    status: booking.status,
  };
}

function slotBookingToDetail(booking: HostSlotBooking): BookingDetail {
  return {
    id: booking.id,
    playerName: booking.playerName,
    playerEmail: booking.playerEmail,
    playerPhone: booking.playerPhone,
    slotCount: booking.slotCount,
    totalPrice: booking.totalPrice,
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: booking.status,
  };
}

function formatBookingDateTime(
  startAt: string,
  endAt: string,
  timezone: string,
  locale: string,
) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const date = new Intl.DateTimeFormat(locale === "sr" ? "sr-RS" : "en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(start);
  const startTime = formatTimeInTimezone(start, timezone, locale);
  const endTime = formatTimeInTimezone(end, timezone, locale);
  return `${date} · ${startTime} – ${endTime}`;
}

function PendingBookingActions({
  bookingId,
  locale,
  onComplete,
}: {
  bookingId: string;
  locale: string;
  onComplete?: () => void;
}) {
  const t = useTranslations("host.dashboard");
  const router = useRouter();
  const [approveState, approveAction, approvePending] = useActionState(
    approveBookingAction.bind(null, locale),
    initialActionState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectBookingAction.bind(null, locale),
    initialActionState,
  );

  const error = approveState.error ?? rejectState.error;

  useEffect(() => {
    if (approveState.success || rejectState.success) {
      router.refresh();
      onComplete?.();
    }
  }, [approveState.success, rejectState.success, router, onComplete]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <form action={approveAction} className="flex-1">
          <input type="hidden" name="bookingId" value={bookingId} />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={approvePending || rejectPending}
          >
            {approvePending ? t("approving") : t("approve")}
          </Button>
        </form>
        <form action={rejectAction} className="flex-1">
          <input type="hidden" name="bookingId" value={bookingId} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={approvePending || rejectPending}
          >
            {rejectPending ? t("rejecting") : t("reject")}
          </Button>
        </form>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function BookingDetailDialog({
  booking,
  venue,
  locale,
  open,
  onOpenChange,
}: {
  booking: BookingDetail | null;
  venue: HostVenueContext;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("host.dashboard");

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bookingDetailTitle")}</DialogTitle>
          <DialogDescription>
            {formatBookingDateTime(
              booking.startAt,
              booking.endAt,
              venue.timezone,
              locale,
            )}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("playerName")}</dt>
            <dd className="font-medium">{booking.playerName || t("unknownPlayer")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("playerEmail")}</dt>
            <dd>{booking.playerEmail || t("notProvided")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("playerPhone")}</dt>
            <dd>{booking.playerPhone || t("notProvided")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("bookingStatus")}</dt>
            <dd>
              {booking.status === "pending"
                ? t("statusPending")
                : t("statusConfirmed")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("bookingSlots")}</dt>
            <dd>{t("slots", { count: booking.slotCount })}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("bookingTotal")}</dt>
            <dd className="font-medium">
              {formatPrice(booking.totalPrice, venue.currency, locale)}
            </dd>
          </div>
        </dl>

        {booking.status === "pending" ? (
          <PendingBookingActions
            bookingId={booking.id}
            locale={locale}
            onComplete={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BookingListItem({
  booking,
  venue,
  locale,
  showActions = false,
  onSelect,
}: {
  booking: HostBookingRow;
  venue: HostVenueContext;
  locale: string;
  showActions?: boolean;
  onSelect?: (booking: HostBookingRow) => void;
}) {
  const t = useTranslations("host.dashboard");

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(booking)}
        className="w-full rounded-2xl border border-border/60 bg-background/60 p-4 text-left transition-colors hover:border-primary/40 hover:bg-background/90"
      >
        <p className="font-medium">{booking.player_name || t("unknownPlayer")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatBookingDateTime(
            booking.start_at,
            booking.end_at,
            venue.timezone,
            locale,
          )}
        </p>
        <p className="mt-1 text-sm">
          {t("slots", { count: booking.slot_count })} ·{" "}
          {formatPrice(booking.total_price, venue.currency, locale)}
        </p>
        {booking.status === "pending" ? (
          <span className="mt-2 inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
            {t("statusPending")}
          </span>
        ) : (
          <span className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            {t("statusConfirmed")}
          </span>
        )}
        {showActions ? (
          <div className="mt-3" onClick={(event) => event.stopPropagation()}>
            <PendingBookingActions bookingId={booking.id} locale={locale} />
          </div>
        ) : null}
      </button>
    </li>
  );
}

export function HostDashboardPanel({
  hostName,
  venue,
  selectedDate,
  slots,
  todayBookings,
  pendingBookings,
}: HostDashboardPanelProps) {
  const t = useTranslations("host.dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(
    null,
  );

  const minDate = getTodayInTimezone(venue.timezone);
  const maxDate = addDaysToDateString(minDate, 30);

  const slotTimeLabel = (slot: HostTimeSlot) =>
    formatTimeInTimezone(new Date(slot.startAt), venue.timezone, locale);

  const slotStatusLabel = (slot: HostTimeSlot) => {
    if (slot.status === "past") return t("past");
    if (slot.status === "booked" && slot.booking?.status === "pending") {
      return slot.booking.playerName || t("pending");
    }
    if (slot.status === "booked") {
      return slot.booking?.playerName || t("booked");
    }
    if (slot.status === "locked") return t("locked");
    return t("available");
  };

  const isBookedSlot = (slot: HostTimeSlot) =>
    slot.status === "booked" && Boolean(slot.booking);

  const slotClassName = (slot: HostTimeSlot) => {
    const base =
      "flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors";

    if (slot.status === "past") {
      return cn(
        base,
        "border-border/40 bg-muted/40 text-muted-foreground",
      );
    }
    if (slot.status === "booked" && slot.booking?.status === "pending") {
      return cn(
        base,
        "cursor-pointer border-amber-500/40 bg-amber-500/10 text-amber-800 hover:border-amber-500/70 hover:bg-amber-500/20 dark:text-amber-300",
      );
    }
    if (slot.status === "booked") {
      return cn(
        base,
        "cursor-pointer border-red-500/40 bg-red-500/10 text-red-700 hover:border-red-500/70 hover:bg-red-500/20 dark:text-red-300",
      );
    }
    if (slot.status === "locked") {
      return cn(
        base,
        "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      );
    }
    return cn(
      base,
      "border-emerald-500/30 bg-emerald-500/5 text-foreground",
    );
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t("welcome", { name: hostName, venue: venue.company_name })}
          </p>
          <AppLink href="/host/settings" variant="outline" size="sm">
            {t("openSettings")}
          </AppLink>
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-dashboard-date">{t("selectDate")}</Label>
          <input
            id="host-dashboard-date"
            type="date"
            min={minDate}
            max={maxDate}
            value={selectedDate}
            onChange={(event) => {
              router.push(`/host/dashboard?date=${event.target.value}`);
            }}
            className="flex h-9 w-full min-w-[12rem] rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-[24rem] flex-col rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-lg font-medium">{t("calendarTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("calendarHint")}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
              {t("legendAvailable")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500/70" />
              {t("legendBooked")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500/70" />
              {t("legendPending")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-muted-foreground/40" />
              {t("legendPast")}
            </span>
          </div>

          {slots.length === 0 ? (
            <p className="mt-6 flex flex-1 items-center justify-center text-sm text-muted-foreground">
              {t("noSlots")}
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((slot) => {
                const booked = isBookedSlot(slot);

                if (booked && slot.booking) {
                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      title={t("clickForDetails")}
                      className={slotClassName(slot)}
                      onClick={() =>
                        setSelectedBooking(slotBookingToDetail(slot.booking!))
                      }
                    >
                      <span className="text-base font-semibold leading-none">
                        {slotTimeLabel(slot)}
                      </span>
                      <span className="max-w-full truncate px-1 text-center text-[0.7rem] font-normal opacity-90">
                        {slotStatusLabel(slot)}
                      </span>
                    </button>
                  );
                }

                return (
                  <div key={slot.startAt} className={slotClassName(slot)}>
                    <span className="text-base font-semibold leading-none">
                      {slotTimeLabel(slot)}
                    </span>
                    <span className="max-w-full truncate px-1 text-center text-[0.7rem] font-normal opacity-90">
                      {slotStatusLabel(slot)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-card/75 p-5 shadow-lg backdrop-blur-md">
            <h2 className="text-base font-medium">{t("todayTitle")}</h2>
            {todayBookings.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("todayEmpty")}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {todayBookings.map((booking) => (
                  <BookingListItem
                    key={booking.id}
                    booking={booking}
                    venue={venue}
                    locale={locale}
                    onSelect={(row) =>
                      setSelectedBooking(bookingRowToDetail(row))
                    }
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/75 p-5 shadow-lg backdrop-blur-md">
            <h2 className="text-base font-medium">{t("pendingTitle")}</h2>
            {pendingBookings.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("pendingEmpty")}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {pendingBookings.map((booking) => (
                  <BookingListItem
                    key={booking.id}
                    booking={booking}
                    venue={venue}
                    locale={locale}
                    showActions
                    onSelect={(row) =>
                      setSelectedBooking(bookingRowToDetail(row))
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <BookingDetailDialog
        booking={selectedBooking}
        venue={venue}
        locale={locale}
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
      />
    </section>
  );
}
