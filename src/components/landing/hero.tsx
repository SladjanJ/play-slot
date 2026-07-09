import { useTranslations } from "next-intl";

import { PlaySlotLogo } from "@/components/layout/playslot-logo";
import { ButtonLink } from "@/components/ui/button-link";

type LandingHeroProps = {
  isAuthenticated?: boolean;
  userName?: string;
};

export function LandingHero({ isAuthenticated, userName }: LandingHeroProps) {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <section className="relative flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="landing-glow pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-3xl rounded-3xl border border-border/60 bg-card/75 p-8 shadow-xl shadow-primary/10 backdrop-blur-md sm:p-12">
        <div className="mb-8 flex justify-center md:hidden">
          <PlaySlotLogo size={72} />
        </div>

        <div className="space-y-6 text-center">
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t("title")}
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>

          {isAuthenticated ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-2">
              {userName ? (
                <p className="text-base text-muted-foreground">
                  {t("welcomeBack", { name: userName })}
                </p>
              ) : null}
              <ButtonLink
                href="/search"
                size="lg"
                className="h-11 min-w-[180px] px-6 text-base"
              >
                {t("goToSearch")}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <ButtonLink
                href="/register"
                size="lg"
                className="h-11 min-w-[180px] px-6 text-base"
              >
                {t("register")}
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="outline"
                size="lg"
                className="h-11 min-w-[180px] px-6 text-base"
              >
                {t("login")}
              </ButtonLink>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground sm:hidden">
          {tCommon("appName")}
        </p>
      </div>
    </section>
  );
}
