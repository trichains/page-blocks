import { z } from "zod";
import { defineBlock } from "../define";
import { ctaSchema, line } from "../shared";

export const countdownBlock = defineBlock({
  type: "countdown",
  meta: {
    label: "Countdown",
    description: "Fixed deadline, or evergreen: N hours from each visitor's first visit (kept in a cookie).",
    icon: "timer",
    category: "conversion",
    interactive: true,
  },
  props: z
    .strictObject({
      label: line(100, "Label"),
      mode: z.enum(["fixed", "evergreen"]).default("fixed").meta({ label: "Mode" }),
      deadline: z.iso
        .datetime({ offset: true })
        .optional()
        .meta({ label: "Deadline (ISO 8601)", description: "Fixed mode, e.g. 2026-11-12T22:00:00Z" }),
      hours: z
        .number()
        .int()
        .min(1)
        .max(720)
        .optional()
        .meta({ label: "Hours per visitor", description: "Evergreen mode" }),
      expiredText: line(160, "Text after the deadline"),
      cta: ctaSchema.optional().meta({ label: "Button" }),
    })
    .superRefine((p, ctx) => {
      if (p.mode === "fixed" && !p.deadline) {
        ctx.addIssue({ code: "custom", path: ["deadline"], message: "Fixed mode needs a deadline" });
      }
      if (p.mode === "evergreen" && !p.hours) {
        ctx.addIssue({ code: "custom", path: ["hours"], message: "Evergreen mode needs a number of hours" });
      }
    }),
  example: {
    label: "Offer ends in",
    mode: "evergreen",
    hours: 48,
    expiredText: "This offer has ended.",
  },
});
