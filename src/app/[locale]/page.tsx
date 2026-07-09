import { setRequestLocale } from "next-intl/server";

import { LandingHero } from "@/components/landing/hero";
import { getAuthUser, getUserProfile } from "@/lib/auth/session";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getAuthUser();
  const profile = user ? await getUserProfile() : null;

  return (
    <LandingHero
      isAuthenticated={Boolean(user?.email_confirmed_at)}
      userName={profile?.first_name ?? undefined}
    />
  );
}
