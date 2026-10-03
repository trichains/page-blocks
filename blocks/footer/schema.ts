import { z } from "zod";
import { defineBlock } from "../define";
import { hrefSchema, line } from "../shared";

export const footerBlock = defineBlock({
  type: "footer",
  meta: {
    label: "Footer",
    description: "Brand, short text, links and legal line.",
    icon: "footer",
    category: "layout",
    interactive: false,
  },
  props: z.strictObject({
    brand: line(60, "Brand"),
    text: z.string().trim().max(200).optional().meta({ label: "Text" }),
    links: z
      .array(z.strictObject({ label: line(40, "Label"), href: hrefSchema.meta({ label: "Link" }) }))
      .max(8)
      .default([])
      .meta({ label: "Links", itemLabel: "Link" }),
    legal: z.string().trim().max(200).optional().meta({ label: "Legal line" }),
  }),
  example: {
    brand: "Your brand",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Contact", href: "mailto:hello@example.com" },
    ],
    legal: "© 2026 Your brand",
  },
});
