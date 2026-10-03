"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking";

type TrackingEvent = { trigger: "view" | "click" | "submit"; selector?: string; name: string };

function closestMatch(target: EventTarget | null, selector: string): Element | null {
  if (!(target instanceof Element)) return null;
  try {
    return target.closest(selector);
  } catch {
    return null; // invalid selector in content: ignore instead of breaking the page
  }
}

/**
 * One delegated listener for the whole page:
 * - any element with `data-track="name"` sends `name` on click (CTAs get this automatically)
 * - events configured in the page document's `tracking.events` (view / click / submit by selector)
 */
export function Tracker({ slug, events = [] }: { slug: string; events?: TrackingEvent[] }) {
  useEffect(() => {
    track("page_view", { page: slug });
    for (const e of events) if (e.trigger === "view") track(e.name, { page: slug });

    const blockOf = (el: Element) => el.closest("[data-block-id]")?.getAttribute("data-block-id") ?? null;

    const onClick = (event: MouseEvent) => {
      const el = closestMatch(event.target, "[data-track]");
      if (el) {
        track(el.getAttribute("data-track")!, {
          page: slug,
          label: el.getAttribute("data-track-label"),
          href: el.getAttribute("href"),
          block: blockOf(el),
        });
      }
      for (const e of events) {
        if (e.trigger !== "click" || !e.selector) continue;
        const match = closestMatch(event.target, e.selector);
        if (match) track(e.name, { page: slug, block: blockOf(match) });
      }
    };
    const onSubmit = (event: SubmitEvent) => {
      for (const e of events) {
        if (e.trigger !== "submit" || !e.selector) continue;
        const match = closestMatch(event.target, e.selector);
        if (match) track(e.name, { page: slug, block: blockOf(match) });
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("submit", onSubmit, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("submit", onSubmit, { capture: true });
    };
  }, [slug, events]);

  return null;
}
