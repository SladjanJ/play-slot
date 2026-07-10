import { getTranslations } from "next-intl/server";

import { bookingEmailHtml, sendEmail } from "@/lib/email/send";
import { createNotification } from "@/lib/notifications/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatTimeInTimezone } from "@/lib/booking/timezone";

type BookingContext = {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  slot_count: number;
  total_price: number;
  cancellation_reason: string | null;
  venue: {
    id: string;
    company_name: string;
    timezone: string;
    host_id: string;
  };
  player: {
    id: string;
    email: string;
    first_name: string;
    last_name: string | null;
  };
  host: {
    id: string;
    email: string;
    first_name: string;
  };
};

async function getBookingContext(bookingId: string): Promise<BookingContext | null> {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      `
      id,
      status,
      start_at,
      end_at,
      slot_count,
      total_price,
      cancellation_reason,
      venues!inner (
        id,
        company_name,
        timezone,
        host_id
      ),
      profiles!bookings_player_id_fkey (
        id,
        email,
        first_name,
        last_name
      )
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return null;

  const venue = booking.venues as BookingContext["venue"];
  const player = booking.profiles as BookingContext["player"];

  const { data: host } = await admin
    .from("profiles")
    .select("id, email, first_name")
    .eq("id", venue.host_id)
    .single();

  if (!host) return null;

  return {
    id: booking.id,
    status: booking.status,
    start_at: booking.start_at,
    end_at: booking.end_at,
    slot_count: booking.slot_count,
    total_price: Number(booking.total_price),
    cancellation_reason: booking.cancellation_reason,
    venue,
    player,
    host,
  };
}

function formatBookingWindow(
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

function playerDisplayName(player: BookingContext["player"]) {
  return [player.first_name, player.last_name].filter(Boolean).join(" ");
}

export async function notifyBookingCreated(bookingId: string, locale: string) {
  const ctx = await getBookingContext(bookingId);
  if (!ctx) return;

  const t = await getTranslations({ locale, namespace: "notifications.events" });
  const when = formatBookingWindow(
    ctx.start_at,
    ctx.end_at,
    ctx.venue.timezone,
    locale,
  );
  const playerName = playerDisplayName(ctx.player);

  if (ctx.status === "confirmed") {
    await createNotification({
      userId: ctx.player.id,
      type: "booking_confirmed",
      title: t("bookingConfirmedTitle"),
      message: t("bookingConfirmedMessage", {
        venue: ctx.venue.company_name,
        when,
      }),
      metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
    });

    await sendEmail({
      to: ctx.player.email,
      subject: t("bookingConfirmedEmailSubject", {
        venue: ctx.venue.company_name,
      }),
      html: bookingEmailHtml({
        greeting: t("emailGreeting", { name: playerName }),
        body: t("bookingConfirmedEmailBody", {
          venue: ctx.venue.company_name,
          when,
        }),
        footer: t("emailFooter"),
      }),
    });

    await sendEmail({
      to: ctx.host.email,
      subject: t("hostNewBookingEmailSubject", { player: playerName }),
      html: bookingEmailHtml({
        greeting: t("emailGreeting", { name: ctx.host.first_name }),
        body: t("hostNewBookingEmailBody", {
          player: playerName,
          venue: ctx.venue.company_name,
          when,
        }),
        footer: t("emailFooter"),
      }),
    });
    return;
  }

  if (ctx.status === "pending") {
    await createNotification({
      userId: ctx.player.id,
      type: "booking_pending",
      title: t("bookingPendingPlayerTitle"),
      message: t("bookingPendingPlayerMessage", {
        venue: ctx.venue.company_name,
        when,
      }),
      metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
    });

    await createNotification({
      userId: ctx.host.id,
      type: "booking_pending",
      title: t("bookingPendingHostTitle"),
      message: t("bookingPendingHostMessage", {
        player: playerName,
        venue: ctx.venue.company_name,
        when,
      }),
      metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
    });

    await sendEmail({
      to: ctx.host.email,
      subject: t("hostPendingEmailSubject", { player: playerName }),
      html: bookingEmailHtml({
        greeting: t("emailGreeting", { name: ctx.host.first_name }),
        body: t("hostPendingEmailBody", {
          player: playerName,
          venue: ctx.venue.company_name,
          when,
        }),
        footer: t("emailFooter"),
      }),
    });
  }
}

export async function notifyBookingApproved(bookingId: string, locale: string) {
  const ctx = await getBookingContext(bookingId);
  if (!ctx) return;

  const t = await getTranslations({ locale, namespace: "notifications.events" });
  const when = formatBookingWindow(
    ctx.start_at,
    ctx.end_at,
    ctx.venue.timezone,
    locale,
  );
  const playerName = playerDisplayName(ctx.player);

  await createNotification({
    userId: ctx.player.id,
    type: "booking_confirmed",
    title: t("bookingApprovedTitle"),
    message: t("bookingApprovedMessage", {
      venue: ctx.venue.company_name,
      when,
    }),
    metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
  });

  await sendEmail({
    to: ctx.player.email,
    subject: t("bookingApprovedEmailSubject", {
      venue: ctx.venue.company_name,
    }),
    html: bookingEmailHtml({
      greeting: t("emailGreeting", { name: playerName }),
      body: t("bookingApprovedEmailBody", {
        venue: ctx.venue.company_name,
        when,
      }),
      footer: t("emailFooter"),
    }),
  });
}

export async function notifyBookingRejected(bookingId: string, locale: string) {
  const ctx = await getBookingContext(bookingId);
  if (!ctx) return;

  const t = await getTranslations({ locale, namespace: "notifications.events" });
  const when = formatBookingWindow(
    ctx.start_at,
    ctx.end_at,
    ctx.venue.timezone,
    locale,
  );
  const playerName = playerDisplayName(ctx.player);

  await createNotification({
    userId: ctx.player.id,
    type: "booking_rejected",
    title: t("bookingRejectedTitle"),
    message: t("bookingRejectedMessage", {
      venue: ctx.venue.company_name,
      when,
    }),
    metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
  });

  await sendEmail({
    to: ctx.player.email,
    subject: t("bookingRejectedEmailSubject", {
      venue: ctx.venue.company_name,
    }),
    html: bookingEmailHtml({
      greeting: t("emailGreeting", { name: playerName }),
      body: t("bookingRejectedEmailBody", {
        venue: ctx.venue.company_name,
        when,
      }),
      footer: t("emailFooter"),
    }),
  });
}

export async function notifyBookingCancelled(
  bookingId: string,
  locale: string,
  cancellationReason?: string,
) {
  const ctx = await getBookingContext(bookingId);
  if (!ctx) return;

  const t = await getTranslations({ locale, namespace: "notifications.events" });
  const when = formatBookingWindow(
    ctx.start_at,
    ctx.end_at,
    ctx.venue.timezone,
    locale,
  );
  const playerName = playerDisplayName(ctx.player);
  const reason =
    cancellationReason?.trim() ||
    ctx.cancellation_reason?.trim() ||
    t("noReasonProvided");

  await createNotification({
    userId: ctx.host.id,
    type: "booking_cancelled",
    title: t("bookingCancelledHostTitle"),
    message: t("bookingCancelledHostMessage", {
      player: playerName,
      venue: ctx.venue.company_name,
      when,
      reason,
    }),
    metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
  });

  await createNotification({
    userId: ctx.player.id,
    type: "booking_cancelled",
    title: t("bookingCancelledPlayerTitle"),
    message: t("bookingCancelledPlayerMessage", {
      venue: ctx.venue.company_name,
      when,
    }),
    metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
  });

  await sendEmail({
    to: ctx.host.email,
    subject: t("hostCancelledEmailSubject", { player: playerName }),
    html: bookingEmailHtml({
      greeting: t("emailGreeting", { name: ctx.host.first_name }),
      body: t("hostCancelledEmailBody", {
        player: playerName,
        venue: ctx.venue.company_name,
        when,
        reason,
      }),
      footer: t("emailFooter"),
    }),
  });

  await sendEmail({
    to: ctx.player.email,
    subject: t("playerCancelledEmailSubject", { venue: ctx.venue.company_name }),
    html: bookingEmailHtml({
      greeting: t("emailGreeting", { name: playerName }),
      body: t("playerCancelledEmailBody", {
        venue: ctx.venue.company_name,
        when,
      }),
      footer: t("emailFooter"),
    }),
  });
}

export async function notifyBookingExpired(bookingId: string, locale: string) {
  const ctx = await getBookingContext(bookingId);
  if (!ctx || ctx.status !== "expired") return;

  const t = await getTranslations({ locale, namespace: "notifications.events" });
  const when = formatBookingWindow(
    ctx.start_at,
    ctx.end_at,
    ctx.venue.timezone,
    locale,
  );
  const playerName = playerDisplayName(ctx.player);

  await createNotification({
    userId: ctx.player.id,
    type: "booking_expired",
    title: t("bookingExpiredPlayerTitle"),
    message: t("bookingExpiredPlayerMessage", {
      venue: ctx.venue.company_name,
      when,
    }),
    metadata: { bookingId: ctx.id, venueId: ctx.venue.id },
  });

  await sendEmail({
    to: ctx.player.email,
    subject: t("bookingExpiredEmailSubject", { venue: ctx.venue.company_name }),
    html: bookingEmailHtml({
      greeting: t("emailGreeting", { name: playerName }),
      body: t("bookingExpiredEmailBody", {
        venue: ctx.venue.company_name,
        when,
      }),
      footer: t("emailFooter"),
    }),
  });
}

export async function notifyPendingBookingsMassCancelled(
  venueId: string,
  locale: string,
) {
  const admin = createAdminClient();

  const { data: venue } = await admin
    .from("venues")
    .select("company_name, host_id")
    .eq("id", venueId)
    .single();

  if (!venue) return;

  const { data: bookings } = await admin
    .from("bookings")
    .select(
      `
      id,
      player_id,
      start_at,
      end_at,
      profiles!bookings_player_id_fkey (
        email,
        first_name,
        last_name
      )
    `,
    )
    .eq("venue_id", venueId)
    .eq("status", "cancelled")
    .eq("cancellation_reason", "Host switched to automatic confirmation");

  if (!bookings?.length) return;

  const t = await getTranslations({ locale, namespace: "notifications.events" });

  for (const booking of bookings) {
    const player = booking.profiles as {
      email: string;
      first_name: string;
      last_name: string | null;
    };

    await createNotification({
      userId: booking.player_id,
      type: "booking_cancelled",
      title: t("massCancelTitle"),
      message: t("massCancelMessage", { venue: venue.company_name }),
      metadata: { bookingId: booking.id, venueId },
    });

    const playerName = [player.first_name, player.last_name]
      .filter(Boolean)
      .join(" ");

    await sendEmail({
      to: player.email,
      subject: t("massCancelEmailSubject", { venue: venue.company_name }),
      html: bookingEmailHtml({
        greeting: t("emailGreeting", { name: playerName }),
        body: t("massCancelEmailBody", { venue: venue.company_name }),
        footer: t("emailFooter"),
      }),
    });
  }
}
