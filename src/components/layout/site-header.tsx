"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

import { LogoutButton } from "@/components/auth/logout-button";
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
};

export function SiteHeader({ locale, user }: SiteHeaderProps) {
  const t = useTranslations("common");
  const tPlayer = useTranslations("player.nav");
  const tHost = useTranslations("host.nav");
  const [open, setOpen] = useState(false);
  const isAuthenticated = Boolean(user);
  const isPlayer = user?.role === "player";
  const isHost = user?.role === "host";

  const playerNavDesktop = isPlayer ? (
    <nav className="hidden items-center gap-4 md:flex">
      <Link
        href="/search"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {tPlayer("search")}
      </Link>
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
      <Link
        href="/host/settings"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {tHost("settings")}
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
        href="/search"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {tPlayer("search")}
      </Link>
      <Link
        href="/bookings"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {tPlayer("bookings")}
      </Link>
    </nav>
  ) : null;

  const authNavDesktop = isAuthenticated ? (
    <div className="flex items-center gap-4">
      {playerNavDesktop}
      {hostNavDesktop}
      {user?.firstName ? (
        <span className="hidden text-sm text-muted-foreground lg:inline">
          {user.firstName}
        </span>
      ) : null}
      <LogoutButton locale={locale} variant="outline" className="h-9 px-4" />
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
      <div className="flex flex-col gap-2 px-4">
        {user?.firstName ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">{user.firstName}</p>
        ) : null}
        <LogoutButton locale={locale} variant="outline" className="h-10 w-full" />
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
          <span className="font-heading text-xl font-semibold tracking-tight">
            {t("appName")}
          </span>
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
            {authNavMobile}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
