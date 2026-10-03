"use client";

import { useId, useState, type FormEvent } from "react";
import { t } from "@/lib/i18n";
import { track } from "@/lib/tracking";
import type { BlockRenderProps } from "../types";
import { Section, headingId } from "../ui";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "success" } | { kind: "error"; message: string };

const INPUT_ATTRS = {
  name: { type: "text", autoComplete: "name" },
  email: { type: "email", autoComplete: "email", inputMode: "email" },
  phone: { type: "tel", autoComplete: "tel", inputMode: "tel" },
} as const;

export function LeadForm({ id, props, ctx }: BlockRenderProps<"leadForm">) {
  const uid = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const preview = ctx.mode === "preview";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;
    const data = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      pageSlug: ctx.pageSlug,
      blockId: id,
      listId: props.listId,
      website: String(data.get("website") ?? ""),
    };
    for (const field of props.fields) {
      const value = String(data.get(field.name) ?? "").trim();
      if (value) payload[field.name] = value;
    }
    if (props.consentText) payload.consent = data.get("consent") === "on";

    setStatus({ kind: "submitting" });
    setFieldErrors({});
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus({ kind: "success" });
        track("lead_submit", { block: id, list: props.listId ?? null });
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
      if (body.fields) setFieldErrors(body.fields);
      setStatus({
        kind: "error",
        message: res.status === 429 ? t(ctx.locale, "errorRateLimit") : body.error || t(ctx.locale, "errorGeneric"),
      });
    } catch {
      setStatus({ kind: "error", message: t(ctx.locale, "errorGeneric") });
    }
  }

  return (
    <Section id={id} labelledBy={headingId(id)} innerClassName="max-w-xl">
      <div className="rounded-pb border border-pb-border bg-pb-surface p-6 @3xl:p-8">
        <h2
          id={headingId(id)}
          className="font-heading text-2xl font-semibold tracking-tight text-balance @3xl:text-3xl"
        >
          {props.heading}
        </h2>
        {props.text ? <p className="mt-3 leading-relaxed text-pb-muted text-pretty">{props.text}</p> : null}

        {/* Live region stays mounted so screen readers announce the message when it appears. */}
        <div role="status" aria-live="polite">
          {status.kind === "success" ? (
            <p
              ref={(el) => el?.focus()}
              tabIndex={-1}
              className="mt-6 rounded-pb border border-pb-accent px-4 py-4 leading-relaxed focus:outline-none"
            >
              {props.successMessage}
            </p>
          ) : null}
        </div>
        {status.kind === "success" ? null : (
          <form
            className="mt-6 space-y-4"
            onSubmit={onSubmit}
            noValidate={false}
            aria-describedby={status.kind === "error" ? `${uid}-error` : undefined}
          >
            {props.fields.map((field) => {
              const inputId = `${uid}-${field.name}`;
              const error = fieldErrors[field.name];
              return (
                <div key={field.name}>
                  <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
                    {field.label}
                    {!field.required ? (
                      <span className="font-normal text-pb-muted"> ({t(ctx.locale, "optional")})</span>
                    ) : null}
                  </label>
                  <input
                    id={inputId}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className="block min-h-11 w-full rounded-pb border border-pb-border bg-pb-bg px-3 text-base text-pb-fg placeholder:text-pb-muted/70 focus:border-pb-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-pb-accent/40"
                    {...INPUT_ATTRS[field.name]}
                  />
                  {error ? (
                    <p id={`${inputId}-error`} className="mt-1 text-sm text-red-500">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}

            {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={`${uid}-website`}>Website</label>
              <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {props.consentText ? (
              <div className="flex items-start gap-3">
                <input
                  id={`${uid}-consent`}
                  name="consent"
                  type="checkbox"
                  required
                  aria-invalid={fieldErrors.consent ? true : undefined}
                  aria-describedby={fieldErrors.consent ? `${uid}-consent-error` : undefined}
                  className="mt-1 size-4 shrink-0 accent-[var(--pb-accent)]"
                />
                <div>
                  <label htmlFor={`${uid}-consent`} className="text-sm leading-relaxed text-pb-muted">
                    {props.consentText}
                  </label>
                  {fieldErrors.consent ? (
                    <p id={`${uid}-consent-error`} className="mt-1 text-sm text-red-500">
                      {t(ctx.locale, "consentRequired")}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status.kind === "submitting" || preview}
              data-track="form_submit_click"
              data-track-label={props.submitLabel}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-pb bg-pb-accent px-6 font-semibold text-pb-accent-fg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.kind === "submitting" ? t(ctx.locale, "sending") : props.submitLabel}
            </button>

            {preview ? (
              <p className="text-center text-xs text-pb-muted">{t(ctx.locale, "previewFormDisabled")}</p>
            ) : null}
            {status.kind === "error" ? (
              <p id={`${uid}-error`} role="alert" className="text-sm text-red-500">
                {status.message}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </Section>
  );
}
