import { Fragment, type ReactNode } from "react";
import type { Block } from "@/blocks/definitions";
import { RenderBlock } from "@/blocks/registry";
import type { RenderMode } from "@/blocks/types";
import type { Locale, Theme } from "@/lib/page-schema";
import { themeStyle } from "@/lib/theme";

export type InvalidBlock = { invalid: true; id: string; type: string; issues: string[] };
export type RenderableBlock = Block | InvalidBlock;

function visibilityClass(block: Block): string {
  const classes: string[] = [];
  // Container queries (not media queries), so the editor's mobile/desktop toggle behaves like a real device.
  if (block.visibility?.hideOnMobile) classes.push("@max-3xl:hidden");
  if (block.visibility?.hideOnDesktop) classes.push("@3xl:hidden");
  return classes.join(" ");
}

/**
 * Renders a page document. Used by the static /p/[slug] route (as a Server Component)
 * and by the editor preview (inside a Client Component). Blocks never touch request
 * APIs, so the same code works in both places.
 */
export function PageRenderer({
  slug,
  locale,
  theme,
  blocks,
  mode = "live",
  renderInvalid,
}: {
  slug: string;
  locale: Locale;
  theme: Theme;
  blocks: RenderableBlock[];
  mode?: RenderMode;
  renderInvalid?: (block: InvalidBlock) => ReactNode;
}) {
  return (
    <div
      lang={locale}
      style={themeStyle(theme)}
      className="@container min-h-full bg-pb-bg font-body text-pb-fg antialiased"
      data-page={slug}
    >
      {blocks.map((block, index) => {
        if ("invalid" in block) return <div key={block.id}>{renderInvalid?.(block)}</div>;
        const cls = visibilityClass(block);
        const content = <RenderBlock block={block} ctx={{ pageSlug: slug, locale, mode, index }} />;
        return cls ? (
          <div key={block.id} className={cls}>
            {content}
          </div>
        ) : (
          <Fragment key={block.id}>{content}</Fragment>
        );
      })}
    </div>
  );
}
