import { z } from "zod";
import { heroBlock } from "./hero/schema";
import { featuresBlock } from "./features/schema";
import { testimonialsBlock } from "./testimonials/schema";
import { pricingBlock } from "./pricing/schema";
import { faqBlock } from "./faq/schema";
import { ctaBlock } from "./cta/schema";
import { videoBlock } from "./video/schema";
import { leadFormBlock } from "./lead-form/schema";
import { countdownBlock } from "./countdown/schema";
import { logosBlock } from "./logos/schema";
import { richTextBlock } from "./rich-text/schema";
import { footerBlock } from "./footer/schema";

/**
 * Every block type, in the order the editor lists them.
 * Schemas only: no React imports here, so scripts and CI can load it with plain Node.
 */
export const blockDefinitions = [
  heroBlock,
  logosBlock,
  featuresBlock,
  videoBlock,
  testimonialsBlock,
  pricingBlock,
  countdownBlock,
  leadFormBlock,
  faqBlock,
  richTextBlock,
  ctaBlock,
  footerBlock,
] as const;

export type BlockDefinition = (typeof blockDefinitions)[number];
export type BlockType = BlockDefinition["type"];

export const blockSchema = z.discriminatedUnion("type", [
  heroBlock.schema,
  logosBlock.schema,
  featuresBlock.schema,
  videoBlock.schema,
  testimonialsBlock.schema,
  pricingBlock.schema,
  countdownBlock.schema,
  leadFormBlock.schema,
  faqBlock.schema,
  richTextBlock.schema,
  ctaBlock.schema,
  footerBlock.schema,
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockInput = z.input<typeof blockSchema>;
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;
export type PropsOf<T extends BlockType> = BlockOf<T>["props"];

export const BLOCK_TYPES: BlockType[] = blockDefinitions.map((d) => d.type);

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return blockDefinitions.find((d) => d.type === type);
}
