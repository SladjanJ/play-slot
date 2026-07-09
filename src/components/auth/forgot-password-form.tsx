"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { forgotPasswordAction, type AuthActionState } from "@/app/actions/auth";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { FieldError } from "@/components/auth/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

type ForgotPasswordFormProps = {
  locale: string;
};

const initialState: AuthActionState = {};

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction.bind(null, locale),
    initialState,
  );

  return (
    <AuthFormCard
      title={t("forgotPasswordTitle")}
      description={t("forgotPasswordDescription")}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      }
    >
      <form action={formAction} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="text-sm text-primary" role="status">
            {state.success}
          </p>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? t("submitting") : t("forgotPasswordSubmit")}
        </Button>
      </form>
    </AuthFormCard>
  );
}
