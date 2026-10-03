"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getBlockDefinition } from "@/blocks/definitions";
import { blockIdSchema, visibilitySchema } from "@/blocks/shared";
import { pageSettingsSchema, validatePage, type PageDocument } from "@/lib/page-schema";
import { z } from "zod";
import { BlockList, type Selection } from "./BlockList";
import { JsonPanel } from "./JsonPanel";
import { formSchemaFor } from "./json-schema";
import { Preview, type Device } from "./Preview";
import { SchemaForm } from "./SchemaForm";
import { SeoPanel } from "./SeoPanel";
import { editorReducer, type DraftPage } from "./state";
import { clearDraft, loadDraft, saveDraft } from "./storage";
import { previewLocale, previewTheme, validateDraft } from "./validation";

type Tab = "design" | "json" | "seo";

const blockSettingsSchema = z.object({
  id: blockIdSchema.meta({ label: "Block ID", description: "Also the #anchor for links, e.g. #pricing" }),
  visibility: visibilitySchema.meta({ label: "Visibility" }),
});

const toolbarButton =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-app-border px-2.5 text-xs font-medium text-app-fg hover:border-app-muted focus-visible:outline-2 focus-visible:outline-app-accent disabled:cursor-not-allowed disabled:opacity-50";

export function Editor({ published }: { published: PageDocument }) {
  const publishedDraft = published as unknown as DraftPage;
  // Rendered client-only (see EditorLoader), so reading localStorage in the initializer is safe.
  const [page, dispatch] = useReducer(editorReducer, publishedDraft, (initial) => loadDraft(initial.slug) ?? initial);
  const [selection, setSelection] = useState<Selection>({ kind: "block", index: 0 });
  const [tab, setTab] = useState<Tab>("design");
  const [device, setDevice] = useState<Device>("desktop");
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Bumped when the draft is replaced from outside the JSON tab (import/reset) to remount it.
  const [revision, setRevision] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const validation = useMemo(() => validateDraft(page), [page]);
  const isDirty = useMemo(() => JSON.stringify(page) !== JSON.stringify(published), [page, published]);

  useEffect(() => {
    const t = window.setTimeout(() => (isDirty ? saveDraft(page) : clearDraft(page.slug)), 250);
    return () => window.clearTimeout(t);
  }, [page, isDirty]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const sel: Selection =
    selection.kind === "block" && selection.index >= page.blocks.length
      ? page.blocks.length
        ? { kind: "block", index: page.blocks.length - 1 }
        : { kind: "page" }
      : selection;
  const selectedBlock = sel.kind === "block" ? page.blocks[sel.index] : undefined;
  const selectedDef = selectedBlock ? getBlockDefinition(selectedBlock.type) : undefined;

  function exportJson() {
    if (
      !validation.valid &&
      !window.confirm(`The draft has ${validation.issues.length} validation issue(s). Export anyway?`)
    )
      return;
    const blob = new Blob([`${JSON.stringify(page, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.slug}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice({ tone: "info", text: `Downloaded ${page.slug}.json. Commit it to content/pages to publish.` });
  }

  async function importJson(file: File) {
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      setNotice({ tone: "error", text: `${file.name} is not valid JSON.` });
      return;
    }
    if (json && typeof json === "object") (json as { slug?: unknown }).slug = page.slug;
    const result = validatePage(json);
    if (!result.ok) {
      const first = result.issues[0];
      setNotice({
        tone: "error",
        text: `Import rejected: ${result.issues.length} issue(s). First: ${first.path || "(root)"} ${first.message}`,
      });
      return;
    }
    dispatch({ type: "replace", page: json as DraftPage });
    setRevision((r) => r + 1);
    setSelection({ kind: "block", index: 0 });
    setNotice({ tone: "info", text: `Imported ${file.name}.` });
  }

  function resetToPublished() {
    if (!window.confirm("Discard the local draft and go back to the published version?")) return;
    dispatch({ type: "replace", page: structuredClone(publishedDraft) });
    setRevision((r) => r + 1);
    clearDraft(page.slug);
    setSelection({ kind: "block", index: 0 });
    setNotice({ tone: "info", text: "Draft discarded. Showing the published version." });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "design", label: "Design" },
    { id: "json", label: "JSON" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <div className="flex min-h-dvh flex-col xl:h-dvh xl:min-h-[640px] bg-app-bg text-app-fg">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-app-border px-4 py-2">
        <Link href="/" className="text-sm font-semibold">
          Page Blocks
        </Link>
        <span className="text-app-border">/</span>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium">
            {typeof page.title === "string" ? page.title : page.slug}{" "}
            <span className="text-app-muted">· /p/{page.slug}</span>
          </h1>
        </div>
        <span
          className="rounded border border-app-accent/40 px-1.5 py-0.5 text-[11px] text-app-accent"
          title="Drafts are stored in this browser's localStorage and never sent to the server."
        >
          Sandbox: draft saved in this browser
        </span>
        <span
          role="status"
          aria-live="polite"
          className={`text-xs ${validation.valid ? "text-app-muted" : "text-app-danger"}`}
        >
          {validation.valid
            ? isDirty
              ? "Valid draft, unpublished changes"
              : "Matches published"
            : `${validation.issues.length} issue(s)`}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJson(file);
              e.target.value = "";
            }}
          />
          <button type="button" className={toolbarButton} onClick={() => fileInput.current?.click()}>
            Import JSON
          </button>
          <button type="button" className={toolbarButton} onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className={toolbarButton} onClick={resetToPublished} disabled={!isDirty}>
            Reset to published
          </button>
          <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" className={toolbarButton}>
            View published
          </a>
          <button
            type="button"
            disabled
            aria-describedby="publish-note"
            className="inline-flex h-8 items-center rounded-md bg-app-accent px-3 text-xs font-semibold text-black disabled:opacity-40"
          >
            Publish
          </button>
          <span id="publish-note" className="sr-only">
            Disabled in the sandbox. In production, Publish would call a Server Action that saves the document through a
            PageRepository (git commit, CMS or database) and triggers a rebuild.
          </span>
        </div>
      </header>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`border-b px-4 py-1.5 text-xs ${notice.tone === "error" ? "border-app-danger/40 text-app-danger" : "border-app-border text-app-muted"}`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="grid flex-1 xl:min-h-0 xl:grid-cols-[minmax(560px,640px)_1fr]">
        <div className="flex min-h-0 flex-col border-b border-app-border xl:border-r xl:border-b-0">
          <div
            role="tablist"
            aria-label="Editor views"
            className="flex gap-1 border-b border-app-border px-2 pt-2"
            onKeyDown={(e) => {
              const i = tabs.findIndex((t) => t.id === tab);
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % tabs.length
                  : e.key === "ArrowLeft"
                    ? (i - 1 + tabs.length) % tabs.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? tabs.length - 1
                        : -1;
              if (next === -1) return;
              e.preventDefault();
              setTab(tabs[next].id);
              document.getElementById(`tab-${tabs[next].id}`)?.focus();
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={tab === t.id ? `panel-${t.id}` : undefined}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={`rounded-t-md border-b-2 px-3 py-1.5 text-sm ${tab === t.id ? "border-app-accent text-app-fg" : "border-transparent text-app-muted hover:text-app-fg"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="h-[75vh] min-h-0 flex-1 xl:h-auto"
          >
            {tab === "design" ? (
              <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[220px_1fr] sm:grid-rows-1">
                <div className="max-h-[40vh] min-h-0 overflow-y-auto border-b sm:max-h-none border-app-border sm:border-r sm:border-b-0">
                  <BlockList
                    blocks={page.blocks}
                    selection={sel}
                    onSelect={setSelection}
                    dispatch={dispatch}
                    invalid={page.blocks.map(
                      (_, i) =>
                        Object.keys(validation.blockPropErrors[i] ?? {}).length +
                          Object.keys(validation.blockSettingsErrors[i] ?? {}).length >
                        0,
                    )}
                  />
                </div>
                <div className="min-h-0 overflow-y-auto p-4">
                  {sel.kind === "page" ? (
                    <>
                      <h2 className="mb-3 text-xs font-semibold tracking-wide text-app-muted uppercase">
                        Page settings
                      </h2>
                      <SchemaForm
                        schema={formSchemaFor(pageSettingsSchema)}
                        value={{ title: page.title, locale: page.locale, theme: page.theme }}
                        errors={validation.settingsErrors}
                        idPrefix="settings"
                        onChange={(v) =>
                          dispatch({
                            type: "setSettings",
                            settings: v as { title: unknown; locale: unknown; theme: Record<string, unknown> },
                          })
                        }
                      />
                    </>
                  ) : selectedBlock && selectedDef ? (
                    <>
                      <div className="mb-3">
                        <h2 className="text-sm font-semibold">{selectedDef.meta.label}</h2>
                        <p className="text-xs text-app-muted">{selectedDef.meta.description}</p>
                      </div>
                      <SchemaForm
                        key={`${sel.index}-${selectedBlock.type}`}
                        schema={formSchemaFor(selectedDef.props)}
                        value={selectedBlock.props}
                        errors={validation.blockPropErrors[sel.index] ?? {}}
                        idPrefix={`block-${sel.index}`}
                        onChange={(props) => dispatch({ type: "setBlockProps", index: sel.index, props })}
                      />
                      <details
                        className="mt-6 rounded-md border border-app-border p-3"
                        open={settingsOpen || Object.keys(validation.blockSettingsErrors[sel.index] ?? {}).length > 0}
                        onToggle={(e) => setSettingsOpen(e.currentTarget.open)}
                      >
                        <summary className="cursor-pointer text-xs font-semibold text-app-muted">
                          Block settings
                        </summary>
                        <div className="mt-3">
                          <SchemaForm
                            schema={formSchemaFor(blockSettingsSchema)}
                            value={{
                              id: selectedBlock.id,
                              visibility: selectedBlock.visibility ?? { hideOnMobile: false, hideOnDesktop: false },
                            }}
                            errors={validation.blockSettingsErrors[sel.index] ?? {}}
                            idPrefix={`block-${sel.index}-settings`}
                            onChange={(v) =>
                              dispatch({
                                type: "setBlockSettings",
                                index: sel.index,
                                id: String(v.id ?? ""),
                                visibility: v.visibility as
                                  { hideOnMobile?: boolean; hideOnDesktop?: boolean } | undefined,
                              })
                            }
                          />
                        </div>
                      </details>
                    </>
                  ) : selectedBlock ? (
                    <p className="text-sm text-app-danger">
                      Unknown block type &quot;{selectedBlock.type}&quot;. Fix it in the JSON tab.
                    </p>
                  ) : (
                    <p className="text-sm text-app-muted">Add a block to get started.</p>
                  )}
                </div>
              </div>
            ) : tab === "json" ? (
              <JsonPanel key={revision} page={page} onApply={(next) => dispatch({ type: "replace", page: next })} />
            ) : (
              <SeoPanel
                page={page}
                errors={validation.seoErrors}
                onChange={(seo) => dispatch({ type: "setSeo", seo })}
              />
            )}
          </div>
        </div>

        <div className="flex h-[85vh] flex-col xl:h-auto xl:min-h-0">
          <div className="flex items-center justify-between border-b border-app-border px-3 py-2">
            <span className="text-xs font-semibold tracking-wide text-app-muted uppercase">Preview</span>
            <div role="group" aria-label="Preview width" className="flex rounded-md border border-app-border p-0.5">
              {(["mobile", "desktop"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  onClick={() => setDevice(d)}
                  className={`rounded px-2.5 py-1 text-xs capitalize ${device === d ? "bg-app-raised text-app-fg" : "text-app-muted hover:text-app-fg"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <Preview
              slug={page.slug}
              locale={previewLocale(page, published.locale)}
              theme={previewTheme(page, published.theme)}
              blocks={validation.renderable}
              device={device}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
