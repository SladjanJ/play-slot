import { setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <ForgotPasswordForm locale={locale} />
      </div>
    </section>
  );
}
