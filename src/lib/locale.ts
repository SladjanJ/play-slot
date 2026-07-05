export const LOCALE_COOKIE = "NEXT_LOCALE";

export type AppLocale = "sr" | "en";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "sr" || value === "en";
}

export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === "undefined") {
    return "sr";
  }

  const lang = navigator.language.toLowerCase();

  if (
    lang.startsWith("sr") ||
    lang.startsWith("bs") ||
    lang.startsWith("hr") ||
    lang.startsWith("me")
  ) {
    return "sr";
  }

  return "en";
}

export function setLocaleCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function hasLocaleCookie(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie.includes(`${LOCALE_COOKIE}=`);
}
