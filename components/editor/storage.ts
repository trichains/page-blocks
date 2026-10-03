import type { DraftPage } from "./state";

const PREFIX = "page-blocks:draft:v1:";

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Minimal structural check before a stored draft is handed to the editor. The draft may
 * be invalid content (that's what the editor is for), but it must have the shape the
 * editor code walks: blocks with string id/type and object props, seo/theme objects.
 */
export function isDraftShape(value: unknown, slug: string): value is DraftPage {
  if (!isObject(value) || value.slug !== slug) return false;
  if (!isObject(value.seo) || !isObject(value.theme)) return false;
  if (!Array.isArray(value.blocks)) return false;
  return value.blocks.every(
    (b) =>
      isObject(b) &&
      typeof b.id === "string" &&
      typeof b.type === "string" &&
      isObject(b.props) &&
      (b.visibility === undefined || isObject(b.visibility)),
  );
}

/** Drafts live in localStorage: per browser, never sent to the server (sandbox). */
export function loadDraft(slug: string): DraftPage | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + slug);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isDraftShape(parsed, slug)) return parsed;
    // Corrupted or from an older format: drop it rather than crash the editor.
    window.localStorage.removeItem(PREFIX + slug);
    return null;
  } catch {
    return null;
  }
}

export function saveDraft(page: DraftPage): void {
  try {
    window.localStorage.setItem(PREFIX + page.slug, JSON.stringify(page));
  } catch {
    // Storage full or blocked (private mode): the editor keeps working in memory.
  }
}

export function clearDraft(slug: string): void {
  try {
    window.localStorage.removeItem(PREFIX + slug);
  } catch {
    // ignore
  }
}
