import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("countries")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    countries: count ?? 0,
  });
}
