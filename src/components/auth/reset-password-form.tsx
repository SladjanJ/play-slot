"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { updatePasswordAction, type AuthActionState } from "@/app/actions/auth";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { FieldError } from "@/components/auth/field-error";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

type ResetPasswordFormProps = {
  locale: string;
};

const initialState: AuthActionState = {};

export function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    updatePasswordAction.bind(null, locale),
    initialState,
  );

  if (state.success) {
    return (
      <AuthFormCard title={t("resetPasswordTitle")} description={state.success}>
        <ButtonLink href="/login" className="h-10 w-full">
          {t("loginSubmit")}
        </ButtonLink>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      title={t("resetPasswordTitle")}
      description={t("resetPasswordDescription")}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      }
    >
      <form action={formAction} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("newPassword")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <FieldError message={state.fieldErrors?.password} />
          {!state.fieldErrors?.password ? (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          />
          <FieldError message={state.fieldErrors?.confirmPassword} />
        </div>

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? t("submitting") : t("resetPasswordSubmit")}
        </Button>
      </form>
    </AuthFormCard>
  );
}
