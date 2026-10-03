import type { BlockRenderProps } from "../types";
import { CtaLink, Section, headingId } from "../ui";

export function CtaBand({ id, props }: BlockRenderProps<"cta">) {
  return (
    <Section id={id} labelledBy={headingId(id)}>
      <div className="rounded-pb border border-pb-border bg-pb-surface px-6 py-12 text-center @3xl:px-12">
        <h2
          id={headingId(id)}
          className="mx-auto max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance @3xl:text-4xl"
        >
          {props.headline}
        </h2>
        {props.text ? (
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-pb-muted text-pretty">{props.text}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaLink cta={props.cta} size="lg" />
          {props.secondaryCta ? <CtaLink cta={props.secondaryCta} variant="secondary" size="lg" /> : null}
        </div>
      </div>
    </Section>
  );
}
