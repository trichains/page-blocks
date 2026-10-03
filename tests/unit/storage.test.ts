import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isDraftShape, loadDraft, saveDraft } from "@/components/editor/storage";
import type { DraftPage } from "@/components/editor/state";

const launch = JSON.parse(readFileSync(path.join(process.cwd(), "content/pages/launch.json"), "utf8")) as DraftPage;
const KEY = "page-blocks:draft:v1:launch";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

let storage: ReturnType<typeof memoryStorage>;
beforeEach(() => {
  storage = memoryStorage();
  (globalThis as { window?: unknown }).window = { localStorage: storage };
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("draft storage", () => {
  it("round-trips a valid draft", () => {
    saveDraft(launch);
    expect(loadDraft("launch")).toEqual(launch);
  });

  it("discards corrupted drafts instead of handing them to the editor", () => {
    for (const bad of [
      { ...launch, blocks: [null] },
      { ...launch, blocks: [{ id: 1, type: "hero", props: {} }] },
      { ...launch, blocks: [{ id: "x", type: "hero", props: "nope" }] },
      { ...launch, blocks: "nope" },
      { ...launch, seo: null },
      { ...launch, slug: "other" },
    ]) {
      storage.setItem(KEY, JSON.stringify(bad));
      expect(loadDraft("launch")).toBeNull();
      expect(storage.getItem(KEY)).toBeNull();
    }
    storage.setItem(KEY, "{not json");
    expect(loadDraft("launch")).toBeNull();
  });

  it("accepts drafts whose content is invalid but whose shape is fine", () => {
    const invalidContent = { ...launch, blocks: [{ id: "hero", type: "hero", props: { headline: "" } }] };
    expect(isDraftShape(invalidContent, "launch")).toBe(true);
  });
});
