"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { signInAction, type AuthActionState } from "@/app/actions/auth";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { FieldError } from "@/components/auth/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

type LoginFormProps = {
  locale: string;
  next?: string;
  callbackError?: boolean;
};

const initialState: AuthActionState = {};

export function LoginForm({ locale, next, callbackError }: LoginFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    signInAction.bind(null, locale),
    initialState,
  );

  return (
    <AuthFormCard
      title={t("loginTitle")}
      description={t("loginDescription")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t("registerLink")}
          </Link>
        </>
      }
    >
      <form action={formAction} noValidate className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <FieldError message={state.fieldErrors?.password} />
        </div>

        {callbackError ? (
          <p className="text-sm text-destructive" role="alert">
            {t("authCallbackError")}
          </p>
        ) : null}

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? t("submitting") : t("loginSubmit")}
        </Button>
      </form>
    </AuthFormCard>
  );
}
