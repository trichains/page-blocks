import type { BlockRenderProps } from "../types";
import { Section, SectionHeading, headingId } from "../ui";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function Testimonials({ id, props }: BlockRenderProps<"testimonials">) {
  return (
    <Section id={id} labelledBy={props.heading ? headingId(id) : undefined}>
      {props.heading ? <SectionHeading id={headingId(id)}>{props.heading}</SectionHeading> : null}
      <ul className="grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
        {props.items.map((item, i) => (
          <li key={i}>
            <figure className="flex h-full flex-col justify-between gap-6 rounded-pb border border-pb-border bg-pb-surface p-6">
              <blockquote className="text-pretty leading-relaxed">
                <p>&ldquo;{item.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-pb-bg text-sm font-semibold text-pb-accent"
                >
                  {initials(item.name)}
                </span>
                <span className="text-sm">
                  <span className="block font-semibold">{item.name}</span>
                  {item.role ? <span className="block text-pb-muted">{item.role}</span> : null}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
