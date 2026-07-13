import { NextResponse } from "next/server";

import { isVerifyEmailNextPath, resolvePostAuthPath } from "@/lib/auth/redirect";
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
      const rawDestination = next.startsWith("/") ? next : `/${next}`;

      if (isVerifyEmailNextPath(rawDestination)) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
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

          return NextResponse.redirect(`${origin}${destination}`);
        }
      }

      return NextResponse.redirect(`${origin}${rawDestination}`);
    }
  }

  return NextResponse.redirect(`${origin}/sr/login?error=auth_callback`);
}
