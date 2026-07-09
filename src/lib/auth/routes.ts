import type { AppLocale } from "@/lib/locale";

const AUTH_PAGES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
] as const;
const PLAYER_PREFIXES = ["/search", "/venues", "/bookings", "/notifications"] as const;

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname.endsWith(page));
}

export function isVerifyEmailPage(pathname: string): boolean {
  return pathname.endsWith("/verify-email");
}

export function isResetPasswordPage(pathname: string): boolean {
  return pathname.endsWith("/reset-password");
}

export function isHostPath(pathname: string): boolean {
  return pathname === "/host" || pathname.startsWith("/host/");
}

export function isHostSetupPath(pathname: string): boolean {
  return pathname.startsWith("/host/setup");
}

export function isPlayerPath(pathname: string): boolean {
  return PLAYER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProtectedPath(pathname: string): boolean {
  return isPlayerPath(pathname) || isHostPath(pathname);
}

/** App routes live outside `/[locale]` and must not get a locale prefix. */
export function isAppRoute(pathname: string): boolean {
  return isProtectedPath(pathname);
}

/** `/en/host/setup` → `/host/setup` when locale was wrongly prefixed. */
export function stripLocalePrefixedAppRoute(pathname: string): string | null {
  const match = pathname.match(/^\/(sr|en)(\/.*)$/);
  if (!match) return null;

  const stripped = match[2];
  return isAppRoute(stripped) ? stripped : null;
}

export function loginPath(locale: AppLocale): string {
  return `/${locale}/login`;
}

export function verifyEmailPath(locale: AppLocale): string {
  return `/${locale}/verify-email`;
}

/** Allow only same-origin relative app paths (open redirect guard). */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  if (next.includes("://") || next.includes("\\")) {
    return null;
  }

  return next;
}
