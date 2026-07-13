import type { SupabaseClient } from "@supabase/supabase-js";

import { isVerifyEmailPage, sanitizeNextPath } from "@/lib/auth/routes";
import type { Database } from "@/types/database";

export function isVerifyEmailNextPath(next: string): boolean {
  return isVerifyEmailPage(next);
}

export async function resolvePostAuthPath(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: string | undefined | null,
  next: string | null | undefined,
): Promise<string> {
  const safeNext = sanitizeNextPath(next);

  if (safeNext && !isVerifyEmailNextPath(safeNext)) {
    return safeNext;
  }

  if (role === "host") {
    const { data: venue } = await supabase
      .from("venues")
      .select("status")
      .eq("host_id", userId)
      .maybeSingle();

    if (venue?.status === "published") {
      return "/host/dashboard";
    }

    return "/host/setup";
  }

  return "/search";
}
