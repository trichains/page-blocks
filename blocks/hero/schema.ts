import { z } from "zod";
import { defineBlock } from "../define";
import { ctaSchema, imageSchema, line, paragraph } from "../shared";

export const heroBlock = defineBlock({
  type: "hero",
  meta: {
    label: "Hero",
    description: "Headline, supporting text, call to action and an optional image.",
    icon: "megaphone",
    category: "content",
    interactive: false,
  },
  props: z.strictObject({
    eyebrow: z
      .string()
      .trim()
      .max(60)
      .optional()
      .meta({ label: "Eyebrow", description: "Small label above the headline" }),
    headline: line(120, "Headline"),
    subheadline: paragraph(320, "Subheadline").optional(),
    primaryCta: ctaSchema.meta({ label: "Primary call to action" }),
    secondaryCta: ctaSchema.optional().meta({ label: "Secondary call to action" }),
    media: imageSchema.optional().meta({ label: "Image" }),
    align: z.enum(["left", "center"]).default("left").meta({ label: "Alignment" }),
  }),
  example: {
    eyebrow: "New",
    headline: "Say what the page is about in one sentence",
    subheadline: "Explain who it is for and what changes for them after they click the button.",
    primaryCta: { label: "Get started", href: "#" },
    align: "left",
  },
});
