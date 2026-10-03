import { z } from "zod";

/**
 * Subset of JSON Schema produced by `z.toJSONSchema`, plus the custom keys we attach
 * with `.meta()` (label, multiline, itemLabel). The editor form is generated from this.
 */
export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: (string | number)[];
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  format?: string;
  pattern?: string;
  label?: string;
  description?: string;
  multiline?: boolean;
  itemLabel?: string;
};

const cache = new WeakMap<z.ZodType, JsonSchema>();

/** Converts a zod schema to JSON Schema once (input shape: defaults make fields optional). */
export function formSchemaFor(schema: z.ZodType): JsonSchema {
  let json = cache.get(schema);
  if (!json) {
    json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as JsonSchema;
    cache.set(schema, json);
  }
  return json;
}

export function schemaType(schema: JsonSchema): string | undefined {
  return Array.isArray(schema.type) ? schema.type.find((t) => t !== "null") : schema.type;
}

/** A starting value for a new array item or an optional object the user just enabled. */
export function emptyValue(schema: JsonSchema): unknown {
  if (schema.default !== undefined) return structuredClone(schema.default);
  if (schema.enum?.length) return schema.enum[0];
  switch (schemaType(schema)) {
    case "object": {
      const out: Record<string, unknown> = {};
      const required = new Set(schema.required ?? []);
      for (const [key, child] of Object.entries(schema.properties ?? {})) {
        if (required.has(key) || child.default !== undefined) out[key] = emptyValue(child);
      }
      return out;
    }
    case "array":
      return [];
    case "boolean":
      return false;
    case "number":
    case "integer":
      return schema.minimum ?? 0;
    default:
      return "";
  }
}

export function humanize(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
