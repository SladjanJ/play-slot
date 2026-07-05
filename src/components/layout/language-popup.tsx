"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  detectBrowserLocale,
  hasLocaleCookie,
  setLocaleCookie,
  type AppLocale,
} from "@/lib/locale";

type LanguagePopupProps = {
  forceOpen?: boolean;
};

export function LanguagePopup({ forceOpen = false }: LanguagePopupProps) {
  const t = useTranslations("language");
  const [open, setOpen] = useState(forceOpen);
  const [detectedLocale, setDetectedLocale] = useState<AppLocale>("sr");

  useEffect(() => {
    setDetectedLocale(detectBrowserLocale());

    if (forceOpen || !hasLocaleCookie()) {
      setOpen(true);
    }
  }, [forceOpen]);

  function chooseLocale(locale: AppLocale) {
    setLocaleCookie(locale);
    setOpen(false);
    window.location.href = `/${locale}`;
  }

  const continueLabel =
    detectedLocale === "sr" ? t("continueSr") : t("continueEn");

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            size="lg"
            className="h-11 w-full text-base"
            onClick={() => chooseLocale(detectedLocale)}
          >
            {continueLabel}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => chooseLocale("sr")}
            >
              {t("sr")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => chooseLocale("en")}
            >
              {t("en")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
