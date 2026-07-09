import { getTranslations } from "next-intl/server";

export default async function SearchPage() {
  const t = await getTranslations("app");

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-border/60 bg-card/75 p-8 text-center shadow-lg backdrop-blur-md sm:p-10">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          {t("searchTitle")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("searchDescription")}</p>
      </div>
    </section>
  );
}
