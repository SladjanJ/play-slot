"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Notification01Icon } from "@hugeicons/core-free-icons";

import { LogoutButton } from "@/components/auth/logout-button";
import { HeaderSearch } from "@/components/layout/header-search";
import { HostUserMenu } from "@/components/layout/host-user-menu";
import { Link as I18nLink } from "@/i18n/navigation";
import Link from "next/link";
import { PlaySlotLogo } from "@/components/layout/playslot-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SiteHeaderProps = {
  locale: string;
  user?: { firstName: string; role?: string } | null;
  unreadNotifications?: number;
};

export function SiteHeader({ locale, user, unreadNotifications = 0 }: SiteHeaderProps) {
  const t = useTranslations("common");
  const tPlayer = useTranslations("player.nav");
  const tHost = useTranslations("host.nav");
  const [open, setOpen] = useState(false);
  const isAuthenticated = Boolean(user);
  const isPlayer = user?.role === "player";
  const isHost = user?.role === "host";

  const showSearch = !isHost;

  const notificationsBell = isAuthenticated ? (
    <Link
      href="/notifications"
      className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      aria-label={t("notifications")}
    >
      <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} className="size-4" />
      {unreadNotifications > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          {unreadNotifications > 9 ? "9+" : unreadNotifications}
        </span>
      ) : null}
    </Link>
  ) : null;

  const playerNavDesktop = isPlayer ? (
    <nav className="hidden items-center gap-4 md:flex">
      <Link
        href="/bookings"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {tPlayer("bookings")}
      </Link>
    </nav>
  ) : null;

  const hostNavDesktop = isHost ? (
    <nav className="hidden items-center gap-4 md:flex">
      <Link
        href="/host/dashboard"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {tHost("dashboard")}
      </Link>
    </nav>
  ) : null;

  const hostNavMobile = isHost ? (
    <nav className="flex flex-col gap-2 px-4">
      <Link
        href="/host/dashboard"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {tHost("dashboard")}
      </Link>
      <Link
        href="/host/settings"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {tHost("settings")}
      </Link>
    </nav>
  ) : null;

  const playerNavMobile = isPlayer ? (
    <nav className="flex flex-col gap-2 px-4">
      <Link
        href="/bookings"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {tPlayer("bookings")}
      </Link>
    </nav>
  ) : null;

  const userNameDisplay =
    user?.firstName && isHost ? (
      <HostUserMenu firstName={user.firstName} />
    ) : user?.firstName ? (
      <span className="text-sm text-muted-foreground">{user.firstName}</span>
    ) : null;

  const userActionsDesktop = isAuthenticated ? (
    <div className="flex items-center gap-2.5">
      {userNameDisplay}
      {notificationsBell}
      <LogoutButton
        locale={locale}
        variant="outline"
        className="h-9 px-4 transition-colors hover:bg-muted/80"
      />
    </div>
  ) : null;

  const authNavDesktop = isAuthenticated ? (
    <div className="flex items-center gap-4">
      {playerNavDesktop}
      {hostNavDesktop}
      {userActionsDesktop}
    </div>
  ) : (
    <>
      <I18nLink
        href="/register"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("register")}
      </I18nLink>
      <I18nLink
        href="/login"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("login")}
      </I18nLink>
    </>
  );

  const authNavMobile = isAuthenticated ? (
    <div className="flex flex-col gap-2">
      {playerNavMobile}
      {hostNavMobile}
      <div className="flex items-center gap-3 px-4 py-2">
        {user?.firstName ? (
          <span className="flex-1 text-sm text-muted-foreground">{user.firstName}</span>
        ) : (
          <span className="flex-1" />
        )}
        {notificationsBell}
        <LogoutButton
          locale={locale}
          variant="outline"
          className="h-9 shrink-0 px-4 transition-colors hover:bg-muted/80"
        />
      </div>
    </div>
  ) : (
    <nav className="flex flex-col gap-2 px-4">
      <I18nLink
        href="/register"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {t("register")}
      </I18nLink>
      <I18nLink
        href="/login"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {t("login")}
      </I18nLink>
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <I18nLink href="/" className="flex items-center gap-2.5">
          <PlaySlotLogo size={36} />
          <span className="font-heading text-lg font-semibold tracking-tight md:hidden">
            {t("appName")}
          </span>
        </I18nLink>

        <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          {showSearch ? (
            <HeaderSearch className="w-[min(100%,20rem)]" />
          ) : (
            <span className="font-heading text-xl font-semibold tracking-tight">
              {t("appName")}
            </span>
          )}
        </div>

        <nav className="hidden items-center gap-6 md:flex">{authNavDesktop}</nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,20rem)]">
            <SheetHeader>
              <SheetTitle>{t("appName")}</SheetTitle>
            </SheetHeader>
            {showSearch ? (
              <div className="px-4 pb-2">
                <HeaderSearch />
              </div>
            ) : null}
            {authNavMobile}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
