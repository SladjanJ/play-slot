import { setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <ResetPasswordForm locale={locale} />
      </div>
    </section>
  );
}
