import { z } from "zod";
import { defineBlock } from "../define";

export const richTextBlock = defineBlock({
  type: "richText",
  meta: {
    label: "Rich text",
    description: "Markdown subset: headings, bold, italic, links, lists, inline code. No raw HTML.",
    icon: "text",
    category: "content",
    interactive: false,
  },
  props: z.strictObject({
    heading: z.string().trim().max(120).optional().meta({ label: "Heading" }),
    markdown: z.string().trim().min(1, "Text is required").max(6000).meta({
      label: "Text (markdown)",
      multiline: true,
      description: "## heading, **bold**, *italic*, [link](https://...), - list, 1. list, `code`",
    }),
    width: z.enum(["narrow", "normal"]).default("narrow").meta({ label: "Width" }),
  }),
  example: {
    heading: "About this offer",
    markdown: "Write **plain, specific** copy.\n\n- One idea per bullet\n- Link to [details](https://example.com) when needed",
    width: "narrow",
  },
});
