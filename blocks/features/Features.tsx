import { Icon } from "@/components/Icon";
import type { BlockRenderProps } from "../types";
import { Section, SectionHeading, headingId } from "../ui";

const COLS: Record<number, string> = {
  2: "@3xl:grid-cols-2",
  3: "@3xl:grid-cols-2 @5xl:grid-cols-3",
  4: "@3xl:grid-cols-2 @5xl:grid-cols-4",
};

export function Features({ id, props }: BlockRenderProps<"features">) {
  return (
    <Section id={id} labelledBy={headingId(id)}>
      <SectionHeading id={headingId(id)} intro={props.intro}>
        {props.heading}
      </SectionHeading>
      <ul className={`grid gap-4 ${COLS[props.columns] ?? COLS[3]}`}>
        {props.items.map((item, i) => (
          <li key={i} className="rounded-pb border border-pb-border bg-pb-surface p-6">
            <span className="mb-4 inline-flex size-10 items-center justify-center rounded-pb bg-pb-bg text-pb-accent">
              <Icon name={item.icon} className="size-5" />
            </span>
            <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 leading-relaxed text-pb-muted">{item.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
