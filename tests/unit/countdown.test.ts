import { describe, expect, it } from "vitest";
import { countdownCookieName, evergreenDeadline, readFirstSeen, resolveDeadline, timeLeft } from "@/lib/countdown";

const HOUR = 3_600_000;
const T0 = Date.parse("2026-10-01T12:00:00Z");

describe("countdown math", () => {
  it("evergreen deadline is first visit + N hours", () => {
    expect(evergreenDeadline(T0, 72)).toBe(T0 + 72 * HOUR);
    expect(resolveDeadline({ mode: "evergreen", hours: 48 }, T0)).toBe(T0 + 48 * HOUR);
  });

  it("returning visitors keep their original deadline", () => {
    const deadline = resolveDeadline({ mode: "evergreen", hours: 72 }, T0)!;
    const twoDaysLater = T0 + 48 * HOUR;
    expect(timeLeft(deadline, twoDaysLater)).toMatchObject({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
    });
  });

  it("splits remaining time into units", () => {
    const left = timeLeft(T0 + (2 * 24 + 3) * HOUR + 4 * 60_000 + 5_000, T0);
    expect(left).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5, expired: false });
  });

  it("clamps to zero and flags expiry", () => {
    expect(timeLeft(T0, T0 + 1000)).toMatchObject({ totalMs: 0, days: 0, seconds: 0, expired: true });
  });

  it("resolves fixed deadlines and ignores invalid ones", () => {
    expect(resolveDeadline({ mode: "fixed", deadline: "2026-11-12T22:00:00Z" }, T0)).toBe(
      Date.parse("2026-11-12T22:00:00Z"),
    );
    expect(resolveDeadline({ mode: "fixed", deadline: "not a date" }, T0)).toBeNull();
    expect(resolveDeadline({ mode: "fixed" }, T0)).toBeNull();
    expect(resolveDeadline({ mode: "evergreen" }, T0)).toBeNull();
  });

  it("reads the first-seen cookie and rejects tampered values", () => {
    const name = countdownCookieName("launch", "launch-timer");
    expect(name).toBe("pb_cd_launch_launch-timer");
    expect(readFirstSeen(`a=1; ${name}=${T0}; b=2`, name, T0 + HOUR)).toBe(T0);
    expect(readFirstSeen(`${name}=${T0 + HOUR}`, name, T0)).toBeNull(); // in the future
    expect(readFirstSeen(`${name}=abc`, name, T0)).toBeNull();
    expect(readFirstSeen("other=1", name, T0)).toBeNull();
    expect(readFirstSeen(`${name}=${T0}`, name, T0 + 400 * 24 * HOUR)).toBeNull(); // too old
  });
});
