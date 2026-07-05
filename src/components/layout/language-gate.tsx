"use client";

import { NextIntlClientProvider } from "next-intl";

import { LanguagePopup } from "@/components/layout/language-popup";
import { PlaySlotLogo } from "@/components/layout/playslot-logo";
import srMessages from "../../../messages/sr.json";

export function LanguageGate() {
  return (
    <NextIntlClientProvider locale="sr" messages={srMessages}>
      <div className="landing-page flex min-h-full flex-col">
        <div className="landing-glow pointer-events-none absolute inset-0" />
        <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <PlaySlotLogo size={80} />
            <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              PlaySlot
            </p>
          </div>
        </main>
        <LanguagePopup forceOpen />
      </div>
    </NextIntlClientProvider>
  );
}
