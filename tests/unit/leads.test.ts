import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { leadSubmissionSchema } from "@/lib/lead-schema";
import { pageSchema } from "@/lib/page-schema";
import { checkAgainstForm, forwardLead, maskEmail, maskName, maskPhone, type StoredLead } from "@/lib/server/leads";

const webinar = pageSchema.parse(
  JSON.parse(readFileSync(path.join(process.cwd(), "content/pages/webinar.json"), "utf8")),
);
const lead = (over: Record<string, unknown> = {}) =>
  leadSubmissionSchema.parse({
    pageSlug: "webinar",
    blockId: "inscricao",
    name: "Ana",
    email: "ana@example.com",
    consent: true,
    ...over,
  });

const stored: StoredLead = {
  id: "lead-1",
  receivedAt: "2026-10-01T12:00:00.000Z",
  pageSlug: "webinar",
  blockId: "inscricao",
  email: "ana@example.com",
};

afterEach(() => vi.restoreAllMocks());

describe("lead submission", () => {
  it("validates email and phone format", () => {
    expect(leadSubmissionSchema.safeParse({ pageSlug: "webinar", blockId: "x", email: "nope" }).success).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ pageSlug: "webinar", blockId: "x", email: "a@b.co", phone: "abc" }).success,
    ).toBe(false);
    expect(
      leadSubmissionSchema.parse({ pageSlug: "webinar", blockId: "x", email: "a@b.co", phone: "" }).phone,
    ).toBeUndefined();
  });

  it("checks required fields and consent against the published form", () => {
    expect(checkAgainstForm(webinar, lead())).toMatchObject({ ok: true, form: { listId: "aula-checkout-nov26" } });
    const missing = checkAgainstForm(webinar, lead({ name: undefined, consent: false }));
    expect(missing).toMatchObject({
      ok: false,
      status: 422,
      fields: { name: expect.any(String), consent: expect.any(String) },
    });
  });

  it("rejects unknown pages and blocks that are not lead forms", () => {
    expect(checkAgainstForm(null, lead())).toMatchObject({ ok: false, status: 404 });
    expect(checkAgainstForm(webinar, lead({ blockId: "hero" }))).toMatchObject({ ok: false, status: 404 });
  });

  it("masks personal data for the sandbox listing", () => {
    expect(maskEmail("ana.souza@example.com")).toBe("an***@example.com");
    expect(maskPhone("(11) 91234-5678")).toBe("***5678");
    expect(maskPhone(undefined)).toBeUndefined();
    expect(maskName("Ana Paula Souza")).toBe("Ana S.");
    expect(maskName("Ana")).toBe("Ana");
  });
});

describe("webhook forwarding", () => {
  it("posts the lead as JSON with a request id", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    const result = await forwardLead(stored, { url: "https://hooks.example/lead", requestId: "req-1", fetchImpl });
    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://hooks.example/lead");
    expect((init.headers as Record<string, string>)["x-request-id"]).toBe("req-1");
    expect(JSON.parse(init.body as string)).toEqual({ event: "lead.created", lead: stored });
  });

  it("reports non-2xx responses as failures", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await forwardLead(stored, {
      url: "https://hooks.example/lead",
      requestId: "req-2",
      fetchImpl: async () => new Response("nope", { status: 500 }),
    });
    expect(result).toMatchObject({ ok: false, status: 500 });
  });

  it("gives up after the timeout and logs a structured error", async () => {
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((line: string) => errors.push(line));
    const hanging: typeof fetch = (_url, init) =>
      new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal!.reason)));
    const result = await forwardLead(stored, {
      url: "https://hooks.example/slow",
      requestId: "req-3",
      timeoutMs: 50,
      fetchImpl: hanging,
    });
    expect(result).toMatchObject({ ok: false, error: "timeout after 50ms" });
    const logged = JSON.parse(errors[0]);
    expect(logged).toMatchObject({ level: "error", event: "lead.webhook_failed", requestId: "req-3" });
  });
});
