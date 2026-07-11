import { NextResponse } from "next/server";

import { runBookingMaintenance } from "@/lib/booking/maintenance";
import { verifyCronRequest } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

function cronResponse(
  body: Record<string, unknown>,
  status: number,
  retryAfterSec?: number,
) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };

  if (retryAfterSec !== undefined) {
    headers["Retry-After"] = String(retryAfterSec);
  }

  return NextResponse.json(body, { status, headers });
}

export async function POST(request: Request) {
  const auth = verifyCronRequest(request);

  if (!auth.ok) {
    if (auth.status === 503) {
      return cronResponse(
        { ok: false, error: "CRON_SECRET is not configured" },
        503,
      );
    }

    if (auth.status === 429) {
      return cronResponse(
        { ok: false, error: "Too many requests" },
        429,
        auth.retryAfterSec,
      );
    }

    return cronResponse({ ok: false, error: "Not found" }, 404);
  }

  const result = await runBookingMaintenance();

  if (!result.ok) {
    return cronResponse(result, 500);
  }

  return cronResponse(result, 200);
}
