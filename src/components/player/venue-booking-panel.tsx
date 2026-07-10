"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  acquireSlotLockAction,
  createBookingAction,
  releaseSlotLockAction,
  type BookingActionState,
} from "@/app/actions/booking";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  canBookConsecutiveSlots,
  computeBookingEndAt,
  formatPrice,
  type TimeSlot,
} from "@/lib/booking/slots";
import { SLOT_LOCK_MINUTES } from "@/lib/booking/constants";
import { sameInstant } from "@/lib/booking/timestamps";
import {
  addDaysToDateString,
  formatTimeInTimezone,
  getTodayInTimezone,
} from "@/lib/booking/timezone";
import type { VenueDetail } from "@/lib/data/venue-detail";
import { cn } from "@/lib/utils";

type ActiveLock = {
  id: string;
  start_at: string;
  end_at: string;
  expires_at: string;
} | null;

type VenueBookingPanelProps = {
  venue: VenueDetail;
  selectedDate: string;
  slots: TimeSlot[];
  activeLock: ActiveLock;
};

const initialState: BookingActionState = {};

function findSlotIndex(slots: TimeSlot[], startAt: string | null): number {
  if (!startAt) return -1;
  return slots.findIndex((slot) => sameInstant(slot.startAt, startAt));
}

export function VenueBookingPanel({
  venue,
  selectedDate,
  slots: initialSlots,
  activeLock: initialLock,
}: VenueBookingPanelProps) {
  const t = useTranslations("player.venue");
  const tBooking = useTranslations("booking");
  const locale = useLocale();
  const router = useRouter();

  const [date, setDate] = useState(selectedDate);
  const [selectedStartAt, setSelectedStartAt] = useState<string | null>(
    initialLock?.start_at ?? null,
  );
  const [slotCount, setSlotCount] = useState(() => {
    if (!initialLock) return 1;
    const durationMinutes =
      (new Date(initialLock.end_at).getTime() -
        new Date(initialLock.start_at).getTime()) /
      60000;
    return Math.max(1, Math.round(durationMinutes / venue.slot_duration_minutes));
  });
  const [activeLock, setActiveLock] = useState(initialLock);
  const [lockSecondsLeft, setLockSecondsLeft] = useState<number | null>(null);

  const [lockState, lockAction, lockPending] = useActionState(
    acquireSlotLockAction.bind(null, locale),
    initialState,
  );
  const [bookingState, bookingAction, bookingPending] = useActionState(
    createBookingAction.bind(null, locale),
    initialState,
  );

  const cityName = locale === "sr" ? venue.city_name_sr : venue.city_name_en;
  const countryName =
    locale === "sr" ? venue.country_name_sr : venue.country_name_en;

  const minDate = getTodayInTimezone(venue.timezone);
  const maxDate = addDaysToDateString(minDate, 30);

  const slots = initialSlots;

  const selectedIndex = useMemo(
    () => findSlotIndex(slots, selectedStartAt),
    [slots, selectedStartAt],
  );

  const canReserve =
    selectedIndex >= 0 &&
    canBookConsecutiveSlots(slots, selectedIndex, slotCount);

  const totalPrice = venue.price_per_slot * slotCount;

  const changeDate = useCallback(
    (nextDate: string) => {
      setDate(nextDate);
      setSelectedStartAt(null);
      setActiveLock(null);
      router.push(`/venues/${venue.slug}?date=${nextDate}`);
    },
    [router, venue.slug],
  );

  useEffect(() => {
    if (lockState.lockId && lockState.expiresAt && selectedStartAt) {
      setActiveLock({
        id: lockState.lockId,
        start_at: selectedStartAt,
        end_at: computeBookingEndAt(
          selectedStartAt,
          slotCount,
          venue.slot_duration_minutes,
        ),
        expires_at: lockState.expiresAt,
      });
    }
  }, [
    lockState.lockId,
    lockState.expiresAt,
    selectedStartAt,
    slotCount,
    venue.slot_duration_minutes,
  ]);

  useEffect(() => {
    if (!activeLock?.expires_at) {
      setLockSecondsLeft(null);
      return;
    }

    const update = () => {
      const diff = Math.max(
        0,
        Math.floor(
          (new Date(activeLock.expires_at).getTime() - Date.now()) / 1000,
        ),
      );
      setLockSecondsLeft(diff);
      if (diff === 0) {
        setActiveLock(null);
      }
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [activeLock]);

  const slotTimeLabel = (slot: TimeSlot) =>
    formatTimeInTimezone(new Date(slot.startAt), venue.timezone, locale);

  const slotStatusLabel = (slot: TimeSlot) => {
    if (slot.status === "past") return t("past");
    if (slot.status === "booked") return t("booked");
    if (slot.status === "locked" && !slot.lockedByMe) return t("locked");
    if (slot.lockedByMe) return t("heldByYou");
    return t("available");
  };

  const isSlotSelected = (slot: TimeSlot) =>
    selectedStartAt !== null && sameInstant(slot.startAt, selectedStartAt);

  const slotClassName = (slot: TimeSlot) => {
    const base =
      "flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors";

    if (slot.status === "past") {
      return cn(
        base,
        "cursor-not-allowed border-border/40 bg-muted/40 text-muted-foreground",
      );
    }
    if (slot.status === "booked") {
      return cn(
        base,
        "cursor-not-allowed border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
      );
    }
    if (slot.status === "locked" && !slot.lockedByMe) {
      return cn(
        base,
        "cursor-not-allowed border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      );
    }
    if (isSlotSelected(slot)) {
      return cn(
        base,
        "border-primary bg-primary text-primary-foreground shadow-sm",
      );
    }
    return cn(
      base,
      "border-emerald-500/30 bg-emerald-500/5 text-foreground hover:border-emerald-500/60 hover:bg-emerald-500/10",
    );
  };

  const isSlotDisabled = (slot: TimeSlot) =>
    slot.status === "past" ||
    slot.status === "booked" ||
    (slot.status === "locked" && !slot.lockedByMe);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <AppLink href="/search" variant="ghost" size="sm" className="mb-2 -ml-2">
            ← {t("backToSearch")}
          </AppLink>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {venue.company_name}
          </h1>
          <p className="text-muted-foreground">
            {cityName}, {countryName}
          </p>
          {venue.address ? (
            <p className="text-sm text-muted-foreground">{venue.address}</p>
          ) : null}
          {venue.host_phone ? (
            <p className="text-sm text-muted-foreground">
              {t("contactPhone", { phone: venue.host_phone })}
            </p>
          ) : null}
          <p className="text-sm font-medium">
            {t("pricePerSlot", {
              price: formatPrice(
                venue.price_per_slot,
                venue.currency,
                locale,
              ),
              minutes: venue.slot_duration_minutes,
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {venue.confirmation_mode === "auto"
              ? t("confirmationAuto")
              : t("confirmationPending")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-date">{t("selectDate")}</Label>
          <input
            id="booking-date"
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(event) => changeDate(event.target.value)}
            className="flex h-9 w-full min-w-[12rem] rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md">
          <h2 className="font-heading text-lg font-semibold">{t("slotsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("slotsHint")}</p>

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
              {t("legendLocked")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-muted-foreground/40" />
              {t("legendPast")}
            </span>
          </div>

          {slots.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("noSlots")}</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.startAt}
                  type="button"
                  disabled={isSlotDisabled(slot)}
                  className={slotClassName(slot)}
                  onClick={() => {
                    setSelectedStartAt(slot.startAt);
                    setActiveLock(null);
                  }}
                >
                  <span className="text-base font-semibold leading-none">
                    {slotTimeLabel(slot)}
                  </span>
                  <span className="text-[0.7rem] font-normal opacity-90">
                    {slotStatusLabel(slot)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md">
          <h2 className="font-heading text-lg font-semibold">
            {t("checkoutTitle")}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="slot-count">{t("slotCount")}</Label>
            <Select
              id="slot-count"
              value={String(slotCount)}
              onChange={(event) => {
                setSlotCount(Number(event.target.value));
                setActiveLock(null);
              }}
            >
              {Array.from({ length: venue.max_consecutive_slots }, (_, i) => i + 1).map(
                (count) => (
                  <option key={count} value={count}>
                    {t("slotCountOption", { count })}
                  </option>
                ),
              )}
            </Select>
          </div>

          <div className="rounded-2xl bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">{t("totalPrice")}</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatPrice(totalPrice, venue.currency, locale)}
            </p>
          </div>

          {lockState.error ? (
            <p className="text-sm text-destructive">{lockState.error}</p>
          ) : null}
          {bookingState.error ? (
            <p className="text-sm text-destructive">{bookingState.error}</p>
          ) : null}

          {!activeLock ? (
            <form action={lockAction}>
              <input type="hidden" name="venueId" value={venue.id} />
              <input
                type="hidden"
                name="startAt"
                value={selectedStartAt ?? ""}
              />
              <input type="hidden" name="slotCount" value={slotCount} />
              <Button
                type="submit"
                className="w-full"
                disabled={!canReserve || lockPending}
              >
                {lockPending ? tBooking("reserving") : t("reserve")}
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("lockActive", {
                  minutes: SLOT_LOCK_MINUTES,
                  seconds: lockSecondsLeft ?? 0,
                })}
              </p>

              <form action={bookingAction}>
                <input type="hidden" name="venueId" value={venue.id} />
                <input
                  type="hidden"
                  name="startAt"
                  value={activeLock.start_at || selectedStartAt || ""}
                />
                <input type="hidden" name="slotCount" value={slotCount} />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={bookingPending}
                >
                  {bookingPending
                    ? tBooking("confirming")
                    : venue.confirmation_mode === "auto"
                      ? t("confirmBooking")
                      : t("requestBooking")}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await releaseSlotLockAction(locale, activeLock.id);
                  setActiveLock(null);
                  router.refresh();
                }}
              >
                {t("cancelCheckout")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
