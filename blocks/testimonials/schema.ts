import { z } from "zod";
import { defineBlock } from "../define";
import { line, paragraph } from "../shared";

export const testimonialsBlock = defineBlock({
  type: "testimonials",
  meta: {
    label: "Testimonials",
    description: "Quotes from customers or students.",
    icon: "message",
    category: "content",
    interactive: false,
  },
  props: z.object({
    heading: z.string().trim().max(100).optional().meta({ label: "Heading" }),
    items: z
      .array(
        z.object({
          quote: paragraph(400, "Quote"),
          name: line(60, "Name"),
          role: z.string().trim().max(80).optional().meta({ label: "Role / company" }),
        }),
      )
      .min(1, "Add at least one testimonial")
      .max(9)
      .meta({ label: "Testimonials", itemLabel: "Testimonial" }),
  }),
  example: {
    heading: "What people say",
    items: [
      { quote: "A specific result someone got, in their own words.", name: "Ana Souza", role: "Store owner" },
      { quote: "Short quotes read better than long ones.", name: "Marcus Lee", role: "Freelance designer" },
    ],
  },
});
