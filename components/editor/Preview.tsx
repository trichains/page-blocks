"use client";

import { useRef, type MouseEvent } from "react";
import { PageRenderer, type RenderableBlock } from "@/components/PageRenderer";
import type { Locale, Theme } from "@/lib/page-schema";

export type Device = "mobile" | "desktop";

/**
 * Live preview rendered in the same React tree as the editor, using the exact block
 * components the static page uses. Blocks style themselves with container queries, so
 * shrinking this container to 390px reproduces the mobile layout without an iframe.
 */
export function Preview({
  slug,
  locale,
  theme,
  blocks,
  device,
}: {
  slug: string;
  locale: Locale;
  theme: Theme;
  blocks: RenderableBlock[];
  device: Device;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the visitor inside the editor: anchors scroll the preview, other links do nothing.
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as Element).closest("a");
    if (!link) return;
    event.preventDefault();
    const href = link.getAttribute("href") ?? "";
    if (href.startsWith("#") && href.length > 1) {
      const target = scroller.current?.querySelector(`[id="${CSS.escape(href.slice(1))}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div ref={scroller} className="h-full overflow-y-auto bg-app-bg">
      <div
        className={`mx-auto transition-[max-width] ${device === "mobile" ? "my-4 max-w-[390px] overflow-hidden rounded-xl border border-app-border" : "max-w-none"}`}
      >
        <section aria-label="Live preview" onClickCapture={onClickCapture}>
          <PageRenderer
            slug={slug}
            locale={locale}
            theme={theme}
            blocks={blocks}
            mode="preview"
            renderInvalid={(block) => (
              <div className="m-4 rounded-md border border-dashed border-app-danger/60 bg-app-panel p-4 font-sans text-sm text-app-fg">
                <p className="font-semibold">
                  {block.type} <span className="font-normal text-app-muted">#{block.id}</span> is not rendered until it
                  is valid
                </p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-app-danger">
                  {block.issues.slice(0, 4).map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          />
        </section>
      </div>
    </div>
  );
}
