import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type PlaceholderPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: PlaceholderPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("placeholder");
  const tCommon = await getTranslations("common");

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card/75 p-8 text-center shadow-lg backdrop-blur-md sm:p-10">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          {t("loginTitle")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("loginDescription")}</p>
        <Button render={<Link href="/" />} className="mt-8" variant="outline">
          {tCommon("backToHome")}
        </Button>
      </div>
    </section>
  );
}
