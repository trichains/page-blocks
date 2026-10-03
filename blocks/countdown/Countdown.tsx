"use client";

import { useEffect, useState } from "react";
import { countdownCookieName, readFirstSeen, resolveDeadline, timeLeft, type TimeLeft } from "@/lib/countdown";
import { t } from "@/lib/i18n";
import type { BlockRenderProps } from "../types";
import { CtaLink, Section } from "../ui";

type Tick = { deadline: number | null; left: TimeLeft | null };

/**
 * Fixed mode counts down to `deadline`. Evergreen mode counts down `hours` from the
 * visitor's first view, stored in a first-party cookie (the page stays static; the
 * timer is computed in the browser). The block always says which mode it is in.
 */
export function Countdown({ id, props, ctx }: BlockRenderProps<"countdown">) {
  const [tick, setTick] = useState<Tick | null>(null);

  useEffect(() => {
    const now = Date.now();
    let firstSeen = now;
    if (props.mode === "evergreen" && ctx.mode === "live") {
      const name = countdownCookieName(ctx.pageSlug, id);
      const stored = readFirstSeen(document.cookie, name, now);
      if (stored) firstSeen = stored;
      else document.cookie = `${name}=${now}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
    }
    const deadline =
      props.mode === "fixed"
        ? resolveDeadline({ mode: "fixed", deadline: props.deadline }, now)
        : resolveDeadline({ mode: "evergreen", hours: props.hours }, firstSeen);
    const update = () => setTick({ deadline, left: deadline === null ? null : timeLeft(deadline, Date.now()) });
    const raf = requestAnimationFrame(update);
    const interval = window.setInterval(update, 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [props.mode, props.deadline, props.hours, ctx.mode, ctx.pageSlug, id]);

  const left = tick?.left;
  const expired = left?.expired ?? false;
  const units: [number | undefined, string][] = [
    [left?.days, t(ctx.locale, "days")],
    [left?.hours, t(ctx.locale, "hours")],
    [left?.minutes, t(ctx.locale, "minutes")],
    [left?.seconds, t(ctx.locale, "seconds")],
  ];

  const note =
    props.mode === "evergreen"
      ? t(ctx.locale, "evergreenNote", { hours: props.hours ?? 0 })
      : tick?.deadline
        ? t(ctx.locale, "fixedNote", {
            date: new Intl.DateTimeFormat(ctx.locale, { dateStyle: "long", timeStyle: "short" }).format(tick.deadline),
          })
        : " ";

  return (
    <Section id={id} className="!py-10" innerClassName="max-w-3xl">
      <div className="rounded-pb border border-pb-border bg-pb-surface px-6 py-8 text-center">
        <p className="font-heading text-lg font-semibold">{expired ? props.expiredText : props.label}</p>
        {!expired ? (
          <div
            role="timer"
            aria-live="off"
            aria-label={props.label}
            className="mt-5 flex justify-center gap-3 @xl:gap-5"
          >
            {units.map(([value, unit]) => (
              <div key={unit} className="w-16 @xl:w-20">
                <span className="block font-heading text-3xl font-semibold tabular-nums @xl:text-4xl">
                  {value === undefined ? "--" : String(value).padStart(2, "0")}
                </span>
                <span className="mt-1 block text-xs tracking-wide text-pb-muted uppercase">{unit}</span>
              </div>
            ))}
          </div>
        ) : null}
        {props.cta && !expired ? (
          <div className="mt-6">
            <CtaLink cta={props.cta} />
          </div>
        ) : null}
        <p className="mt-5 text-xs text-pb-muted">{note}</p>
      </div>
    </Section>
  );
}
