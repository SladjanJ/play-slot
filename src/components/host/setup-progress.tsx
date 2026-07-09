"use client";

import { useTranslations } from "next-intl";

import { SETUP_STEPS, type SetupStep } from "@/lib/host/constants";
import { cn } from "@/lib/utils";

type SetupProgressProps = {
  currentStep: SetupStep;
};

export function SetupProgress({ currentStep }: SetupProgressProps) {
  const t = useTranslations("host.setup.steps");
  const currentIndex = SETUP_STEPS.indexOf(currentStep);

  return (
    <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {SETUP_STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <li key={step} className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                isActive && "border-primary bg-primary/10 text-primary",
                isComplete && "border-primary/40 bg-primary/5 text-primary",
                !isActive && !isComplete && "border-border text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px]",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && "bg-primary/20 text-primary",
                  !isActive && !isComplete && "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="hidden sm:inline">{t(step)}</span>
            </div>
            {index < SETUP_STEPS.length - 1 ? (
              <span className="hidden h-px w-4 bg-border sm:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
