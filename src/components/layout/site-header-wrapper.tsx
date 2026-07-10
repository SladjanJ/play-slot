import { cookies } from "next/headers";

import { getAuthUser, getUserProfile } from "@/lib/auth/session";
import { isAppLocale } from "@/lib/locale";
import { SiteHeader } from "@/components/layout/site-header";

type SiteHeaderWrapperProps = {
  locale?: string;
};

export async function SiteHeaderWrapper({ locale: localeProp }: SiteHeaderWrapperProps) {
  const user = await getAuthUser();
  const profile = user ? await getUserProfile() : null;

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale =
    localeProp ?? (isAppLocale(cookieLocale) ? cookieLocale : "sr");

  return (
    <SiteHeader
      locale={locale}
      user={
        user
          ? {
              firstName:
                profile?.first_name ?? user.email?.split("@")[0] ?? "",
              role: profile?.role,
            }
          : null
      }
    />
  );
}
