import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getBlockDefinition } from "@/blocks/definitions";
import { emptyValue, formSchemaFor } from "@/components/editor/json-schema";
import { editorReducer, uniqueId, type DraftPage } from "@/components/editor/state";
import { validateDraft } from "@/components/editor/validation";

const launch = JSON.parse(readFileSync(path.join(process.cwd(), "content/pages/launch.json"), "utf8")) as DraftPage;

describe("editor reducer", () => {
  it("adds a block from the registry with example props and a unique id", () => {
    const next = editorReducer(launch, { type: "addBlock", blockType: "pricing", index: 1 });
    expect(next.blocks[1]).toMatchObject({ type: "pricing", id: "pricing-2" });
    expect(validateDraft(next).valid).toBe(true);
  });

  it("moves, duplicates and removes blocks", () => {
    const moved = editorReducer(launch, { type: "moveBlock", from: 0, to: 2 });
    expect(moved.blocks[2].id).toBe("hero");
    const dup = editorReducer(launch, { type: "duplicateBlock", index: 0 });
    expect(dup.blocks[1]).toMatchObject({ id: "hero-2", type: "hero" });
    expect(dup.blocks[1].props).toEqual(launch.blocks[0].props);
    expect(dup.blocks[1].props).not.toBe(launch.blocks[0].props);
    const removed = editorReducer(launch, { type: "removeBlock", index: 0 });
    expect(removed.blocks).toHaveLength(launch.blocks.length - 1);
  });

  it("ignores out-of-range moves", () => {
    expect(editorReducer(launch, { type: "moveBlock", from: 0, to: 99 })).toBe(launch);
  });

  it("drops the visibility object when both flags are off", () => {
    const next = editorReducer(launch, {
      type: "setBlockSettings",
      index: 0,
      id: "hero",
      visibility: { hideOnMobile: false, hideOnDesktop: false },
    });
    expect(next.blocks[0]).not.toHaveProperty("visibility");
  });

  it("generates unique ids", () => {
    expect(uniqueId("faq", ["faq", "faq-2"])).toBe("faq-3");
    expect(uniqueId("Lead Form!", [])).toBe("lead-form");
  });
});

describe("draft validation", () => {
  it("maps zod issues to the panel and field that caused them", () => {
    const broken = editorReducer(launch, {
      type: "setBlockProps",
      index: 0,
      props: { ...launch.blocks[0].props, headline: "" },
    });
    const v = validateDraft(broken);
    expect(v.valid).toBe(false);
    expect(v.blockPropErrors[0]).toHaveProperty("headline");
    expect(v.renderable[0]).toMatchObject({ invalid: true, id: "hero" });
    expect(v.renderable[1]).not.toHaveProperty("invalid");
  });

  it("reports duplicate ids on the block settings", () => {
    const dup = editorReducer(launch, { type: "setBlockSettings", index: 1, id: "hero" });
    expect(validateDraft(dup).blockSettingsErrors[1]).toHaveProperty("id");
  });
});

describe("form schema generation", () => {
  it("exposes labels, enums, defaults and array metadata from zod", () => {
    const schema = formSchemaFor(getBlockDefinition("features")!.props);
    expect(schema.properties?.heading).toMatchObject({ type: "string", label: "Heading", maxLength: 100 });
    expect(schema.properties?.columns).toMatchObject({ type: "integer", default: 3 });
    expect(schema.properties?.items).toMatchObject({ type: "array", itemLabel: "Feature", minItems: 1 });
    expect(schema.properties?.items?.items?.properties?.icon?.enum).toContain("bolt");
    expect(schema.required).toContain("items");
    expect(schema.required).not.toContain("intro");
  });

  it("builds empty values for new array items", () => {
    const schema = formSchemaFor(getBlockDefinition("pricing")!.props);
    expect(emptyValue(schema.properties!.plans.items!)).toEqual({
      name: "",
      price: "",
      features: [],
      cta: { label: "", href: "" },
      highlight: false,
    });
  });
});
