import { z } from "zod";
import { defineBlock } from "../define";
import { line, paragraph } from "../shared";

export const faqBlock = defineBlock({
  type: "faq",
  meta: {
    label: "FAQ",
    description: "Accessible accordion built on native <details>, no JavaScript.",
    icon: "help",
    category: "content",
    interactive: false,
  },
  props: z.object({
    heading: line(100, "Heading"),
    items: z
      .array(
        z.object({
          question: line(160, "Question"),
          answer: paragraph(1200, "Answer"),
        }),
      )
      .min(1, "Add at least one question")
      .max(20)
      .meta({ label: "Questions", itemLabel: "Question" }),
  }),
  example: {
    heading: "Frequently asked questions",
    items: [
      { question: "Can I cancel anytime?", answer: "Yes. Answer the objection directly and keep it short." },
      { question: "Do you offer refunds?", answer: "State the policy and the time window plainly." },
    ],
  },
});
