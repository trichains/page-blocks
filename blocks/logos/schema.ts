import { z } from "zod";
import { defineBlock } from "../define";
import { imageSchema, line } from "../shared";

export const logosBlock = defineBlock({
  type: "logos",
  meta: {
    label: "Logos",
    description: "Row of customer or press logos (image or text wordmark).",
    icon: "globe",
    category: "content",
    interactive: false,
  },
  props: z.object({
    heading: z.string().trim().max(100).optional().meta({ label: "Heading" }),
    items: z
      .array(
        z.object({
          name: line(40, "Name"),
          logo: imageSchema
            .optional()
            .meta({ label: "Logo image", description: "Without an image the name is shown as a wordmark" }),
        }),
      )
      .min(1)
      .max(12)
      .meta({ label: "Logos", itemLabel: "Logo" }),
  }),
  example: {
    heading: "Used by teams at",
    items: [{ name: "Northwind" }, { name: "Acme Co." }, { name: "Globex" }, { name: "Initech" }],
  },
});
