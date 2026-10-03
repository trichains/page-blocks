import { z } from "zod";

/** Icon names shared by the `features` block and the editor block list. */
export const ICON_NAMES = [
  "bolt",
  "shield",
  "chart",
  "clock",
  "layers",
  "users",
  "check",
  "mail",
  "code",
  "globe",
  "card",
  "refresh",
  "lock",
  "play",
  "message",
  "calendar",
  "tag",
  "text",
  "image",
  "list",
  "form",
  "timer",
  "help",
  "megaphone",
  "footer",
] as const;
export type IconName = (typeof ICON_NAMES)[number];
export const iconSchema = z.enum(ICON_NAMES);

/**
 * Links in content can point to an anchor (#pricing), a local path (/p/saas),
 * an absolute http(s) URL or mailto:. Anything else (javascript:, data:) is rejected.
 */
export const hrefSchema = z
  .string()
  .trim()
  .min(1, "Link is required")
  .max(500)
  .regex(/^(#[\w-]*|\/(?!\/)[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+)$/i, {
    message: "Use #anchor, /path, https://… or mailto:",
  });

export const ctaSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40).meta({ label: "Label" }),
  href: hrefSchema.meta({ label: "Link", description: "#anchor, /path or https://…" }),
});
export type Cta = z.infer<typeof ctaSchema>;

/**
 * Images are served from /public so next/image can optimise them without a
 * remotePatterns allow-list. Width and height are required to reserve the
 * aspect ratio and avoid layout shift.
 */
export const imageSchema = z.object({
  src: z
    .string()
    .trim()
    .regex(/^\/(?!\/)[\w./-]+\.(png|jpe?g|webp|avif|svg)$/i, "Local image path, e.g. /media/hero.webp")
    .meta({ label: "Image path" }),
  alt: z
    .string()
    .trim()
    .max(200)
    .meta({ label: "Alt text", description: "Describe the image. Leave empty only if decorative." }),
  width: z.number().int().min(16).max(4000).meta({ label: "Width (px)" }),
  height: z.number().int().min(16).max(4000).meta({ label: "Height (px)" }),
});
export type ImageAsset = z.infer<typeof imageSchema>;

export const blockIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/, "Lowercase letters, numbers and dashes");

export const visibilitySchema = z.object({
  hideOnMobile: z.boolean().default(false),
  hideOnDesktop: z.boolean().default(false),
});
export type Visibility = z.infer<typeof visibilitySchema>;

/** Short single-line text. */
export const line = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max).meta({ label });

/** Longer text; the editor renders a textarea. */
export const paragraph = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max).meta({ label, multiline: true });
