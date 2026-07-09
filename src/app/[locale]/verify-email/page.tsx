import { setRequestLocale } from "next-intl/server";

import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { getAuthUser } from "@/lib/auth/session";

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({
  params,
  searchParams,
}: VerifyEmailPageProps) {
  const { locale } = await params;
  const { email: emailParam } = await searchParams;
  setRequestLocale(locale);

  const user = await getAuthUser();
  const email = user?.email ?? emailParam;

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <VerifyEmailPanel locale={locale} email={email} />
      </div>
    </section>
  );
}
