import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { blockDefinitions, blockSchema, type Block } from "@/blocks/definitions";
import { RenderBlock } from "@/blocks/registry";
import type { BlockContext } from "@/blocks/types";
import { PageRenderer } from "@/components/PageRenderer";
import { pageSchema } from "@/lib/page-schema";

const ctx: BlockContext = { pageSlug: "test", locale: "en", mode: "live", index: 0 };

function render(type: string, props: unknown, over: Partial<BlockContext> = {}) {
  const block = blockSchema.parse({ id: `${type.toLowerCase()}-1`, type, props }) as Block;
  return renderToStaticMarkup(<RenderBlock block={block} ctx={{ ...ctx, ...over }} />);
}

const example = (type: string) => blockDefinitions.find((d) => d.type === type)!.example;

describe("every block renders its example on the server", () => {
  for (const def of blockDefinitions) {
    it(def.type, () => {
      const html = render(def.type, def.example);
      expect(html.length).toBeGreaterThan(50);
      expect(html).toContain(`data-block-id="${def.type.toLowerCase()}-1"`);
    });
  }
});

describe("block markup", () => {
  it("hero renders a single h1 with the headline and tracked CTAs", () => {
    const html = render("hero", example("hero"));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Say what the page is about in one sentence");
    expect(html).toContain('data-track="cta_click"');
    expect(html).toContain('href="#pricing"');
  });

  it("hero image reserves its aspect ratio and is eager only as the first block", () => {
    const props = {
      ...example("hero"),
      media: { src: "/media/launch-hero.webp", alt: "App screen", width: 1200, height: 900 },
    };
    const first = render("hero", props);
    expect(first).toMatch(/width="1200"/);
    expect(first).toMatch(/height="900"/);
    expect(first).toContain('alt="App screen"');
    expect(first).toContain('fetchPriority="high"');
    expect(first).toContain("sizes=");
    expect(render("hero", props, { index: 3 })).toContain('loading="lazy"');
  });

  it("faq uses native details/summary, no buttons or scripts", () => {
    const html = render("faq", example("faq"));
    expect(html.match(/<details/g)).toHaveLength(2);
    expect(html.match(/<summary/g)).toHaveLength(2);
    expect(html).toContain("Can I cancel anytime?");
    expect(html).not.toContain("<button");
  });

  it("lead form: every input has a label, required fields are marked, honeypot is hidden", () => {
    const props = {
      ...example("leadForm"),
      consentText: "I agree to receive emails.",
    };
    const html = render("leadForm", props);
    const ids = [...html.matchAll(/<input[^>]*id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBe(4); // name, email, honeypot, consent
    for (const id of ids) expect(html).toContain(`for="${id}"`);
    expect(html).toMatch(/<input[^>]*type="email"[^>]*required=""|<input[^>]*required=""[^>]*type="email"/);
    expect(html).toContain('autoComplete="email"');
    expect(html).toMatch(/aria-hidden="true"[^>]*>\s*<label[^>]*>Website/);
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('type="submit"');
  });

  it("lead form disables submission in editor preview", () => {
    const html = render("leadForm", example("leadForm"), { mode: "preview" });
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(html).toContain("disabled in the editor preview");
  });

  it("video renders a poster and an accessible play button, no iframe until clicked", () => {
    const html = render("video", example("video"));
    expect(html).not.toContain("<iframe");
    expect(html).toMatch(/<button[^>]*aria-label="Play video: Product walkthrough"/);
    expect(html).toContain("aspect-video");
    expect(html).toContain("loads from YouTube when you click play");
  });

  it("countdown is labelled as evergreen and renders placeholders before hydration", () => {
    const html = render("countdown", example("countdown"));
    expect(html).toContain('role="timer"');
    expect(html).toContain("48 hours from your first visit");
    expect(html).toContain("--");
  });

  it("countdown uses the page locale", () => {
    const html = render("countdown", example("countdown"), { locale: "pt-BR" });
    expect(html).toContain("primeira visita");
    expect(html).toContain("horas");
  });

  it("pricing highlights the chosen plan with its badge", () => {
    const html = render("pricing", example("pricing"));
    expect(html).toContain("Most popular");
    expect(html.match(/<h3/g)).toHaveLength(2);
  });

  it("rich text never outputs raw HTML from content", () => {
    const html = render("richText", { markdown: "Hi <b onclick=x>there</b> [x](javascript:alert(1))" });
    expect(html).not.toContain("<b ");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("&lt;b onclick=x&gt;");
  });

  it("footer renders a labelled nav", () => {
    const html = render("footer", example("footer"));
    expect(html).toContain('<nav aria-label="Your brand links"');
  });
});

describe("page renderer", () => {
  const launch = pageSchema.parse(
    JSON.parse(readFileSync(path.join(process.cwd(), "content/pages/launch.json"), "utf8")),
  );

  it("renders a full page with theme variables and locale", () => {
    const html = renderToStaticMarkup(
      <PageRenderer slug={launch.slug} locale={launch.locale} theme={launch.theme} blocks={launch.blocks} />,
    );
    expect(html).toContain('lang="en"');
    expect(html).toContain("--pb-accent:#f2884b");
    expect(html).toContain("Send the invoice before you close the laptop");
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("applies visibility classes with container queries", () => {
    const blocks = [{ ...launch.blocks[1], visibility: { hideOnMobile: true, hideOnDesktop: false } }];
    const html = renderToStaticMarkup(<PageRenderer slug="x" locale="en" theme={launch.theme} blocks={blocks} />);
    expect(html).toContain("@max-3xl:hidden");
  });
});
