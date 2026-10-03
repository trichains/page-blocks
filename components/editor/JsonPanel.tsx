"use client";

import { useState } from "react";
import { validatePage, type ValidationIssue } from "@/lib/page-schema";
import type { DraftPage } from "./state";

/**
 * Raw JSON view. Edits apply to the draft as soon as the text is valid JSON that passes
 * the page schema; until then the draft (and preview) keep the last valid state.
 */
export function JsonPanel({ page, onApply }: { page: DraftPage; onApply: (page: DraftPage) => void }) {
  const [text, setText] = useState(() => JSON.stringify(page, null, 2));
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>(() => {
    const result = validatePage(page);
    return result.ok ? [] : result.issues;
  });

  const onChange = (next: string) => {
    setText(next);
    let json: unknown;
    try {
      json = JSON.parse(next);
    } catch (error) {
      setSyntaxError((error as Error).message);
      setIssues([]);
      return;
    }
    setSyntaxError(null);
    const result = validatePage(json);
    if (!result.ok) {
      setIssues(result.issues);
      return;
    }
    if (result.page.slug !== page.slug) {
      setIssues([{ path: "slug", message: `The slug is fixed to "${page.slug}" in this editor` }]);
      return;
    }
    setIssues([]);
    onApply(json as DraftPage);
  };

  const ok = !syntaxError && issues.length === 0;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-app-border px-3 py-2 text-xs">
        <label htmlFor="json-editor" className="font-semibold tracking-wide text-app-muted uppercase">
          Page document (JSON)
        </label>
        <span role="status" className={ok ? "text-emerald-400" : "text-app-danger"}>
          {syntaxError
            ? "Invalid JSON"
            : issues.length
              ? `${issues.length} issue${issues.length > 1 ? "s" : ""}, not applied`
              : "Valid, applied"}
        </span>
      </div>
      <textarea
        id="json-editor"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-invalid={!ok}
        aria-describedby="json-errors"
        className="min-h-[50vh] flex-1 resize-none bg-app-bg p-3 font-mono text-xs leading-relaxed text-app-fg focus:outline-none"
      />
      <div id="json-errors" className="max-h-40 overflow-y-auto border-t border-app-border px-3 py-2 text-xs">
        {syntaxError ? <p className="text-app-danger">{syntaxError}</p> : null}
        {issues.length ? (
          <ul className="space-y-1">
            {issues.slice(0, 30).map((issue, i) => (
              <li key={i} className="text-app-danger">
                <code className="text-app-fg">{issue.path || "(root)"}</code> {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
        {ok ? (
          <p className="text-app-muted">Edits are validated with the same zod schema used by the build and CI.</p>
        ) : null}
      </div>
    </div>
  );
}
