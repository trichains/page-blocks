import { z } from "zod";
import { defineBlock } from "../define";
import { iconSchema, line, paragraph } from "../shared";

export const featuresBlock = defineBlock({
  type: "features",
  meta: {
    label: "Features",
    description: "Grid of icon, title and short text.",
    icon: "layers",
    category: "content",
    interactive: false,
  },
  props: z.object({
    heading: line(100, "Heading"),
    intro: paragraph(280, "Intro").optional(),
    columns: z.number().int().min(2).max(4).default(3).meta({ label: "Columns on desktop" }),
    items: z
      .array(
        z.object({
          icon: iconSchema.meta({ label: "Icon" }),
          title: line(60, "Title"),
          text: paragraph(240, "Text"),
        }),
      )
      .min(1, "Add at least one feature")
      .max(12)
      .meta({ label: "Features", itemLabel: "Feature" }),
  }),
  example: {
    heading: "What you get",
    columns: 3,
    items: [
      { icon: "bolt", title: "Fast setup", text: "Describe a concrete benefit in a sentence or two." },
      { icon: "shield", title: "Safe by default", text: "Another benefit, written for the reader, not for you." },
      { icon: "chart", title: "Clear numbers", text: "Keep each item short so the grid stays scannable." },
    ],
  },
});
