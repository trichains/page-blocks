import { z } from "zod";
import { blockSchema } from "@/blocks/definitions";
import { imageSchema } from "@/blocks/shared";

export const LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];

export const FONT_PAIRS = ["modern", "editorial", "technical"] as const;
export type FontPair = (typeof FONT_PAIRS)[number];

export const RADII = ["none", "small", "medium", "large"] as const;

export const seoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "SEO title is required")
    .max(70)
    .meta({ label: "SEO title", description: "Up to ~60 characters shows fully in search results" }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(170)
    .meta({ label: "Meta description", multiline: true, description: "Up to ~155 characters" }),
  ogImage: imageSchema
    .pick({ src: true })
    .optional()
    .meta({ label: "Custom Open Graph image", description: "Leave empty to use the generated image" }),
  noIndex: z.boolean().default(false).meta({ label: "Hide from search engines (noindex)" }),
});

export const themeSchema = z.object({
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Hex color like #f2884b")
    .meta({ label: "Accent color", format: "color" }),
  background: z.enum(["dark", "light"]).default("dark").meta({ label: "Background" }),
  radius: z.enum(RADII).default("medium").meta({ label: "Corner radius" }),
  fontPair: z.enum(FONT_PAIRS).default("modern").meta({ label: "Font pair" }),
});
export type Theme = z.infer<typeof themeSchema>;

export const trackingEventSchema = z
  .object({
    trigger: z.enum(["view", "click", "submit"]).meta({ label: "Trigger" }),
    selector: z
      .string()
      .trim()
      .max(200)
      .optional()
      .meta({ label: "CSS selector", description: "Required for click and submit" }),
    name: z
      .string()
      .regex(/^[a-z][a-z0-9_]{1,47}$/, "snake_case event name")
      .meta({ label: "Event name" }),
  })
  .superRefine((e, ctx) => {
    if (e.trigger !== "view" && !e.selector) {
      ctx.addIssue({ code: "custom", path: ["selector"], message: "Click and submit events need a selector" });
    }
  });

export const pageBaseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/, "Lowercase letters, numbers and dashes"),
  title: z.string().trim().min(1).max(100).meta({ label: "Internal title" }),
  locale: z.enum(LOCALES).default("en").meta({ label: "Language" }),
  seo: seoSchema,
  theme: themeSchema,
  tracking: z
    .object({ events: z.array(trackingEventSchema).max(30).default([]).meta({ label: "Events", itemLabel: "Event" }) })
    .optional(),
  blocks: z.array(blockSchema).min(1, "A page needs at least one block").max(60),
});

/** Fields edited in the editor's "Page settings" panel. */
export const pageSettingsSchema = pageBaseSchema.pick({ title: true, locale: true, theme: true });

export const pageSchema = pageBaseSchema.superRefine((page, ctx) => {
  const seen = new Map<string, number>();
  page.blocks.forEach((block, i) => {
    const first = seen.get(block.id);
    if (first !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["blocks", i, "id"],
        message: `Duplicate block id "${block.id}" (also used by block ${first})`,
      });
    } else {
      seen.set(block.id, i);
    }
  });
});

export type PageDocument = z.infer<typeof pageSchema>;
export type PageDocumentInput = z.input<typeof pageSchema>;

export type ValidationIssue = { path: string; message: string };

/** Formats a zod path like ["blocks", 2, "props", "headline"] as "blocks[2].props.headline". */
export function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path.reduce<string>((acc, key) => {
    if (typeof key === "number") return `${acc}[${key}]`;
    return acc ? `${acc}.${String(key)}` : String(key);
  }, "");
}

export function toIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({ path: formatPath(issue.path), message: issue.message }));
}

export function validatePage(input: unknown) {
  const result = pageSchema.safeParse(input);
  return result.success
    ? ({ ok: true, page: result.data } as const)
    : ({ ok: false, issues: toIssues(result.error) } as const);
}
