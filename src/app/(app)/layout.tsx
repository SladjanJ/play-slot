import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWrapper } from "@/components/layout/site-header-wrapper";
import { isAppLocale } from "@/lib/locale";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : "sr";
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="landing-page flex min-h-full flex-col">
        <SiteHeaderWrapper />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
