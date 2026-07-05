import { setRequestLocale } from "next-intl/server";

import { LandingHero } from "@/components/landing/hero";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingHero />;
}
