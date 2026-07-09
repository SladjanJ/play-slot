"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  checkVerificationAction,
  resendVerificationAction,
} from "@/app/actions/auth";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

type VerifyEmailPanelProps = {
  locale: string;
  email?: string;
};

export function VerifyEmailPanel({ locale, email }: VerifyEmailPanelProps) {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();

  function handleRefresh() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await checkVerificationAction(locale);
      if (result?.verified === false) {
        setError(t("emailNotVerifiedYet"));
      }
    });
  }

  function handleResend() {
    if (!email) return;
    setError(null);
    setSuccess(null);
    startResendTransition(async () => {
      const result = await resendVerificationAction(locale, email);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
      }
    });
  }

  return (
    <AuthFormCard
      title={t("verifyEmailTitle")}
      description={t("verifyEmailDescription")}
    >
      <div className="space-y-6 text-center">
        {email ? (
          <p className="text-sm text-muted-foreground">
            {t("verifyEmailSentTo", { email })}
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">{t("verifyEmailHint")}</p>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="text-sm text-primary" role="status">
            {success}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="h-10 w-full"
            onClick={handleRefresh}
            disabled={isPending}
          >
            {isPending ? t("submitting") : t("verifyEmailRefresh")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            onClick={handleResend}
            disabled={isResending || !email}
          >
            {isResending ? t("submitting") : t("verifyEmailResend")}
          </Button>
          <LogoutButton locale={locale} variant="ghost" className="h-10 w-full" />
        </div>
      </div>
    </AuthFormCard>
  );
}
