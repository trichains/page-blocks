import type { PageDocument } from "@/lib/page-schema";
import type { LeadSubmission } from "@/lib/lead-schema";
import type { PropsOf } from "@/blocks/definitions";
import { log } from "./log";

export type StoredLead = {
  id: string;
  receivedAt: string;
  pageSlug: string;
  blockId: string;
  listId?: string;
  name?: string;
  email: string;
  phone?: string;
  consent?: boolean;
};

const MAX_STORED = 200;

/** In-memory sandbox store. Survives dev hot reloads via globalThis; resets on cold start. */
const store = ((globalThis as { __pbLeads?: StoredLead[] }).__pbLeads ??= []);

export function storeLead(lead: StoredLead): void {
  store.unshift(lead);
  if (store.length > MAX_STORED) store.length = MAX_STORED;
}

export function listLeads(): StoredLead[] {
  return [...store];
}

export function clearLeads(): void {
  store.length = 0;
}

/** "ana.souza@example.com" -> "an***@example.com" for the public sandbox listing. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `***${digits.slice(-4)}` : "***";
}

/**
 * Checks the submission against the published form config: the block must exist, be a
 * leadForm, and every field it marks as required must be present.
 */
export function checkAgainstForm(
  page: PageDocument | null,
  lead: LeadSubmission,
): { ok: true } | { ok: false; status: number; error: string; fields?: Record<string, string> } {
  if (!page) return { ok: false, status: 404, error: "Unknown page" };
  const block = page.blocks.find((b) => b.id === lead.blockId);
  if (!block || block.type !== "leadForm") return { ok: false, status: 404, error: "Unknown form" };
  const props = block.props as PropsOf<"leadForm">;
  const fields: Record<string, string> = {};
  for (const field of props.fields) {
    if (field.required && !lead[field.name]) fields[field.name] = `${field.label} is required`;
  }
  if (props.consentText && lead.consent !== true) fields.consent = "Consent is required";
  if (Object.keys(fields).length)
    return { ok: false, status: 422, error: "Please check the highlighted fields.", fields };
  return { ok: true };
}

/**
 * Forwards a lead to LEADS_WEBHOOK_URL (Zapier, Make, Google Apps Script, n8n...).
 * Bounded by a timeout so a slow automation can't hang the form.
 */
export async function forwardLead(
  lead: StoredLead,
  {
    url,
    timeoutMs = 5000,
    requestId,
    fetchImpl = fetch,
  }: { url: string; timeoutMs?: number; requestId: string; fetchImpl?: typeof fetch },
): Promise<{ ok: boolean; status?: number; error?: string; durationMs: number }> {
  const started = Date.now();
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": requestId, "user-agent": "page-blocks/1.0" },
      body: JSON.stringify({ event: "lead.created", lead }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const durationMs = Date.now() - started;
    log(res.ok ? "info" : "warn", "lead.webhook", { requestId, leadId: lead.id, status: res.status, durationMs });
    return { ok: res.ok, status: res.status, durationMs };
  } catch (error) {
    const durationMs = Date.now() - started;
    const message =
      (error as Error).name === "TimeoutError" ? `timeout after ${timeoutMs}ms` : (error as Error).message;
    log("error", "lead.webhook_failed", { requestId, leadId: lead.id, error: message, durationMs });
    return { ok: false, error: message, durationMs };
  }
}
