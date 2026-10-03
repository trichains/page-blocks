"use client";

import dynamic from "next/dynamic";
import type { PageDocument } from "@/lib/page-schema";

// The editor reads localStorage on first render, so it only renders in the browser.
const Editor = dynamic(() => import("./Editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center text-sm text-app-muted" role="status">
      Loading editor...
    </div>
  ),
});

export function EditorLoader({ published }: { published: PageDocument }) {
  return <Editor published={published} />;
}
