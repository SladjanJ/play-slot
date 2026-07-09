"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";

import { sanitizeNextPath } from "@/lib/auth/routes";
import {
  type AuthErrorKey,
  forgotPasswordSchema,
  loginSchema,
  mapSupabaseAuthError,
  registerSchema,
  resetPasswordSchema,
  zodIssuesToFieldErrors,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { redirect as i18nRedirect } from "@/i18n/navigation";

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

async function getRequestOrigin() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function authCallbackUrl(origin: string, locale: string, nextPath: string) {
  return `${origin}/auth/callback?next=/${locale}${nextPath.startsWith("/") ? nextPath : `/${nextPath}`}`;
}

async function translateError(locale: string, key: AuthErrorKey) {
  const t = await getTranslations({ locale, namespace: "auth.errors" });
  return t(key);
}

async function translateFieldErrors(
  locale: string,
  fieldErrors: Partial<Record<string, AuthErrorKey>>,
) {
  const t = await getTranslations({ locale, namespace: "auth.errors" });
  const translated: Record<string, string> = {};

  for (const [field, key] of Object.entries(fieldErrors)) {
    if (!key) continue;
    translated[field] = t(key);
  }

  return translated;
}

function parseRegisterForm(formData: FormData) {
  const role = formData.get("role");

  if (role === "host") {
    return {
      role: "host" as const,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      cityId: String(formData.get("cityId") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
    };
  }

  return {
    role: "player" as const,
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? "") || undefined,
  };
}

function redirectAfterAuth(
  locale: string,
  role: string | undefined,
  next: string | null,
) {
  const safeNext = sanitizeNextPath(next);

  if (safeNext) {
    nextRedirect(safeNext);
  }

  if (role === "host") {
    nextRedirect("/host/setup");
  }

  i18nRedirect({ href: "/", locale });
}

export async function signUpAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(parseRegisterForm(formData));

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToFieldErrors(parsed.error.issues),
      ),
    };
  }

  const data = parsed.data;
  const origin = await getRequestOrigin();
  const supabase = await createClient();

  const metadata =
    data.role === "player"
      ? {
          role: data.role,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone ?? null,
        }
      : {
          role: data.role,
          first_name: data.firstName,
          company_name: data.companyName,
          city_id: data.cityId,
          timezone: data.timezone,
        };

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: authCallbackUrl(origin, locale, "/verify-email"),
      data: metadata,
    },
  });

  if (error) {
    return { error: await translateError(locale, mapSupabaseAuthError(error.message)) };
  }

  if (signUpData.user) {
    nextRedirect(
      `/${locale}/verify-email?email=${encodeURIComponent(data.email)}`,
    );
  }

  return { error: await translateError(locale, "generic") };
}

export async function signInAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToFieldErrors(parsed.error.issues),
      ),
    };
  }

  const next = sanitizeNextPath(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const key =
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("credentials")
        ? "invalidCredentials"
        : mapSupabaseAuthError(error.message);
    return { error: await translateError(locale, key) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email_confirmed_at) {
    i18nRedirect({ href: "/verify-email", locale });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  redirectAfterAuth(locale, profile?.role, next);
  return { error: await translateError(locale, "generic") };
}

export async function signOutAction(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  i18nRedirect({ href: "/", locale });
}

export async function forgotPasswordAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToFieldErrors(parsed.error.issues),
      ),
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: authCallbackUrl(origin, locale, "/reset-password"),
    },
  );

  if (error) {
    return { error: await translateError(locale, mapSupabaseAuthError(error.message)) };
  }

  const t = await getTranslations({ locale, namespace: "auth" });
  return { success: t("forgotPasswordSuccess") };
}

export async function updatePasswordAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return {
      fieldErrors: await translateFieldErrors(
        locale,
        zodIssuesToFieldErrors(parsed.error.issues),
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: await translateError(locale, "notAuthenticated") };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: await translateError(locale, mapSupabaseAuthError(error.message)) };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");

  const t = await getTranslations({ locale, namespace: "auth" });
  return { success: t("resetPasswordSuccess") };
}

export async function resendVerificationAction(
  locale: string,
  email: string,
): Promise<AuthActionState> {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return { error: await translateError(locale, "notAuthenticated") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    return { error: await translateError(locale, "generic") };
  }

  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user?.email ?? normalizedEmail,
    options: {
      emailRedirectTo: authCallbackUrl(origin, locale, "/verify-email"),
    },
  });

  if (error) {
    const key = mapSupabaseAuthError(error.message);
    return {
      error: await translateError(
        locale,
        key === "rateLimit" ? "rateLimit" : "resendFailed",
      ),
    };
  }

  const t = await getTranslations({ locale, namespace: "auth" });
  return { success: t("verifyEmailResent") };
}

export async function checkVerificationAction(locale: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    i18nRedirect({ href: "/login", locale });
    return { verified: false as const };
  }

  if (!user.email_confirmed_at) {
    return { verified: false as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirectAfterAuth(locale, profile?.role, null);
  return { verified: false as const };
}
