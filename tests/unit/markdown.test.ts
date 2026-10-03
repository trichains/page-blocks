import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Markdown } from "@/components/Markdown";
import { isSafeHref, parseInline, parseMarkdown } from "@/lib/markdown";

const html = (source: string) => renderToStaticMarkup(createElement(Markdown, { source }));

describe("markdown subset", () => {
  it("parses headings, paragraphs and lists", () => {
    const blocks = parseMarkdown("## Title\n\nFirst line\nsame paragraph\n\n- a\n- b\n\n1. one\n2. two");
    expect(blocks.map((b) => b.type)).toEqual(["heading", "paragraph", "list", "list"]);
    expect(blocks[0]).toMatchObject({ level: 2 });
    expect(blocks[2]).toMatchObject({ ordered: false });
    expect(blocks[3]).toMatchObject({ ordered: true });
  });

  it("maps a single # to h2 so the page keeps one h1", () => {
    expect(parseMarkdown("# Big")[0]).toMatchObject({ type: "heading", level: 2 });
  });

  it("parses inline bold, italic, code and links", () => {
    expect(parseInline("**b** *i* `c` [l](https://x.dev)")).toEqual([
      { type: "strong", children: [{ type: "text", value: "b" }] },
      { type: "text", value: " " },
      { type: "em", children: [{ type: "text", value: "i" }] },
      { type: "text", value: " " },
      { type: "code", value: "c" },
      { type: "text", value: " " },
      { type: "link", href: "https://x.dev", children: [{ type: "text", value: "l" }] },
    ]);
  });

  it("does not treat snake_case as emphasis", () => {
    expect(parseInline("use snake_case_names here")).toEqual([{ type: "text", value: "use snake_case_names here" }]);
  });

  it("escapes raw HTML instead of rendering it", () => {
    const out = html('Hello <script>alert("x")</script> <img src=x onerror=alert(1)>');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;script&gt;");
  });

  it("drops unsafe link targets but keeps the label", () => {
    for (const href of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,hi",
      "//evil.example",
      "vbscript:x",
    ]) {
      expect(isSafeHref(href)).toBe(false);
      const out = html(`[click me](${href})`);
      expect(out).not.toContain("<a");
      expect(out).toContain("click me");
    }
  });

  it("keeps safe links and marks external ones nofollow", () => {
    expect(html("[docs](https://example.com)")).toContain('rel="noopener noreferrer nofollow"');
    expect(html("[faq](#faq)")).toContain('href="#faq"');
    expect(html("[mail](mailto:hi@example.com)")).toContain('href="mailto:hi@example.com"');
  });

  it("supports backslash escapes", () => {
    expect(parseInline("\\*not italic\\*")).toEqual([{ type: "text", value: "*not italic*" }]);
  });
});
