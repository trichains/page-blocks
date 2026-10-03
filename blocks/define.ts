import { z } from "zod";
import { blockIdSchema, visibilitySchema, type IconName } from "./shared";

export type BlockCategory = "content" | "conversion" | "media" | "layout";

export interface BlockMeta {
  /** Human label shown in the editor. */
  label: string;
  /** One-line explanation shown in the "add block" menu. */
  description: string;
  icon: IconName;
  category: BlockCategory;
  /** Interactive blocks ship a client component; everything else is server-only HTML. */
  interactive: boolean;
}

/**
 * A block definition is the single source of truth for one block type:
 * - `props`: zod schema used for content validation AND editor form generation
 * - `example`: valid props used when the block is added in the editor (and as the test fixture)
 * - `meta`: editor metadata
 * The React renderer lives next to it and is wired up in `blocks/registry.tsx`.
 */
export function defineBlock<const T extends string, P extends z.ZodObject>(def: {
  type: T;
  props: P;
  example: z.input<P>;
  meta: BlockMeta;
}) {
  const schema = z.strictObject({
    id: blockIdSchema,
    type: z.literal(def.type),
    props: def.props,
    visibility: visibilitySchema.optional(),
  });
  return { ...def, schema };
}
