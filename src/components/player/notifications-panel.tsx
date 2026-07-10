"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import type { NotificationRow } from "@/lib/notifications/data";

type NotificationsPanelProps = {
  notifications: NotificationRow[];
};

function formatTimestamp(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "sr" ? "sr-RS" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markRead = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  const markAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t("description")}
          </p>
        </div>

        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={markAllRead}
          >
            {t("markAllRead")}
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card/75 p-8 text-center shadow-lg backdrop-blur-md">
          <p className="text-muted-foreground">{t("empty")}</p>
          <AppLink href="/search" className="mt-4 inline-flex">
            {t("findVenue")}
          </AppLink>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <article
                className={
                  notification.read
                    ? "rounded-3xl border border-border/60 bg-card/60 p-5"
                    : "rounded-3xl border border-primary/30 bg-primary/5 p-5 shadow-sm"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-medium">{notification.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(notification.created_at, locale)}
                    </p>
                  </div>

                  {!notification.read ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => markRead(notification.id)}
                    >
                      {t("markRead")}
                    </Button>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
