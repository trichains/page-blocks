import { ImageResponse } from "next/og";
import { getPage, listSlugs } from "@/lib/content/pages";
import { accentForeground, themeBackground, themeForeground } from "@/lib/theme";

const size = { width: 1200, height: 630 };

export async function generateStaticParams() {
  return (await listSlugs()).map((slug) => ({ slug }));
}

/** One image per page; generateImageMetadata lets the alt text come from the page's SEO title. */
export async function generateImageMetadata({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  return [{ id: "og", alt: page?.seo.title ?? "Page Blocks", size, contentType: "image/png" }];
}

/** Generated at build time from the page title, description and theme accent. */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  const title = page?.seo.title ?? "Page Blocks";
  const description = page?.seo.description ?? "";
  const accent = page?.theme.accent ?? "#f2884b";
  const bg = page ? themeBackground(page.theme) : "#0c0d10";
  const fg = page ? themeForeground(page.theme) : "#f2f3f5";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: bg,
        color: fg,
        padding: "72px 80px",
        borderLeft: `24px solid ${accent}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: accent }} />
        <div style={{ fontSize: 28, opacity: 0.7 }}>{page?.title ?? "Page Blocks"}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1000 }}>
          {title}
        </div>
        {description ? (
          <div style={{ fontSize: 30, lineHeight: 1.35, opacity: 0.72, maxWidth: 960 }}>{description}</div>
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24 }}>
        <div
          style={{
            display: "flex",
            background: accent,
            color: accentForeground(accent),
            padding: "8px 18px",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {`/p/${slug}`}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
