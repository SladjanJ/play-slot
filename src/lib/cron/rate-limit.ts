type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 500;

function pruneBuckets(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function peekRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true };
}

export function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}
