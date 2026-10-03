import type { BlockType, PropsOf } from "./definitions";
import type { Locale } from "@/lib/page-schema";

export type RenderMode = "live" | "preview";

export type BlockContext = {
  pageSlug: string;
  locale: Locale;
  /** "preview" inside the editor: no cookies, no tracking, no form submissions. */
  mode: RenderMode;
  /** Position on the page; the first block can preload its image. */
  index: number;
};

export type BlockRenderProps<T extends BlockType> = {
  id: string;
  props: PropsOf<T>;
  ctx: BlockContext;
};
