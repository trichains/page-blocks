import { z } from "zod";
import { defineBlock } from "../define";
import { line, paragraph } from "../shared";

export const LEAD_FIELD_NAMES = ["name", "email", "phone"] as const;
export type LeadFieldName = (typeof LEAD_FIELD_NAMES)[number];

export const leadFormBlock = defineBlock({
  type: "leadForm",
  meta: {
    label: "Lead form",
    description: "Name / email / phone capture that posts to /api/leads.",
    icon: "form",
    category: "conversion",
    interactive: true,
  },
  props: z
    .object({
      heading: line(120, "Heading"),
      text: paragraph(320, "Text").optional(),
      listId: z
        .string()
        .trim()
        .regex(/^[a-z0-9][a-z0-9_-]{0,47}$/, "Lowercase letters, numbers, - and _")
        .optional()
        .meta({ label: "List ID", description: "Sent with the lead so automations can route it" }),
      fields: z
        .array(
          z.object({
            name: z.enum(LEAD_FIELD_NAMES).meta({ label: "Field" }),
            label: line(40, "Label"),
            placeholder: z.string().trim().max(60).optional().meta({ label: "Placeholder" }),
            required: z.boolean().default(true).meta({ label: "Required" }),
          }),
        )
        .min(1)
        .max(3)
        .meta({ label: "Fields", itemLabel: "Field" }),
      submitLabel: line(40, "Button label"),
      consentText: z.string().trim().max(300).optional().meta({
        label: "Consent text",
        multiline: true,
        description: "If set, the visitor must tick a checkbox with this text",
      }),
      successMessage: paragraph(300, "Success message"),
    })
    .superRefine((props, ctx) => {
      const names = props.fields.map((f) => f.name);
      const emailIndex = names.indexOf("email");
      if (emailIndex === -1) {
        ctx.addIssue({ code: "custom", path: ["fields"], message: "The form needs an email field" });
      } else if (!props.fields[emailIndex].required) {
        ctx.addIssue({ code: "custom", path: ["fields", emailIndex, "required"], message: "Email must be required" });
      }
      names.forEach((n, i) => {
        if (names.indexOf(n) !== i) {
          ctx.addIssue({ code: "custom", path: ["fields", i, "name"], message: `Duplicate field "${n}"` });
        }
      });
    }),
  example: {
    heading: "Get the checklist",
    fields: [
      { name: "name", label: "First name", required: false },
      { name: "email", label: "Email", placeholder: "you@example.com", required: true },
    ],
    submitLabel: "Send it to me",
    successMessage: "Done. Check your inbox in the next few minutes.",
  },
});
