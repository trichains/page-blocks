/**
 * A deliberately small markdown subset for the `richText` block.
 *
 * Supported: paragraphs, headings (#, ##, ###), unordered (-, *) and ordered (1.) lists,
 * **bold**, *italic* / _italic_, `inline code`, [links](https://...), backslash escapes.
 *
 * Not supported on purpose: raw HTML, images, tables, code fences. The parser outputs
 * an AST that is rendered with React elements, so any `<tag>` in the source ends up as
 * escaped text. Links are kept only for http(s), mailto, #anchor and /path targets.
 */

export type MdInline =
  | { type: "text"; value: string }
  | { type: "strong"; children: MdInline[] }
  | { type: "em"; children: MdInline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: MdInline[] };

export type MdBlock =
  | { type: "heading"; level: 2 | 3 | 4; children: MdInline[] }
  | { type: "paragraph"; children: MdInline[] }
  | { type: "list"; ordered: boolean; items: MdInline[][] };

// Local paths may not start with "//" or "/\" (browsers treat both as protocol-relative).
const SAFE_HREF = /^(https?:\/\/[^\s]+|mailto:[^\s]+|#[\w-]*|\/(?![/\\])[^\s\\]*)$/i;

export function isSafeHref(href: string): boolean {
  return SAFE_HREF.test(href.trim());
}

export function parseMarkdown(source: string): MdBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items.map(parseInline) });
      list = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(4, Math.max(2, heading[1].length + (heading[1].length === 1 ? 1 : 0))) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, children: parseInline(heading[2]) });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d{1,3}[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function parseInline(text: string): MdInline[] {
  const out: MdInline[] = [];
  let buffer = "";
  const pushText = () => {
    if (buffer) {
      const last = out[out.length - 1];
      if (last?.type === "text") last.value += buffer;
      else out.push({ type: "text", value: buffer });
      buffer = "";
    }
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (ch === "\\" && i + 1 < text.length && /[\\`*_[\]()#\-!.]/.test(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        pushText();
        out.push({ type: "code", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        pushText();
        out.push({ type: "strong", children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    if (ch === "*" || ch === "_") {
      const end = text.indexOf(ch, i + 1);
      const inner = end > i + 1 ? text.slice(i + 1, end) : "";
      // Avoid treating snake_case words or "2 * 3" as emphasis.
      const prev = text[i - 1];
      if (inner && !/\s/.test(inner[0]) && !/\s/.test(inner[inner.length - 1]) && (!prev || !/\w/.test(prev))) {
        pushText();
        out.push({ type: "em", children: parseInline(inner) });
        i = end + 1;
        continue;
      }
    }

    if (ch === "[") {
      const close = findClosingBracket(text, i);
      if (close !== -1 && text[close + 1] === "(") {
        const end = text.indexOf(")", close + 2);
        if (end !== -1) {
          const label = text.slice(i + 1, close);
          const href = text.slice(close + 2, end).trim();
          pushText();
          if (isSafeHref(href)) {
            out.push({ type: "link", href, children: parseInline(label) });
          } else {
            // Unsafe target (javascript:, data:, //host…): keep the label, drop the link.
            out.push(...parseInline(label));
          }
          i = end + 1;
          continue;
        }
      }
    }

    buffer += ch;
    i++;
  }
  pushText();
  return mergeText(out);
}

function findClosingBracket(text: string, open: number): number {
  let depth = 0;
  for (let j = open; j < text.length; j++) {
    if (text[j] === "\\") {
      j++;
      continue;
    }
    if (text[j] === "[") depth++;
    else if (text[j] === "]") {
      depth--;
      if (depth === 0) return j;
    }
  }
  return -1;
}

function mergeText(nodes: MdInline[]): MdInline[] {
  const merged: MdInline[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === "text" && last?.type === "text") last.value += node.value;
    else merged.push(node);
  }
  return merged;
}
