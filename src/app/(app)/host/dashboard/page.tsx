import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

export default async function HostDashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations("host.dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sr/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "host") {
    redirect("/sr");
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("company_name, status")
    .eq("host_id", user.id)
    .maybeSingle();

  if (!venue || venue.status !== "published") {
    redirect("/host/setup");
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("welcome", { name: profile.first_name, venue: venue.company_name })}
        </p>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-[24rem] flex-col rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">{t("calendarTitle")}</h2>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {t("comingSoon")}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/50 p-8 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("calendarPlaceholder")}
            </p>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-card/75 p-5 shadow-lg backdrop-blur-md">
            <h2 className="text-base font-medium">{t("todayTitle")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("todayEmpty")}
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/75 p-5 shadow-lg backdrop-blur-md">
            <h2 className="text-base font-medium">{t("pendingTitle")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("pendingEmpty")}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
