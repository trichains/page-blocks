import Link from "next/link";
import { blockDefinitions } from "@/blocks/definitions";
import { Icon } from "@/components/Icon";
import { listPages } from "@/lib/content/pages";
import { GITHUB_URL } from "@/lib/site";

export default async function Home() {
  const pages = await listPages();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Page Blocks</p>
        <div className="flex items-center gap-3">
          <span
            className="rounded border border-app-accent/40 px-2 py-0.5 text-xs text-app-accent"
            title="Editor drafts live in your browser. Leads and events are kept in server memory."
          >
            Sandbox: drafts in your browser, leads in memory (reset on cold start)
          </span>
          <a href={GITHUB_URL} className="text-sm text-app-muted underline-offset-4 hover:text-app-fg hover:underline">
            GitHub
          </a>
        </div>
      </header>

      <section className="mt-12 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Landing pages from validated JSON, rendered as static HTML
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-app-muted">
          Each page is a JSON document in the repo. A registry of typed blocks (a zod schema plus a React Server
          Component each) validates and renders it at build time, so visitors get static HTML with JavaScript only for
          the video, form and countdown. The editor builds its forms from the same schemas.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/editor/launch"
            className="rounded-md bg-app-accent px-4 py-2 font-semibold text-black hover:opacity-90"
          >
            Open the editor
          </Link>
          <a href={GITHUB_URL} className="rounded-md border border-app-border px-4 py-2 hover:border-app-muted">
            Read the code
          </a>
        </div>
      </section>

      <section aria-labelledby="pages-title" className="mt-14">
        <h2 id="pages-title" className="text-xs font-semibold tracking-wide text-app-muted uppercase">
          Demo pages ({pages.length})
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {pages.map((p) => (
            <li key={p.slug} className="flex flex-col rounded-lg border border-app-border bg-app-panel p-5">
              <div className="flex items-center gap-2 text-xs text-app-muted">
                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: p.accent }} />
                <span>/p/{p.slug}</span>
                <span>·</span>
                <span>{p.locale}</span>
                <span>·</span>
                <span>{p.background}</span>
              </div>
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-app-muted">{p.description}</p>
              <p className="mt-3 text-xs text-app-muted">
                {p.blockTypes.length} blocks: {[...new Set(p.blockTypes)].join(", ")}
              </p>
              <div className="mt-4 flex gap-2 text-sm">
                <Link
                  href={`/p/${p.slug}`}
                  className="rounded-md border border-app-border px-3 py-1.5 hover:border-app-muted"
                >
                  View page
                </Link>
                <Link
                  href={`/editor/${p.slug}`}
                  className="rounded-md border border-app-border px-3 py-1.5 hover:border-app-muted"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="blocks-title" className="mt-14">
        <h2 id="blocks-title" className="text-xs font-semibold tracking-wide text-app-muted uppercase">
          Block registry ({blockDefinitions.length})
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {blockDefinitions.map((def) => (
            <li key={def.type} className="flex gap-3 rounded-lg border border-app-border p-3">
              <Icon name={def.meta.icon} className="mt-0.5 size-4 shrink-0 text-app-accent" />
              <div>
                <p className="text-sm font-medium">
                  {def.meta.label} <code className="text-xs text-app-muted">{def.type}</code>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-app-muted">{def.meta.description}</p>
                <p className="mt-1 text-[11px] text-app-muted">
                  {def.meta.interactive ? "Client component" : "Server only, no JS"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="sandbox-title"
        className="mt-14 rounded-lg border border-app-border p-5 text-sm leading-relaxed text-app-muted"
      >
        <h2 id="sandbox-title" className="font-semibold text-app-fg">
          What the sandbox does
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Editor drafts are saved in your browser&apos;s localStorage. Export the JSON and commit it to publish.
          </li>
          <li>
            Lead form submissions are validated and kept in server memory. See them (masked) at{" "}
            <a className="text-app-fg underline" href="/api/leads">
              /api/leads
            </a>
            .
          </li>
          <li>
            Click tracking goes to an in-memory sink at{" "}
            <a className="text-app-fg underline" href="/api/events">
              /api/events
            </a>
            . Both reset when the server restarts.
          </li>
        </ul>
      </section>

      <footer className="mt-14 border-t border-app-border pt-6 text-xs text-app-muted">
        Built by Cristhian Almeida · MIT license ·{" "}
        <a className="underline" href={GITHUB_URL}>
          trichains/page-blocks
        </a>
      </footer>
    </main>
  );
}
