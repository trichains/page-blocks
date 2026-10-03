import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows up to the limit within a window, then blocks", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const now = 1_000_000;
    expect(limiter.check("1.1.1.1", now)).toMatchObject({ ok: true, remaining: 2 });
    expect(limiter.check("1.1.1.1", now + 1)).toMatchObject({ ok: true, remaining: 1 });
    expect(limiter.check("1.1.1.1", now + 2)).toMatchObject({ ok: true, remaining: 0 });
    const blocked = limiter.check("1.1.1.1", now + 10_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBe(50_000);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("a", 1).ok).toBe(false);
    expect(limiter.check("b", 1).ok).toBe(true);
  });

  it("resets after the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("a", 999).ok).toBe(false);
    expect(limiter.check("a", 1000).ok).toBe(true);
  });

  it("prunes expired keys when the map is full", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 5000);
    expect(limiter.size).toBe(1);
  });

  it("reads the client ip from proxy headers", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
