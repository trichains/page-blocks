import type { ComponentType } from "react";
import type { Block, BlockType } from "./definitions";
import type { BlockContext, BlockRenderProps } from "./types";
import { Hero } from "./hero/Hero";
import { Logos } from "./logos/Logos";
import { Features } from "./features/Features";
import { Video } from "./video/Video";
import { Testimonials } from "./testimonials/Testimonials";
import { Pricing } from "./pricing/Pricing";
import { Countdown } from "./countdown/Countdown";
import { LeadForm } from "./lead-form/LeadForm";
import { Faq } from "./faq/Faq";
import { RichText } from "./rich-text/RichText";
import { CtaBand } from "./cta/CtaBand";
import { Footer } from "./footer/Footer";

/**
 * Block type -> renderer. The mapped type makes TypeScript fail the build if a block
 * is added to `definitions.ts` without a renderer here.
 */
export const blockRenderers: { [T in BlockType]: ComponentType<BlockRenderProps<T>> } = {
  hero: Hero,
  logos: Logos,
  features: Features,
  video: Video,
  testimonials: Testimonials,
  pricing: Pricing,
  countdown: Countdown,
  leadForm: LeadForm,
  faq: Faq,
  richText: RichText,
  cta: CtaBand,
  footer: Footer,
};

export function RenderBlock({ block, ctx }: { block: Block; ctx: BlockContext }) {
  const Renderer = blockRenderers[block.type] as ComponentType<BlockRenderProps<typeof block.type>>;
  return <Renderer id={block.id} props={block.props as never} ctx={ctx} />;
}
