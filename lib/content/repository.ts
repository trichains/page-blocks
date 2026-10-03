import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pageSchema, toIssues, type PageDocument } from "@/lib/page-schema";

export type PageSummary = {
  slug: string;
  title: string;
  locale: PageDocument["locale"];
  description: string;
  background: PageDocument["theme"]["background"];
  accent: string;
  blockTypes: string[];
};

/**
 * Where page documents come from. The build reads them with `FileRepository`.
 * A CMS- or database-backed implementation would implement the same interface,
 * and the editor's "Publish" would call `save` from a Server Action.
 */
export interface PageRepository {
  list(): Promise<PageSummary[]>;
  get(slug: string): Promise<PageDocument | null>;
  save(page: PageDocument): Promise<void>;
}

export class ContentError extends Error {
  constructor(
    public readonly file: string,
    public readonly issues: { path: string; message: string }[],
  ) {
    super(
      `Invalid page content in ${file}:\n${issues.map((i) => `  - ${i.path || "(root)"}: ${i.message}`).join("\n")}`,
    );
    this.name = "ContentError";
  }
}

export const DEFAULT_CONTENT_DIR = path.join(process.cwd(), "content", "pages");

/** Reads versioned JSON documents from `content/pages/*.json` and validates them on load. */
export class FileRepository implements PageRepository {
  constructor(private readonly dir: string = DEFAULT_CONTENT_DIR) {}

  async slugs(): Promise<string[]> {
    const files = await readdir(this.dir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -".json".length))
      .sort();
  }

  async get(slug: string): Promise<PageDocument | null> {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) return null;
    const file = path.join(this.dir, `${slug}.json`);
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
    return parseDocument(raw, file, slug);
  }

  async list(): Promise<PageSummary[]> {
    const pages = await Promise.all((await this.slugs()).map((slug) => this.get(slug)));
    return pages.filter((p): p is PageDocument => p !== null).map(summarize);
  }

  async save(page: PageDocument): Promise<void> {
    const parsed = pageSchema.parse(page);
    await writeFile(path.join(this.dir, `${parsed.slug}.json`), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  }
}

export function parseDocument(raw: string, file: string, expectedSlug?: string): PageDocument {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new ContentError(file, [{ path: "", message: `Invalid JSON: ${(error as Error).message}` }]);
  }
  const result = pageSchema.safeParse(json);
  if (!result.success) throw new ContentError(file, toIssues(result.error));
  if (expectedSlug && result.data.slug !== expectedSlug) {
    throw new ContentError(file, [
      { path: "slug", message: `Slug "${result.data.slug}" must match the file name "${expectedSlug}"` },
    ]);
  }
  return result.data;
}

export function summarize(page: PageDocument): PageSummary {
  return {
    slug: page.slug,
    title: page.title,
    locale: page.locale,
    description: page.seo.description,
    background: page.theme.background,
    accent: page.theme.accent,
    blockTypes: page.blocks.map((b) => b.type),
  };
}
