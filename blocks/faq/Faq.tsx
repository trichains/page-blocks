import type { BlockRenderProps } from "../types";
import { Section, SectionHeading, headingId } from "../ui";

/**
 * Native <details>/<summary>: keyboard and screen-reader support come from the browser,
 * the page ships no JavaScript for it, and content stays in the HTML for search engines.
 */
export function Faq({ id, props }: BlockRenderProps<"faq">) {
  return (
    <Section id={id} labelledBy={headingId(id)} innerClassName="max-w-3xl">
      <SectionHeading id={headingId(id)}>{props.heading}</SectionHeading>
      <div className="divide-y divide-pb-border border-y border-pb-border">
        {props.items.map((item, i) => (
          <details key={i} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-accent [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="text-xl leading-none text-pb-muted transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="pb-5 leading-relaxed whitespace-pre-line text-pb-muted">{item.answer}</div>
          </details>
        ))}
      </div>
    </Section>
  );
}
