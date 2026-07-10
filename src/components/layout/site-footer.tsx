"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { isAppRoute } from "@/lib/auth/routes";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { setLocaleCookie, type AppLocale } from "@/lib/locale";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tLanguage = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const year = new Date().getFullYear();
  const onAppRoute = isAppRoute(pathname);

  function handleLocaleChange(nextLocale: AppLocale) {
    setLocaleCookie(nextLocale);
    if (onAppRoute) {
      router.refresh();
    }
  }

  return (
    <footer className="border-t border-border/60 bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
        <p className="text-sm text-muted-foreground">
          {t("copyright", { year })}
        </p>

        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1">
          {(["sr", "en"] as const).map((value) =>
            onAppRoute ? (
              <button
                key={value}
                type="button"
                onClick={() => handleLocaleChange(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  locale === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "sr" ? tLanguage("sr") : tLanguage("en")}
              </button>
            ) : (
              <Link
                key={value}
                href={pathname}
                locale={value}
                onClick={() => handleLocaleChange(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  locale === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "sr" ? tLanguage("sr") : tLanguage("en")}
              </Link>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}
