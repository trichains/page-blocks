import { z } from "zod";

/** Payload posted by the leadForm block to POST /api/leads. */
export const leadSubmissionSchema = z.object({
  pageSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  blockId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/),
  /** Ignored by the API (the published form's listId is used); accepted for compatibility. */
  listId: z.string().max(48).optional(),
  name: z.string().trim().max(80).optional(),
  email: z.email("Enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  consent: z.boolean().optional(),
  /** Honeypot: hidden from people, often filled by bots. */
  website: z.string().max(200).optional(),
});

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;
