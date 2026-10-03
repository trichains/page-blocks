import { z } from "zod";
import { defineBlock } from "../define";
import { ctaSchema, line, paragraph } from "../shared";

export const ctaBlock = defineBlock({
  type: "cta",
  meta: {
    label: "CTA band",
    description: "Full-width band with a headline and a button.",
    icon: "bolt",
    category: "conversion",
    interactive: false,
  },
  props: z.object({
    headline: line(120, "Headline"),
    text: paragraph(280, "Text").optional(),
    cta: ctaSchema.meta({ label: "Button" }),
    secondaryCta: ctaSchema.optional().meta({ label: "Secondary button" }),
  }),
  example: {
    headline: "Ready when you are",
    text: "Repeat the main promise and remove the last bit of risk.",
    cta: { label: "Get started", href: "#pricing" },
  },
});
