import { timingSafeEqual } from "crypto";

import { consumeRateLimit, peekRateLimit } from "@/lib/cron/rate-limit";

const BEARER_PREFIX = "Bearer ";
const MIN_SECRET_LENGTH = 32;

/** Max successful maintenance calls per IP per hour (15-min cron ≈ 4/h). */
const REQUEST_LIMIT = 8;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;

/** Max failed auth attempts per IP before temporary lockout. */
const FAILED_AUTH_LIMIT = 5;
const FAILED_AUTH_WINDOW_MS = 15 * 60 * 1000;

export type CronAuthFailure = {
  ok: false;
  status: number;
  retryAfterSec?: number;
};

export type CronAuthSuccess = { ok: true };

export type CronAuthResult = CronAuthSuccess | CronAuthFailure;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function safeCompareSecret(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

export function verifyCronRequest(request: Request): CronAuthResult {
  if (request.method !== "POST") {
    return { ok: false, status: 404 };
  }

  const ip = getClientIp(request);
  const failedKey = `cron:fail:${ip}`;

  const failedLockout = peekRateLimit(
    failedKey,
    FAILED_AUTH_LIMIT,
    FAILED_AUTH_WINDOW_MS,
  );

  if (!failedLockout.allowed) {
    return {
      ok: false,
      status: 429,
      retryAfterSec: failedLockout.retryAfterSec,
    };
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < MIN_SECRET_LENGTH) {
    return { ok: false, status: 503 };
  }

  const requestLimit = consumeRateLimit(
    `cron:req:${ip}`,
    REQUEST_LIMIT,
    REQUEST_WINDOW_MS,
  );

  if (!requestLimit.allowed) {
    return {
      ok: false,
      status: 429,
      retryAfterSec: requestLimit.retryAfterSec,
    };
  }

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token || !safeCompareSecret(token, cronSecret)) {
    consumeRateLimit(failedKey, FAILED_AUTH_LIMIT, FAILED_AUTH_WINDOW_MS);
    return { ok: false, status: 404 };
  }

  return { ok: true };
}
