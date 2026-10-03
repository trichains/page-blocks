import { Markdown } from "@/components/Markdown";
import type { BlockRenderProps } from "../types";
import { Section, SectionHeading, headingId } from "../ui";

export function RichText({ id, props }: BlockRenderProps<"richText">) {
  return (
    <Section
      id={id}
      labelledBy={props.heading ? headingId(id) : undefined}
      innerClassName={props.width === "narrow" ? "max-w-2xl" : "max-w-4xl"}
    >
      {props.heading ? <SectionHeading id={headingId(id)}>{props.heading}</SectionHeading> : null}
      <Markdown source={props.markdown} />
    </Section>
  );
}
