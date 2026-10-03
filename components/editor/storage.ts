import type { DraftPage } from "./state";

const PREFIX = "page-blocks:draft:v1:";

/** Drafts live in localStorage: per browser, never sent to the server (sandbox). */
export function loadDraft(slug: string): DraftPage | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + slug);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPage;
    return parsed && Array.isArray(parsed.blocks) && parsed.slug === slug ? parsed : null;
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
