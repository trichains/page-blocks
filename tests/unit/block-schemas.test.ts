import { describe, expect, it } from "vitest";
import { blockDefinitions, blockSchema } from "@/blocks/definitions";

/** One malformed props object per block type, each breaking a different rule. */
const malformed: Record<string, unknown> = {
  hero: { headline: "", primaryCta: { label: "Go", href: "#x" } },
  logos: { items: [] },
  features: { heading: "Features", items: [{ icon: "not-an-icon", title: "A", text: "B" }] },
  video: {
    url: "https://example.com/video.mp4",
    title: "Tour",
    poster: { src: "/media/a.webp", alt: "", width: 10, height: 10 },
  },
  testimonials: { items: [{ quote: "Great", name: "" }] },
  pricing: { heading: "Pricing", plans: [] },
  countdown: { label: "Ends in", mode: "fixed", expiredText: "Over" },
  leadForm: {
    heading: "Join",
    fields: [{ name: "name", label: "Name", required: true }],
    submitLabel: "Send",
    successMessage: "Thanks",
  },
  faq: { heading: "FAQ", items: [{ question: "Why?" }] },
  richText: { markdown: "" },
  cta: { headline: "Ready?", cta: { label: "Go", href: "javascript:alert(1)" } },
  footer: { brand: "", links: [] },
};

describe("block schemas", () => {
  it("has a malformed fixture for every registered block", () => {
    expect(Object.keys(malformed).sort()).toEqual(blockDefinitions.map((d) => d.type).sort());
  });

  for (const def of blockDefinitions) {
    describe(def.type, () => {
      it("accepts its example props", () => {
        const result = def.props.safeParse(def.example);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      it("accepts the example as a full block through the union", () => {
        expect(blockSchema.safeParse({ id: "x", type: def.type, props: def.example }).success).toBe(true);
      });

      it("rejects malformed props", () => {
        expect(def.props.safeParse(malformed[def.type]).success).toBe(false);
      });
    });
  }

  it("rejects links that browsers would treat as protocol-relative", () => {
    const cta = blockDefinitions.find((d) => d.type === "cta")!;
    for (const href of ["//evil.example", "/\\evil.example", "javascript:alert(1)"]) {
      expect(cta.props.safeParse({ headline: "x", cta: { label: "Go", href } }).success, href).toBe(false);
    }
    expect(cta.props.safeParse({ headline: "x", cta: { label: "Go", href: "/p/saas#pricing" } }).success).toBe(true);
  });

  it("rejects image paths that are not local", () => {
    const hero = blockDefinitions.find((d) => d.type === "hero")!;
    const result = hero.props.safeParse({
      ...hero.example,
      media: { src: "https://evil.example/x.png", alt: "", width: 100, height: 100 },
    });
    expect(result.success).toBe(false);
  });

  it("requires a deadline in fixed countdown mode and hours in evergreen mode", () => {
    const def = blockDefinitions.find((d) => d.type === "countdown")!;
    expect(def.props.safeParse({ label: "x", mode: "evergreen", expiredText: "y" }).success).toBe(false);
    expect(
      def.props.safeParse({ label: "x", mode: "fixed", deadline: "2026-11-12T22:00:00Z", expiredText: "y" }).success,
    ).toBe(true);
  });
});
