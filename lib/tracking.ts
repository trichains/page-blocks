/**
 * Tiny conversion tracking helper. Sends `{ name, props, path, ts }` to
 * NEXT_PUBLIC_ANALYTICS_ENDPOINT, or to the built-in /api/events sink.
 * Uses sendBeacon so clicks that navigate away still get recorded.
 */
export type TrackProps = Record<string, string | number | boolean | null | undefined>;

export const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || "/api/events";

export function track(name: string, props: TrackProps = {}): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ name, props, path: window.location.pathname, ts: Date.now() });
  try {
    if (navigator.sendBeacon?.(ANALYTICS_ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    body,
    keepalive: true,
    headers: { "content-type": "application/json" },
  }).catch(() => undefined);
}
