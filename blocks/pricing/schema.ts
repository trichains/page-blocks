import { z } from "zod";
import { defineBlock } from "../define";
import { ctaSchema, line, paragraph } from "../shared";

export const pricingBlock = defineBlock({
  type: "pricing",
  meta: {
    label: "Pricing",
    description: "Plans with price, feature list and a highlighted option.",
    icon: "card",
    category: "conversion",
    interactive: false,
  },
  props: z.object({
    heading: line(100, "Heading"),
    intro: paragraph(280, "Intro").optional(),
    plans: z
      .array(
        z.object({
          name: line(40, "Plan name"),
          price: line(20, "Price"),
          period: z.string().trim().max(30).optional().meta({ label: "Period", description: "e.g. /month, one-time" }),
          description: z.string().trim().max(160).optional().meta({ label: "Description" }),
          features: z
            .array(z.string().trim().min(1, "Feature is required").max(100))
            .max(12)
            .default([])
            .meta({ label: "Features", itemLabel: "Feature" }),
          cta: ctaSchema.meta({ label: "Button" }),
          highlight: z.boolean().default(false).meta({ label: "Highlight this plan" }),
          badge: z.string().trim().max(30).optional().meta({ label: "Badge", description: "e.g. Most popular" }),
        }),
      )
      .min(1, "Add at least one plan")
      .max(4)
      .meta({ label: "Plans", itemLabel: "Plan" }),
    note: z.string().trim().max(200).optional().meta({ label: "Note under the plans" }),
  }),
  example: {
    heading: "Pricing",
    plans: [
      {
        name: "Starter",
        price: "$9",
        period: "/month",
        features: ["One project", "Email support"],
        cta: { label: "Choose Starter", href: "#" },
        highlight: false,
      },
      {
        name: "Pro",
        price: "$29",
        period: "/month",
        features: ["Unlimited projects", "Priority support"],
        cta: { label: "Choose Pro", href: "#" },
        highlight: true,
        badge: "Most popular",
      },
    ],
  },
});
