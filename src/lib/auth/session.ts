import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  role: string;
};

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", user.id)
    .single();

  return profile;
}

export function postAuthPath(role: string | undefined, locale?: string): string {
  if (role === "host") return "/host/setup";
  if (locale === "sr" || locale === "en") return `/${locale}`;
  return "/search";
}
