import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorParam) {
    const locale = next.split("/")[1] === "en" ? "en" : "sr";
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=auth_callback`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = next.startsWith("/") ? next : `/${next}`;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/sr/login?error=auth_callback`);
}
