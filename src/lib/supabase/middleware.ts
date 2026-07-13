import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { resolvePostAuthPath } from "@/lib/auth/redirect";
import {
  isAuthPage,
  isHostPath,
  isHostSetupPath,
  isPlayerPath,
  isProtectedPath,
  isResetPasswordPage,
  isVerifyEmailPage,
  loginPath,
  verifyEmailPath,
} from "@/lib/auth/routes";
import { isAppLocale, LOCALE_COOKIE, type AppLocale } from "@/lib/locale";
import type { Database } from "@/types/database";

function resolveLocale(request: NextRequest): AppLocale {
  const segment = request.nextUrl.pathname.split("/")[1];
  if (isAppLocale(segment)) return segment;

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isAppLocale(cookie)) return cookie;

  return "sr";
}

export async function updateSession(
  request: NextRequest,
  response?: NextResponse,
) {
  let supabaseResponse = response ?? NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const locale = resolveLocale(request);

  if (pathname === "/auth/callback" || pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  if (!user) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath(locale);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const emailVerified = Boolean(user.email_confirmed_at);
  const onAuthPage = isAuthPage(pathname);
  const onVerifyEmail = isVerifyEmailPage(pathname);
  const onResetPassword = isResetPasswordPage(pathname);

  if (!emailVerified) {
    if (!onVerifyEmail && !onAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = verifyEmailPath(locale);
      if (user.email) {
        url.searchParams.set("email", user.email);
      }
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (onVerifyEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const destination = await resolvePostAuthPath(
      supabase,
      user.id,
      profile?.role,
      null,
    );

    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (onAuthPage && !onResetPassword) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const destination = await resolvePostAuthPath(
      supabase,
      user.id,
      profile?.role,
      null,
    );

    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (role === "host") {
    if (isPlayerPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/host/setup";
      return NextResponse.redirect(url);
    }

    if (isHostPath(pathname) && !isHostSetupPath(pathname)) {
      const { data: venue } = await supabase
        .from("venues")
        .select("status")
        .eq("host_id", user.id)
        .maybeSingle();

      if (!venue || venue.status !== "published") {
        const url = request.nextUrl.clone();
        url.pathname = "/host/setup";
        return NextResponse.redirect(url);
      }
    }
  }

  if (role === "player" && isHostPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
