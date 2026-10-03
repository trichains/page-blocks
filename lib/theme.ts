import type { CSSProperties } from "react";
import type { Theme } from "@/lib/page-schema";

const PALETTES = {
  dark: { bg: "#0c0d10", surface: "#15171c", fg: "#f2f3f5", muted: "#a3a8b3", border: "#272a31" },
  light: { bg: "#fbfaf8", surface: "#ffffff", fg: "#15171c", muted: "#5a606b", border: "#e3e1dc" },
} as const;

const RADIUS: Record<Theme["radius"], string> = { none: "0px", small: "6px", medium: "12px", large: "20px" };

const FONTS: Record<Theme["fontPair"], { heading: string; body: string }> = {
  modern: { heading: "var(--font-inter)", body: "var(--font-inter)" },
  editorial: { heading: "var(--font-fraunces)", body: "var(--font-inter)" },
  technical: { heading: "var(--font-grotesk)", body: "var(--font-inter)" },
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Picks black or white text for a button filled with the accent color. */
export function accentForeground(accent: string): string {
  return contrastRatio(accent, "#0c0d10") >= contrastRatio(accent, "#ffffff") ? "#0c0d10" : "#ffffff";
}

/** CSS custom properties applied on the page root. Blocks only read these variables. */
export function themeStyle(theme: Theme): CSSProperties {
  const p = PALETTES[theme.background];
  const fonts = FONTS[theme.fontPair];
  return {
    "--pb-accent": theme.accent,
    "--pb-accent-fg": accentForeground(theme.accent),
    "--pb-bg": p.bg,
    "--pb-surface": p.surface,
    "--pb-fg": p.fg,
    "--pb-muted": p.muted,
    "--pb-border": p.border,
    "--pb-radius": RADIUS[theme.radius],
    "--pb-font-heading": fonts.heading,
    "--pb-font-body": fonts.body,
    colorScheme: theme.background,
  } as CSSProperties;
}

export const themeBackground = (theme: Theme) => PALETTES[theme.background].bg;
export const themeForeground = (theme: Theme) => PALETTES[theme.background].fg;
