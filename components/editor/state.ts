import { getBlockDefinition } from "@/blocks/definitions";
import type { PageDocument } from "@/lib/page-schema";

/**
 * The editor works on a loosely typed draft: while someone types, the document is often
 * temporarily invalid. Validation runs separately (zod) and only valid blocks render.
 */
export type DraftBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  visibility?: { hideOnMobile?: boolean; hideOnDesktop?: boolean };
};

export type DraftPage = Omit<PageDocument, "blocks" | "seo" | "theme" | "title" | "locale"> & {
  title: unknown;
  locale: unknown;
  seo: Record<string, unknown>;
  theme: Record<string, unknown>;
  blocks: DraftBlock[];
};

export type EditorAction =
  | { type: "replace"; page: DraftPage }
  | { type: "addBlock"; blockType: string; index: number }
  | { type: "moveBlock"; from: number; to: number }
  | { type: "duplicateBlock"; index: number }
  | { type: "removeBlock"; index: number }
  | { type: "setBlockProps"; index: number; props: Record<string, unknown> }
  | { type: "setBlockSettings"; index: number; id: string; visibility?: DraftBlock["visibility"] }
  | { type: "setSettings"; settings: { title: unknown; locale: unknown; theme: Record<string, unknown> } }
  | { type: "setSeo"; seo: Record<string, unknown> };

/** Next free id based on a prefix: "pricing", "pricing-2", "pricing-3"... */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const clean =
    base
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "block";
  if (!used.has(clean)) return clean;
  let n = 2;
  while (used.has(`${clean}-${n}`)) n++;
  return `${clean}-${n}`;
}

function clampIndex(i: number, length: number) {
  return Math.max(0, Math.min(length, i));
}

export function editorReducer(page: DraftPage, action: EditorAction): DraftPage {
  const blocks = page.blocks;
  switch (action.type) {
    case "replace":
      return action.page;

    case "addBlock": {
      const def = getBlockDefinition(action.blockType);
      if (!def) return page;
      const block: DraftBlock = {
        id: uniqueId(
          def.type.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
          blocks.map((b) => b.id),
        ),
        type: def.type,
        props: structuredClone(def.example) as Record<string, unknown>,
      };
      const next = [...blocks];
      next.splice(clampIndex(action.index, blocks.length), 0, block);
      return { ...page, blocks: next };
    }

    case "moveBlock": {
      const { from, to } = action;
      if (from === to || from < 0 || from >= blocks.length || to < 0 || to >= blocks.length) return page;
      const next = [...blocks];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...page, blocks: next };
    }

    case "duplicateBlock": {
      const source = blocks[action.index];
      if (!source) return page;
      const copy: DraftBlock = {
        ...structuredClone(source),
        id: uniqueId(
          source.id.replace(/-\d+$/, ""),
          blocks.map((b) => b.id),
        ),
      };
      const next = [...blocks];
      next.splice(action.index + 1, 0, copy);
      return { ...page, blocks: next };
    }

    case "removeBlock":
      if (!blocks[action.index]) return page;
      return { ...page, blocks: blocks.filter((_, i) => i !== action.index) };

    case "setBlockProps":
      if (!blocks[action.index]) return page;
      return { ...page, blocks: blocks.map((b, i) => (i === action.index ? { ...b, props: action.props } : b)) };

    case "setBlockSettings": {
      if (!blocks[action.index]) return page;
      const v = action.visibility;
      const visibility =
        v && (v.hideOnMobile || v.hideOnDesktop)
          ? { hideOnMobile: Boolean(v.hideOnMobile), hideOnDesktop: Boolean(v.hideOnDesktop) }
          : undefined;
      return {
        ...page,
        blocks: blocks.map((b, i) => {
          if (i !== action.index) return b;
          const { visibility: _old, ...rest } = b;
          void _old;
          return visibility ? { ...rest, id: action.id, visibility } : { ...rest, id: action.id };
        }),
      };
    }

    case "setSettings":
      return { ...page, title: action.settings.title, locale: action.settings.locale, theme: action.settings.theme };

    case "setSeo":
      return { ...page, seo: action.seo };
  }
}
