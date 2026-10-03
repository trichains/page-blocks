const HOUR = 60 * 60 * 1000;

export type CountdownConfig = { mode: "fixed"; deadline?: string } | { mode: "evergreen"; hours?: number };

export type TimeLeft = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

/** Cookie that stores when this visitor first saw a given evergreen countdown. */
export function countdownCookieName(pageSlug: string, blockId: string): string {
  return `pb_cd_${pageSlug}_${blockId}`.replace(/[^\w-]/g, "_");
}

/** Evergreen deadline: N hours after the visitor's first view. */
export function evergreenDeadline(firstSeenMs: number, hours: number): number {
  return firstSeenMs + hours * HOUR;
}

/**
 * Resolves the deadline (epoch ms) for a countdown. For evergreen mode `firstSeenMs`
 * is the timestamp read from the visitor's cookie (or "now" on the first visit).
 */
export function resolveDeadline(config: CountdownConfig, firstSeenMs: number): number | null {
  if (config.mode === "fixed") {
    if (!config.deadline) return null;
    const t = Date.parse(config.deadline);
    return Number.isNaN(t) ? null : t;
  }
  if (!config.hours) return null;
  return evergreenDeadline(firstSeenMs, config.hours);
}

export function timeLeft(deadlineMs: number, nowMs: number): TimeLeft {
  const totalMs = Math.max(0, deadlineMs - nowMs);
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: totalMs === 0,
  };
}

/**
 * Reads a first-seen timestamp from a cookie string. Rejects values in the future
 * (clock tampering) or older than `maxAgeMs`, returning null so a new one is set.
 */
export function readFirstSeen(
  cookieString: string,
  name: string,
  nowMs: number,
  maxAgeMs = 365 * 24 * HOUR,
): number | null {
  const match = cookieString.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  const value = Number(match.slice(name.length + 1));
  if (!Number.isFinite(value) || value <= 0 || value > nowMs || nowMs - value > maxAgeMs) return null;
  return value;
}
