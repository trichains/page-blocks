"use client";

import { seoSchema } from "@/lib/page-schema";
import { formSchemaFor } from "./json-schema";
import { SchemaForm, type FieldErrors } from "./SchemaForm";
import type { DraftPage } from "./state";

export function SeoPanel({
  page,
  errors,
  onChange,
}: {
  page: DraftPage;
  errors: FieldErrors;
  onChange: (seo: Record<string, unknown>) => void;
}) {
  const title = typeof page.seo.title === "string" ? page.seo.title : "";
  const description = typeof page.seo.description === "string" ? page.seo.description : "";
  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-app-muted uppercase">Search and social</h2>
      <SchemaForm
        schema={formSchemaFor(seoSchema)}
        value={page.seo}
        onChange={onChange}
        errors={errors}
        idPrefix="seo"
      />

      <h3 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-app-muted uppercase">Search result preview</h3>
      <div className="rounded-md border border-app-border bg-white p-4 font-sans">
        <p className="truncate text-xs text-[#4d5156]">example.com › p › {page.slug}</p>
        <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{title || "Untitled page"}</p>
        <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{description}</p>
      </div>
      <p className="mt-2 text-xs text-app-muted">
        Title {title.length}/60 · Description {description.length}/155 (approximate truncation points).
      </p>

      <h3 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-app-muted uppercase">Open Graph image</h3>
      <p className="text-xs leading-relaxed text-app-muted">
        Generated at build time from the published title and accent color by{" "}
        <code className="text-app-fg">app/p/[slug]/opengraph-image.tsx</code>.{" "}
        <a
          className="text-app-accent underline"
          href={`/p/${page.slug}/opengraph-image`}
          target="_blank"
          rel="noreferrer"
        >
          Open the published image
        </a>
      </p>
    </div>
  );
}
