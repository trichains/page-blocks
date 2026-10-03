import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { log } from "@/lib/server/log";

/**
 * Sandbox analytics sink for `track()`. Keeps the last 200 events in memory and logs
 * each one as JSON. In production point NEXT_PUBLIC_ANALYTICS_ENDPOINT at your own
 * collector and this route is no longer called.
 */
const eventSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{1,47}$/),
  props: z.record(z.string().max(40), z.union([z.string().max(300), z.number(), z.boolean(), z.null()])).default({}),
  path: z.string().max(300).optional(),
  ts: z.number().int().optional(),
});
type StoredEvent = z.infer<typeof eventSchema> & { receivedAt: string };

const events = ((globalThis as { __pbEvents?: StoredEvent[] }).__pbEvents ??= []);
const limiter = createRateLimiter({ limit: 120, windowMs: 60_000 });

export async function POST(request: Request) {
  if (!limiter.check(clientIp(request.headers)).ok) return new NextResponse(null, { status: 429 });
  let body: unknown;
  try {
    // sendBeacon may send text/plain; parse the raw body either way.
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 422 });

  const event: StoredEvent = { ...parsed.data, receivedAt: new Date().toISOString() };
  events.unshift(event);
  if (events.length > 200) events.length = 200;
  log("info", "track", { name: event.name, path: event.path, props: event.props });
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return NextResponse.json({
    sandbox: true,
    note: "Demo endpoint. Last 200 tracked events, kept in server memory and reset on cold start.",
    events,
  });
}
