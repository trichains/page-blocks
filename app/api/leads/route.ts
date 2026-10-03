import { NextResponse } from "next/server";
import { leadSubmissionSchema } from "@/lib/lead-schema";
import { getPage } from "@/lib/content/pages";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import {
  checkAgainstForm,
  forwardLead,
  listLeads,
  maskEmail,
  maskName,
  maskPhone,
  storeLead,
  type StoredLead,
} from "@/lib/server/leads";
import { log } from "@/lib/server/log";

// 5 submissions per IP per minute. In-memory: per instance, resets on cold start (see lib/rate-limit.ts).
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function POST(request: Request) {
  // Reuse an upstream request id only if it looks like one; never echo arbitrary client input into logs.
  const incomingId = request.headers.get("x-request-id");
  const requestId = incomingId && /^[\w-]{1,64}$/.test(incomingId) ? incomingId : crypto.randomUUID();
  const headers = { "x-request-id": requestId };
  const ip = clientIp(request.headers);

  const rate = limiter.check(ip);
  if (!rate.ok) {
    log("warn", "lead.rate_limited", { requestId, ip });
    return NextResponse.json(
      { error: "Too many submissions. Try again in a minute." },
      { status: 429, headers: { ...headers, "retry-after": String(Math.ceil(rate.retryAfterMs / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  // Honeypot filled: answer exactly like a real success (201 + id) so bots learn nothing, then drop it.
  // Checked on the raw body, before validation, so invalid bot payloads get the same answer.
  const honeypot = (body as { website?: unknown } | null)?.website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    log("info", "lead.honeypot", { requestId });
    return NextResponse.json({ ok: true, id: crypto.randomUUID() }, { status: 201, headers });
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fields[key] ??= issue.message;
    }
    log("info", "lead.invalid", { requestId, fields: Object.keys(fields) });
    return NextResponse.json({ error: "Please check the highlighted fields.", fields }, { status: 422, headers });
  }
  const lead = parsed.data;

  const check = checkAgainstForm(await getPage(lead.pageSlug), lead);
  if (!check.ok) {
    return NextResponse.json({ error: check.error, fields: check.fields }, { status: check.status, headers });
  }

  // Only keep what the published form asks for; listId comes from the page, never from the client.
  const asked = new Set(check.form.fields.map((field) => field.name));
  const stored: StoredLead = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    pageSlug: lead.pageSlug,
    blockId: lead.blockId,
    listId: check.form.listId,
    name: asked.has("name") ? lead.name : undefined,
    email: lead.email,
    phone: asked.has("phone") ? lead.phone : undefined,
    consent: check.form.consentText ? lead.consent : undefined,
  };

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  if (webhookUrl) {
    const result = await forwardLead(stored, { url: webhookUrl, requestId });
    if (!result.ok) {
      // The webhook is the system of record in production; tell the visitor so they can retry.
      return NextResponse.json({ error: "We couldn't save your details. Please try again." }, { status: 502, headers });
    }
  } else {
    storeLead(stored);
  }

  log("info", "lead.created", {
    requestId,
    leadId: stored.id,
    pageSlug: stored.pageSlug,
    blockId: stored.blockId,
    forwarded: Boolean(webhookUrl),
  });
  return NextResponse.json({ ok: true, id: stored.id }, { status: 201, headers });
}

/**
 * Sandbox only: lists leads held in memory, with name, email and phone masked.
 * Disabled when LEADS_WEBHOOK_URL is set, because then leads live in your automation.
 */
export async function GET() {
  if (process.env.LEADS_WEBHOOK_URL) {
    return NextResponse.json({ error: "Lead listing is only available in sandbox mode." }, { status: 404 });
  }
  return NextResponse.json({
    sandbox: true,
    note: "Demo endpoint. Leads are kept in server memory (max 200) and reset on cold start. Names, emails and phones are masked.",
    leads: listLeads().map((l) => ({
      ...l,
      name: maskName(l.name),
      email: maskEmail(l.email),
      phone: maskPhone(l.phone),
    })),
  });
}
