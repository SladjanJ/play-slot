"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

import { Link } from "@/i18n/navigation";
import { PlaySlotLogo } from "@/components/layout/playslot-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SiteHeader() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <PlaySlotLogo size={36} />
          <span className="font-heading text-lg font-semibold tracking-tight md:hidden">
            {t("appName")}
          </span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <span className="font-heading text-xl font-semibold tracking-tight">
            {t("appName")}
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/register"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("register")}
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("login")}
          </Link>
        </nav>

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
            <nav className="flex flex-col gap-2 px-4">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t("register")}
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t("login")}
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
