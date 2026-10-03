import { Icon } from "@/components/Icon";
import type { BlockRenderProps } from "../types";
import { CtaLink, Section, SectionHeading, headingId } from "../ui";

const COLS: Record<number, string> = {
  1: "max-w-md mx-auto",
  2: "@3xl:grid-cols-2 max-w-4xl mx-auto",
  3: "@3xl:grid-cols-3",
  4: "@3xl:grid-cols-2 @5xl:grid-cols-4",
};

export function Pricing({ id, props }: BlockRenderProps<"pricing">) {
  return (
    <Section id={id} labelledBy={headingId(id)}>
      <SectionHeading id={headingId(id)} intro={props.intro} center>
        {props.heading}
      </SectionHeading>
      <ul className={`grid gap-4 ${COLS[props.plans.length]}`}>
        {props.plans.map((plan, i) => (
          <li
            key={i}
            className={`relative flex flex-col rounded-pb border bg-pb-surface p-6 ${
              plan.highlight ? "border-pb-accent ring-1 ring-pb-accent" : "border-pb-border"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
              {plan.badge ? (
                <span className="rounded-full bg-pb-accent px-2.5 py-0.5 text-xs font-semibold text-pb-accent-fg">
                  {plan.badge}
                </span>
              ) : null}
            </div>
            {plan.description ? <p className="mt-2 text-sm leading-relaxed text-pb-muted">{plan.description}</p> : null}
            <p className="mt-5 flex items-baseline gap-1">
              <span className="font-heading text-4xl font-semibold tracking-tight">{plan.price}</span>
              {plan.period ? <span className="text-pb-muted">{plan.period}</span> : null}
            </p>
            {plan.features.length ? (
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex gap-2.5">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-pb-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1" />
            )}
            <div className="mt-8 [&>a]:w-full">
              <CtaLink cta={plan.cta} variant={plan.highlight ? "primary" : "secondary"} />
            </div>
          </li>
        ))}
      </ul>
      {props.note ? <p className="mt-6 text-center text-sm text-pb-muted">{props.note}</p> : null}
    </Section>
  );
}
