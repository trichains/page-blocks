import type { ReactNode } from "react";
import type { Cta } from "./shared";

/** Shared layout primitives for block renderers. They only read --pb-* theme variables. */

export function Section({
  id,
  children,
  className = "",
  innerClassName = "max-w-6xl",
  labelledBy,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      data-block-id={id}
      aria-labelledby={labelledBy}
      className={`scroll-mt-6 px-5 py-14 @3xl:px-8 @3xl:py-20 ${className}`}
    >
      <div className={`mx-auto w-full ${innerClassName}`}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  children,
  intro,
  center = false,
}: {
  id: string;
  children: ReactNode;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <h2
        id={id}
        className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance @3xl:text-4xl"
      >
        {children}
      </h2>
      {intro ? <p className="mt-3 text-lg leading-relaxed text-pb-muted text-pretty">{intro}</p> : null}
    </div>
  );
}

export function CtaLink({
  cta,
  variant = "primary",
  size = "md",
}: {
  cta: Cta;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-pb font-semibold transition-[background-color,border-color,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-accent";
  const sizes = size === "lg" ? "min-h-12 px-6 text-base" : "min-h-11 px-5 text-sm";
  const variants =
    variant === "primary"
      ? "bg-pb-accent text-pb-accent-fg hover:opacity-90"
      : "border border-pb-border text-pb-fg hover:border-pb-muted";
  const external = /^https?:\/\//i.test(cta.href);
  return (
    <a
      href={cta.href}
      className={`${base} ${sizes} ${variants}`}
      data-track="cta_click"
      data-track-label={cta.label}
      {...(external ? { rel: "noopener" } : {})}
    >
      {cta.label}
    </a>
  );
}

export function headingId(blockId: string) {
  return `${blockId}-title`;
}
