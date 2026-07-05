import { cookies } from "next/headers";

import { LanguageGate } from "@/components/layout/language-gate";
import { isAppLocale } from "@/lib/locale";
import { redirect } from "@/i18n/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value;

  if (isAppLocale(locale)) {
    redirect({ href: "/", locale });
  }

  return <LanguageGate />;
}
