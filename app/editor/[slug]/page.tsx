import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorLoader } from "@/components/editor/EditorLoader";
import { getPage, listSlugs } from "@/lib/content/pages";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/editor/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Editor: ${slug} · Page Blocks`, robots: { index: false, follow: false } };
}

/** The published document is embedded at build time; drafts are layered on top in the browser. */
export default async function EditorPage({ params }: PageProps<"/editor/[slug]">) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return <EditorLoader published={page} />;
}
