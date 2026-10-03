import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/PageRenderer";
import { Tracker } from "@/components/Tracker";
import { getPage, listSlugs } from "@/lib/content/pages";

// Only slugs that exist in content/pages are valid; anything else is a 404 at the edge.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  const { seo } = page;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/p/${page.slug}` },
    robots: seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      title: seo.title,
      description: seo.description,
      locale: page.locale.replace("-", "_"),
      url: `/p/${page.slug}`,
      // Without a custom image, the sibling opengraph-image.tsx file supplies one.
      ...(seo.ogImage ? { images: [{ url: seo.ogImage.src }] } : {}),
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  };
}

export default async function Page({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <main>
      <PageRenderer slug={page.slug} locale={page.locale} theme={page.theme} blocks={page.blocks} />
      <Tracker slug={page.slug} events={page.tracking?.events} />
    </main>
  );
}
