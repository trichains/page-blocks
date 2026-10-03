"use client";

import type { ReactNode } from "react";
import { formatPath } from "@/lib/page-schema";
import { emptyValue, humanize, schemaType, type JsonSchema } from "./json-schema";

type Path = (string | number)[];
export type FieldErrors = Record<string, string>;

type FieldProps = {
  schema: JsonSchema;
  value: unknown;
  path: Path;
  label: string;
  required: boolean;
  errors: FieldErrors;
  idPrefix: string;
  onChange: (value: unknown) => void;
};

const inputClass =
  "block w-full rounded-md border border-app-border bg-app-bg px-2.5 py-1.5 text-sm text-app-fg placeholder:text-app-muted/60 focus:border-app-accent focus:outline-none aria-[invalid=true]:border-app-danger";

const smallButton =
  "inline-flex h-7 items-center justify-center rounded border border-app-border px-2 text-xs text-app-muted hover:border-app-muted hover:text-app-fg disabled:cursor-not-allowed disabled:opacity-40";

function fieldId(prefix: string, path: Path) {
  return `${prefix}-${formatPath(path) || "root"}`.replace(/[^\w-]/g, "_");
}

/** Free-text strings allowed to be longer than this get a textarea (unless `multiline` says so already). */
const TEXTAREA_THRESHOLD = 600;

/**
 * Form generated from a JSON Schema (itself generated from the block's zod schema):
 * strings -> input/textarea, enums -> select, booleans -> switch, numbers -> number input,
 * objects -> fieldsets, arrays -> repeatable groups. Errors come from zod, keyed by path.
 */
export function SchemaForm({
  schema,
  value,
  onChange,
  errors,
  idPrefix,
}: {
  schema: JsonSchema;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  errors: FieldErrors;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <ObjectFields schema={schema} value={value} path={[]} errors={errors} idPrefix={idPrefix} onChange={onChange} />
    </div>
  );
}

