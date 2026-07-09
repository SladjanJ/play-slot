import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { isAppLocale, LOCALE_COOKIE } from "@/lib/locale";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const locale = request.cookies.get(LOCALE_COOKIE)?.value;

    if (!isAppLocale(locale)) {
      return updateSession(request, NextResponse.next({ request }));
    }
  }

  const i18nResponse = handleI18nRouting(request);
  return updateSession(request, i18nResponse);
}

export const config = {
  matcher: [
    "/",
    "/(sr|en)/:path*",
    "/search/:path*",
    "/search",
    "/host/:path*",
    "/venues/:path*",
    "/bookings/:path*",
    "/notifications/:path*",
    "/notifications",
    "/auth/callback",
  ],
};
