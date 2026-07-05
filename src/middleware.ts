import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { isAppLocale, LOCALE_COOKIE } from "@/lib/locale";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const locale = request.cookies.get(LOCALE_COOKIE)?.value;

    if (!isAppLocale(locale)) {
      return NextResponse.next();
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/", "/(sr|en)/:path*"],
};
