import Image from "next/image";
import type { BlockRenderProps } from "../types";
import { CtaLink, headingId } from "../ui";

export function Hero({ id, props, ctx }: BlockRenderProps<"hero">) {
  const center = props.align === "center";
  const hasMedia = Boolean(props.media);
  return (
    <section
      id={id}
      data-block-id={id}
      aria-labelledby={headingId(id)}
      className="px-5 pt-14 pb-12 @3xl:px-8 @3xl:pt-24 @3xl:pb-20"
    >
      <div
        className={`mx-auto grid w-full max-w-6xl items-center gap-10 ${
          hasMedia && !center ? "@4xl:grid-cols-[1.05fr_1fr] @4xl:gap-14" : ""
        }`}
      >
        <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
          {props.eyebrow ? (
            <p className="mb-4 text-sm font-semibold tracking-wide text-pb-accent uppercase">{props.eyebrow}</p>
          ) : null}
          <h1
            id={headingId(id)}
            className="font-heading text-4xl leading-[1.08] font-semibold tracking-tight text-balance @xl:text-5xl @5xl:text-6xl"
          >
            {props.headline}
          </h1>
          {props.subheadline ? (
            <p className="mt-5 text-lg leading-relaxed text-pb-muted text-pretty @3xl:text-xl">{props.subheadline}</p>
          ) : null}
          <div className={`mt-8 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
            <CtaLink cta={props.primaryCta} size="lg" />
            {props.secondaryCta ? <CtaLink cta={props.secondaryCta} variant="secondary" size="lg" /> : null}
          </div>
        </div>
        {props.media ? (
          <div className={center ? "mx-auto w-full max-w-4xl" : ""}>
            <Image
              src={props.media.src}
              alt={props.media.alt}
              width={props.media.width}
              height={props.media.height}
              sizes="(min-width: 1200px) 560px, (min-width: 768px) 50vw, 100vw"
              className="h-auto w-full rounded-pb border border-pb-border bg-pb-surface"
              // The hero image is usually the LCP element when it is the first block.
              fetchPriority={ctx.index === 0 ? "high" : "auto"}
              loading={ctx.index === 0 ? "eager" : "lazy"}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
