"use client";

import Image from "next/image";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { track } from "@/lib/tracking";
import { embedUrl, parseVideoUrl } from "@/lib/video";
import type { BlockRenderProps } from "../types";
import { Section, SectionHeading, headingId } from "../ui";

/**
 * Click-to-load player: the page renders a poster image and a real <button>.
 * The third-party iframe (and its ~1 MB of scripts) is only requested after a click.
 */
export function Video({ id, props, ctx }: BlockRenderProps<"video">) {
  const [playing, setPlaying] = useState(false);
  const source = parseVideoUrl(props.url);
  const provider = source?.provider === "vimeo" ? "Vimeo" : "YouTube";

  return (
    <Section id={id} labelledBy={props.heading ? headingId(id) : undefined} innerClassName="max-w-4xl">
      {props.heading ? (
        <SectionHeading id={headingId(id)} center>
          {props.heading}
        </SectionHeading>
      ) : null}
      <div className="relative aspect-video w-full overflow-hidden rounded-pb border border-pb-border bg-pb-surface">
        {playing && source ? (
          <iframe
            src={embedUrl(source)}
            title={props.title}
            className="absolute inset-0 size-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            className="group absolute inset-0 size-full cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-pb-accent"
            aria-label={`${t(ctx.locale, "playVideo")}: ${props.title}`}
            onClick={() => {
              setPlaying(true);
              if (ctx.mode === "live") track("video_play", { block: id, provider: source?.provider ?? "unknown" });
            }}
          >
            <Image
              src={props.poster.src}
              alt={props.poster.alt}
              fill
              sizes="(min-width: 960px) 896px, 100vw"
              className="object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-18 items-center justify-center rounded-full bg-pb-accent text-pb-accent-fg shadow-lg transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor" aria-hidden="true">
                  <path d="M7 4v16l13-8L7 4z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-pb-muted">
        {props.caption ? `${props.caption} ` : ""}
        {t(ctx.locale, "videoLoadsOnClick", { provider })}
      </p>
    </Section>
  );
}