function ObjectFields({
  schema,
  value,
  path,
  errors,
  idPrefix,
  onChange,
}: {
  schema: JsonSchema;
  value: Record<string, unknown>;
  path: Path;
  errors: FieldErrors;
  idPrefix: string;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const required = new Set(schema.required ?? []);
  return (
    <>
      {Object.entries(schema.properties ?? {}).map(([key, child]) => (
        <Field
          key={key}
          schema={child}
          value={value?.[key]}
          path={[...path, key]}
          label={child.label ?? humanize(key)}
          required={required.has(key)}
          errors={errors}
          idPrefix={idPrefix}
          onChange={(next) => {
            const copy = { ...(value ?? {}) };
            if (next === undefined) delete copy[key];
            else copy[key] = next;
            onChange(copy);
          }}
        />
      ))}
    </>
  );
}

function Field(props: FieldProps) {
  const { schema } = props;
  const type = schemaType(schema);
  if (schema.enum) return <EnumField {...props} />;
  if (type === "boolean") return <BooleanField {...props} />;
  if (type === "number" || type === "integer") return <NumberField {...props} />;
  if (type === "object") return <ObjectField {...props} />;
  if (type === "array") return <ArrayField {...props} />;
  return <StringField {...props} />;
}

function FieldShell({
  id,
  label,
  required,
  description,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  description?: string;
  error?: string;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-app-fg">
          {label}
          {!required ? <span className="font-normal text-app-muted"> · optional</span> : null}
        </label>
        {counter ? <span className="text-[11px] text-app-muted tabular-nums">{counter}</span> : null}
      </div>
      {children}
      {description && !error ? (
        <p id={`${id}-desc`} className="mt-1 text-xs text-app-muted">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-app-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, description?: string) {
  if (error) return `${id}-error`;
  if (description) return `${id}-desc`;
  return undefined;
}

function StringField({ schema, value, path, label, required, errors, idPrefix, onChange }: FieldProps) {
  const id = fieldId(idPrefix, path);
  const error = errors[formatPath(path)];
  const text = typeof value === "string" ? value : "";
  const multiline =
    schema.multiline || (!schema.pattern && !schema.format && (schema.maxLength ?? 0) > TEXTAREA_THRESHOLD);
  const counter = schema.maxLength && schema.maxLength >= 60 ? `${text.length}/${schema.maxLength}` : undefined;
  const common = {
    id,
    value: text,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy(id, error, schema.description),
    onChange: (e: { target: { value: string } }) => {
      const next = e.target.value;
      // Optional fields are removed when emptied so `.optional()` validates.
      onChange(next === "" && !required ? undefined : next);
    },
  };

  if (schema.format === "color") {
    return (
      <FieldShell id={id} label={label} required={required} description={schema.description} error={error}>
        <div className="flex gap-2">
          <input
            type="color"
            aria-label={`${label} picker`}
            value={/^#[0-9a-f]{6}$/i.test(text) ? text : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 shrink-0 cursor-pointer rounded border border-app-border bg-app-bg"
          />
          <input {...common} className={`${inputClass} font-mono`} spellCheck={false} />
        </div>
      </FieldShell>
    );
  }

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      description={schema.description}
      error={error}
      counter={counter}
    >
      {multiline ? (
        <textarea
          {...common}
          rows={Math.min(10, Math.max(3, Math.ceil(text.length / 60)))}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      ) : (
        <input {...common} type="text" className={inputClass} />
      )}
    </FieldShell>
  );
}

function EnumField({ schema, value, path, label, required, errors, idPrefix, onChange }: FieldProps) {
  const id = fieldId(idPrefix, path);
  const error = errors[formatPath(path)];
  const current = value ?? schema.default ?? "";
  const allowEmpty = !required && schema.default === undefined;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required || schema.default !== undefined}
      description={schema.description}
      error={error}
    >
      <select
        id={id}
        value={String(current)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, schema.description)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" && allowEmpty) return onChange(undefined);
          const match = schema.enum!.find((opt) => String(opt) === raw);
          onChange(match);
        }}
        className={inputClass}
      >
        {allowEmpty ? <option value="">-</option> : null}
        {schema.enum!.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {String(opt)}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function BooleanField({ schema, value, path, label, errors, idPrefix, onChange }: FieldProps) {
  const id = fieldId(idPrefix, path);
  const error = errors[formatPath(path)];
  const checked = Boolean(value ?? schema.default ?? false);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span id={`${id}-label`} className="text-xs font-medium text-app-fg">
          {label}
        </span>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${
            checked ? "border-app-accent bg-app-accent" : "border-app-border bg-app-raised"
          }`}
        >
          <span
            className={`inline-block size-3.5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-app-danger">{error}</p> : null}
    </div>
  );
}

function NumberField({ schema, value, path, label, required, errors, idPrefix, onChange }: FieldProps) {
  const id = fieldId(idPrefix, path);
  const error = errors[formatPath(path)];
  const max = schema.maximum !== undefined && schema.maximum < Number.MAX_SAFE_INTEGER ? schema.maximum : undefined;
  return (
    <FieldShell id={id} label={label} required={required} description={schema.description} error={error}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={schema.minimum}
        max={max}
        step={schemaType(schema) === "integer" ? 1 : "any"}
        value={
          typeof value === "number"
            ? value
            : value === undefined && typeof schema.default === "number"
              ? schema.default
              : ""
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, schema.description)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(undefined);
          const n = Number(raw);
          onChange(Number.isNaN(n) ? undefined : n);
        }}
        className={`${inputClass} max-w-40 tabular-nums`}
      />
    </FieldShell>
  );
}

