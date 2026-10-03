import { getBlockDefinition, type Block } from "@/blocks/definitions";
import type { InvalidBlock, RenderableBlock } from "@/components/PageRenderer";
import {
  formatPath,
  pageSchema,
  themeSchema,
  LOCALES,
  type Locale,
  type Theme,
  type ValidationIssue,
} from "@/lib/page-schema";
import type { FieldErrors } from "./SchemaForm";
import type { DraftPage } from "./state";

export type DraftValidation = {
  valid: boolean;
  issues: ValidationIssue[];
  /** Errors per block, keyed by path relative to `props` (matches SchemaForm paths). */
  blockPropErrors: FieldErrors[];
  /** Errors on block id / type / visibility. */
  blockSettingsErrors: FieldErrors[];
  settingsErrors: FieldErrors;
  seoErrors: FieldErrors;
  renderable: RenderableBlock[];
};

/** Runs the same zod schema the build uses and splits issues by editor panel. */
export function validateDraft(page: DraftPage): DraftValidation {
  const result = pageSchema.safeParse(page);
  const blockPropErrors: FieldErrors[] = page.blocks.map(() => ({}));
  const blockSettingsErrors: FieldErrors[] = page.blocks.map(() => ({}));
  const settingsErrors: FieldErrors = {};
  const seoErrors: FieldErrors = {};
  const issues: ValidationIssue[] = [];

  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path as (string | number)[];
      issues.push({ path: formatPath(path), message: issue.message });
      const [head, index, sub, ...rest] = path;
      if (head === "blocks" && typeof index === "number" && blockPropErrors[index]) {
        if (sub === "props") blockPropErrors[index][formatPath(rest)] ??= issue.message;
        else blockSettingsErrors[index][formatPath(sub === undefined ? ["type"] : [sub, ...rest])] ??= issue.message;
      } else if (head === "seo") {
        seoErrors[formatPath(path.slice(1))] ??= issue.message;
      } else {
        settingsErrors[formatPath(path)] ??= issue.message;
      }
    }
  }

  const renderable: RenderableBlock[] = page.blocks.map((block, i) => {
    const def = getBlockDefinition(block.type);
    if (!def)
      return {
        invalid: true,
        id: block.id || `block-${i}`,
        type: block.type,
        issues: [`Unknown block type "${block.type}"`],
      } satisfies InvalidBlock;
    const parsed = def.schema.safeParse(block);
    if (parsed.success) return parsed.data as Block;
    return {
      invalid: true,
      id: block.id || `block-${i}`,
      type: block.type,
      issues: parsed.error.issues.map((x) => `${formatPath(x.path)}: ${x.message}`),
    };
  });

  return { valid: result.success, issues, blockPropErrors, blockSettingsErrors, settingsErrors, seoErrors, renderable };
}

/** Theme/locale used for the preview: the draft's when valid, otherwise the published one. */
export function previewTheme(page: DraftPage, fallback: Theme): Theme {
  const parsed = themeSchema.safeParse(page.theme);
  return parsed.success ? parsed.data : fallback;
}

export function previewLocale(page: DraftPage, fallback: Locale): Locale {
  return (LOCALES as readonly unknown[]).includes(page.locale) ? (page.locale as Locale) : fallback;
}
