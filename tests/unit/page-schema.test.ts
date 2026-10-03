import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatPath, pageSchema, validatePage } from "@/lib/page-schema";

const base = {
  slug: "test",
  title: "Test page",
  locale: "en",
  seo: { title: "Test", description: "A test page" },
  theme: { accent: "#f2884b" },
  blocks: [
    { id: "hero", type: "hero", props: { headline: "Hello", primaryCta: { label: "Go", href: "#pricing" } } },
    { id: "cta", type: "cta", props: { headline: "Ready", cta: { label: "Go", href: "/p/test" } } },
  ],
};

describe("page schema", () => {
  it("accepts a minimal valid page and applies defaults", () => {
    const parsed = pageSchema.parse(base);
    expect(parsed.theme).toEqual({ accent: "#f2884b", background: "dark", radius: "medium", fontPair: "modern" });
    expect(parsed.seo.noIndex).toBe(false);
  });

  it("rejects duplicate block ids and points at the second one", () => {
    const result = validatePage({ ...base, blocks: [base.blocks[0], { ...base.blocks[1], id: "hero" }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(expect.objectContaining({ path: "blocks[1].id" }));
      expect(result.issues[0].message).toMatch(/Duplicate block id "hero"/);
    }
  });

  it("rejects unknown block types", () => {
    const result = validatePage({ ...base, blocks: [...base.blocks, { id: "x", type: "carousel", props: {} }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.path.startsWith("blocks[2]"))).toBe(true);
  });

  it("rejects pages without blocks, bad slugs and bad accent colors", () => {
    expect(pageSchema.safeParse({ ...base, blocks: [] }).success).toBe(false);
    expect(pageSchema.safeParse({ ...base, slug: "Not A Slug" }).success).toBe(false);
    expect(pageSchema.safeParse({ ...base, theme: { accent: "orange" } }).success).toBe(false);
  });

  it("requires a selector for click tracking events", () => {
    const result = pageSchema.safeParse({ ...base, tracking: { events: [{ trigger: "click", name: "cta" }] } });
    expect(result.success).toBe(false);
  });

  it("formats zod paths for humans", () => {
    expect(formatPath(["blocks", 2, "props", "items", 0, "title"])).toBe("blocks[2].props.items[0].title");
  });

  it("validates every committed content file", () => {
    const dir = path.join(process.cwd(), "content", "pages");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const result = validatePage(JSON.parse(readFileSync(path.join(dir, file), "utf8")));
      expect(result.ok, file).toBe(true);
    }
  });
});
