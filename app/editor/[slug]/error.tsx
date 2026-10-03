"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { clearDraft } from "@/components/editor/storage";

/** If a stored draft breaks the editor, let the person drop it and start from the published page. */
export default function EditorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-sm font-semibold text-app-accent">Editor error</p>
      <h1 className="text-2xl font-semibold">The editor couldn&apos;t load this draft</h1>
      <p className="text-app-muted">
        The draft saved in this browser for <code className="text-app-fg">/p/{slug}</code> seems to be broken. Discard
        it to start again from the published version.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            clearDraft(slug);
            reset();
          }}
          className="rounded-md bg-app-accent px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          Discard local draft
        </button>
        <Link href="/" className="rounded-md border border-app-border px-4 py-2 text-sm hover:border-app-muted">
          All pages
        </Link>
      </div>
    </main>
  );
}
