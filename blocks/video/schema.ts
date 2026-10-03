import { z } from "zod";
import { parseVideoUrl } from "@/lib/video";
import { defineBlock } from "../define";
import { imageSchema } from "../shared";

export const videoBlock = defineBlock({
  type: "video",
  meta: {
    label: "Video (VSL)",
    description: "Poster image with a play button. The YouTube/Vimeo player loads only after a click.",
    icon: "play",
    category: "media",
    interactive: true,
  },
  props: z.strictObject({
    heading: z.string().trim().max(120).optional().meta({ label: "Heading" }),
    url: z
      .string()
      .trim()
      .refine((v) => parseVideoUrl(v) !== null, "Use a YouTube or Vimeo URL")
      .meta({ label: "Video URL", description: "YouTube or Vimeo link" }),
    title: z
      .string()
      .trim()
      .min(1, "Video title is required")
      .max(100)
      .meta({ label: "Video title", description: "Used for the play button label and the iframe title" }),
    poster: imageSchema.meta({ label: "Poster image" }),
    caption: z.string().trim().max(240).optional().meta({ label: "Caption" }),
  }),
  example: {
    heading: "Watch the walkthrough",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    title: "Product walkthrough",
    poster: { src: "/media/launch-poster.webp", alt: "", width: 1280, height: 720 },
  },
});
