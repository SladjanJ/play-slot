import { setRequestLocale } from "next-intl/server";

import { LoginForm } from "@/components/auth/login-form";
import { sanitizeNextPath } from "@/lib/auth/routes";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { next, error } = await searchParams;
  setRequestLocale(locale);

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <LoginForm
          locale={locale}
          next={sanitizeNextPath(next) ?? undefined}
          callbackError={error === "auth_callback"}
        />
      </div>
    </section>
  );
}