function ObjectField({ schema, value, path, label, required, errors, idPrefix, onChange }: FieldProps) {
  const error = errors[formatPath(path)];
  const present = value !== undefined && value !== null;
  if (!present) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-app-border px-3 py-2">
        <span className="text-xs text-app-muted">{label}</span>
        <button type="button" className={smallButton} onClick={() => onChange(emptyValue(schema))}>
          Add
        </button>
      </div>
    );
  }
  return (
    <fieldset className="rounded-md border border-app-border p-3">
      <legend className="flex items-center gap-2 px-1 text-xs font-semibold text-app-fg">
        {label}
        {!required ? (
          <button
            type="button"
            className="text-[11px] font-normal text-app-muted underline hover:text-app-fg"
            onClick={() => onChange(undefined)}
          >
            remove
          </button>
        ) : null}
      </legend>
      {schema.description ? <p className="mb-2 text-xs text-app-muted">{schema.description}</p> : null}
      <div className="space-y-3">
        <ObjectFields
          schema={schema}
          value={value as Record<string, unknown>}
          path={path}
          errors={errors}
          idPrefix={idPrefix}
          onChange={(next) => onChange(next)}
        />
      </div>
      {error ? <p className="mt-2 text-xs text-app-danger">{error}</p> : null}
    </fieldset>
  );
}

function ArrayField({ schema, value, path, label, required, errors, idPrefix, onChange }: FieldProps) {
  const items = Array.isArray(value) ? value : [];
  const itemSchema = schema.items ?? {};
  const itemLabel = schema.itemLabel ?? "Item";
  const error = errors[formatPath(path)];
  const canAdd = schema.maxItems === undefined || items.length < schema.maxItems;
  const canRemove = items.length > (schema.minItems ?? 0);
  const isObjectItem = schemaType(itemSchema) === "object";

  const update = (next: unknown[]) =>
    onChange(next.length === 0 && !required && schema.default === undefined ? undefined : next);
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update(next);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 flex w-full items-baseline justify-between text-xs font-semibold text-app-fg">
        <span>
          {label}{" "}
          <span className="font-normal text-app-muted">
            ({items.length}
            {schema.maxItems ? `/${schema.maxItems}` : ""})
          </span>
        </span>
      </legend>
      {items.map((item, i) => {
        const itemPath = [...path, i];
        const controls = (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className={smallButton}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
              aria-label={`Move ${itemLabel} ${i + 1} up`}
            >
              ↑
            </button>
            <button
              type="button"
              className={smallButton}
              disabled={i === items.length - 1}
              onClick={() => move(i, i + 1)}
              aria-label={`Move ${itemLabel} ${i + 1} down`}
            >
              ↓
            </button>
            <button
              type="button"
              className={smallButton}
              disabled={!canRemove}
              onClick={() => update(items.filter((_, j) => j !== i))}
              aria-label={`Remove ${itemLabel} ${i + 1}`}
            >
              ✕
            </button>
          </div>
        );
        if (isObjectItem) {
          return (
            <div key={i} className="rounded-md border border-app-border bg-app-raised/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-app-muted">
                  {itemLabel} {i + 1}
                </span>
                {controls}
              </div>
              <div className="space-y-3">
                <ObjectFields
                  schema={itemSchema}
                  value={item as Record<string, unknown>}
                  path={itemPath}
                  errors={errors}
                  idPrefix={idPrefix}
                  onChange={(next) => update(items.map((it, j) => (j === i ? next : it)))}
                />
              </div>
              {errors[formatPath(itemPath)] ? (
                <p className="mt-2 text-xs text-app-danger">{errors[formatPath(itemPath)]}</p>
              ) : null}
            </div>
          );
        }
        const id = fieldId(idPrefix, itemPath);
        const itemError = errors[formatPath(itemPath)];
        return (
          <div key={i}>
            <div className="flex items-center gap-2">
              <label htmlFor={id} className="sr-only">
                {itemLabel} {i + 1}
              </label>
              <input
                id={id}
                type="text"
                value={typeof item === "string" ? item : ""}
                aria-invalid={itemError ? true : undefined}
                onChange={(e) => update(items.map((it, j) => (j === i ? e.target.value : it)))}
                className={inputClass}
              />
              {controls}
            </div>
            {itemError ? <p className="mt-1 text-xs text-app-danger">{itemError}</p> : null}
          </div>
        );
      })}
      <button
        type="button"
        className={`${smallButton} w-full border-dashed`}
        disabled={!canAdd}
        onClick={() => update([...items, emptyValue(itemSchema)])}
      >
        + Add {itemLabel.toLowerCase()}
      </button>
      {error ? <p className="text-xs text-app-danger">{error}</p> : null}
    </fieldset>
  );
}
