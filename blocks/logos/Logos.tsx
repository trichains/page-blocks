import Image from "next/image";
import type { BlockRenderProps } from "../types";
import { Section } from "../ui";

export function Logos({ id, props }: BlockRenderProps<"logos">) {
  return (
    <Section id={id} className="!py-10">
      {props.heading ? <p className="mb-6 text-center text-sm text-pb-muted">{props.heading}</p> : null}
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
        {props.items.map((item, i) => (
          <li key={i} className="text-pb-muted">
            {item.logo ? (
              <Image
                src={item.logo.src}
                alt={item.logo.alt || item.name}
                width={item.logo.width}
                height={item.logo.height}
                sizes="160px"
                className="h-8 w-auto opacity-80"
              />
            ) : (
              <span className="font-heading text-lg font-semibold tracking-tight">{item.name}</span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
