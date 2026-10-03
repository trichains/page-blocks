/**
 * Fixed-window rate limiter kept in process memory.
 *
 * Good enough for a demo and for a single long-lived server. On serverless platforms
 * each instance has its own map and it resets on cold start, so treat it as a speed
 * bump, not a guarantee. For production traffic use a shared store (Redis/Upstash, KV).
 */
export type RateLimitResult = { ok: boolean; remaining: number; retryAfterMs: number };

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function prune(now: number) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        if (hits.size >= maxKeys) prune(now);
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      if (entry.count >= limit) {
        return { ok: false, remaining: 0, retryAfterMs: entry.resetAt - now };
      }
      entry.count++;
      return { ok: true, remaining: limit - entry.count, retryAfterMs: 0 };
    },
    reset() {
      hits.clear();
    },
    get size() {
      return hits.size;
    },
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
