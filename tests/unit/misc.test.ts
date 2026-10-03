import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContentError, FileRepository } from "@/lib/content/repository";
import { accentForeground, contrastRatio } from "@/lib/theme";
import { embedUrl, parseVideoUrl } from "@/lib/video";

describe("video urls", () => {
  it("parses YouTube and Vimeo links", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=aqz-KE-bpKQ")).toEqual({
      provider: "youtube",
      id: "aqz-KE-bpKQ",
    });
    expect(parseVideoUrl("https://youtu.be/aqz-KE-bpKQ?t=10")).toEqual({ provider: "youtube", id: "aqz-KE-bpKQ" });
    expect(parseVideoUrl("https://www.youtube.com/embed/aqz-KE-bpKQ")).toEqual({
      provider: "youtube",
      id: "aqz-KE-bpKQ",
    });
    expect(parseVideoUrl("https://vimeo.com/76979871")).toEqual({ provider: "vimeo", id: "76979871" });
    expect(parseVideoUrl("https://example.com/watch?v=aqz-KE-bpKQ")).toBeNull();
  });

  it("uses the privacy-enhanced YouTube domain", () => {
    expect(embedUrl({ provider: "youtube", id: "aqz-KE-bpKQ" })).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
    );
  });
});

describe("theme", () => {
  it("picks readable text for the accent color", () => {
    expect(accentForeground("#f2884b")).toBe("#0c0d10");
    expect(accentForeground("#2f6fde")).toBe("#ffffff");
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
});

describe("FileRepository", () => {
  it("lists and loads the committed pages", async () => {
    const repo = new FileRepository();
    expect(await repo.slugs()).toEqual(["launch", "saas", "webinar"]);
    const page = await repo.get("launch");
    expect(page?.blocks[0].type).toBe("hero");
    expect(await repo.get("missing")).toBeNull();
    expect(await repo.get("../etc/passwd")).toBeNull();
  });

  it("throws a ContentError with paths for invalid files, and saves valid ones", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "pb-"));
    const repo = new FileRepository(dir);
    await writeFile(path.join(dir, "bad.json"), JSON.stringify({ slug: "bad", blocks: [] }));
    await expect(repo.get("bad")).rejects.toBeInstanceOf(ContentError);

    const launch = await new FileRepository().get("launch");
    await repo.save({ ...launch!, slug: "copy" });
    const saved = JSON.parse(await readFile(path.join(dir, "copy.json"), "utf8"));
    expect(saved.slug).toBe("copy");
    expect((await repo.get("copy"))?.title).toBe(launch!.title);
  });
});
