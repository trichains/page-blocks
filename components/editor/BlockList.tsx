"use client";

import { useState } from "react";
import { blockDefinitions, getBlockDefinition } from "@/blocks/definitions";
import { Icon } from "@/components/Icon";
import type { DraftBlock, EditorAction } from "./state";

export type Selection = { kind: "page" } | { kind: "block"; index: number };

const iconButton =
  "inline-flex size-7 items-center justify-center rounded text-app-muted hover:bg-app-raised hover:text-app-fg disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-app-accent";

function summary(block: DraftBlock): string {
  const p = block.props as Record<string, unknown>;
  const text = p.headline ?? p.heading ?? p.label ?? p.brand ?? p.title;
  return typeof text === "string" && text ? text : block.id;
}

export function BlockList({
  blocks,
  selection,
  onSelect,
  dispatch,
  invalid,
}: {
  blocks: DraftBlock[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  dispatch: (a: EditorAction) => void;
  invalid: boolean[];
}) {
  const [adding, setAdding] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const selectedIndex = selection.kind === "block" ? selection.index : -1;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    dispatch({ type: "moveBlock", from, to });
    // Keep the same block selected when it, or a neighbour, moves.
    let next = selectedIndex;
    if (selectedIndex === from) next = to;
    else if (from < selectedIndex && selectedIndex <= to) next = selectedIndex - 1;
    else if (to <= selectedIndex && selectedIndex < from) next = selectedIndex + 1;
    if (next !== selectedIndex) onSelect({ kind: "block", index: next });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-app-border px-3 py-2">
        <h2 className="text-xs font-semibold tracking-wide text-app-muted uppercase">Blocks</h2>
        <button
          type="button"
          aria-expanded={adding}
          aria-controls="add-block-menu"
          onClick={() => setAdding((v) => !v)}
          className="rounded bg-app-accent px-2 py-1 text-xs font-semibold text-black hover:opacity-90"
        >
          {adding ? "Close" : "+ Add block"}
        </button>
      </div>

      {adding ? (
        <div id="add-block-menu" className="border-b border-app-border p-2">
          <p className="px-1 pb-2 text-[11px] text-app-muted">Inserted after the selected block.</p>
          <ul className="grid grid-cols-1 gap-1">
            {blockDefinitions.map((def) => (
              <li key={def.type}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-app-raised focus-visible:outline-2 focus-visible:outline-app-accent"
                  onClick={() => {
                    const index = selectedIndex >= 0 ? selectedIndex + 1 : blocks.length;
                    dispatch({ type: "addBlock", blockType: def.type, index });
                    onSelect({ kind: "block", index });
                    setAdding(false);
                  }}
                >
                  <Icon name={def.meta.icon} className="mt-0.5 size-4 shrink-0 text-app-accent" />
                  <span>
                    <span className="block text-sm">{def.meta.label}</span>
                    <span className="block text-[11px] leading-snug text-app-muted">{def.meta.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-2">
        <button
          type="button"
          aria-pressed={selection.kind === "page"}
          onClick={() => onSelect({ kind: "page" })}
          className={`mb-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
            selection.kind === "page"
              ? "bg-app-raised text-app-fg ring-1 ring-app-accent"
              : "text-app-muted hover:bg-app-raised"
          }`}
        >
          <Icon name="layers" className="size-4" />
          Page settings
        </button>

        <ol aria-label="Page blocks" className="space-y-1">
          {blocks.map((block, i) => {
            // Stable keys keep keyboard focus on the moved item; the suffix only appears for duplicate ids.
            const dupes = blocks.slice(0, i).filter((b) => b.id === block.id).length;
            const key = dupes ? `${block.id}~${dupes}` : block.id;
            const def = getBlockDefinition(block.type);
            const label = def?.meta.label ?? block.type;
            const selected = i === selectedIndex;
            return (
              <li
                key={key}
                draggable
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(i));
                }}
                onDragOver={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  setDropAt(i);
                }}
                onDragLeave={() => setDropAt((d) => (d === i ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) move(dragFrom, i);
                  setDragFrom(null);
                  setDropAt(null);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDropAt(null);
                }}
                className={`group rounded-md border ${
                  selected ? "border-app-accent bg-app-raised" : "border-transparent hover:bg-app-raised/60"
                } ${dropAt === i && dragFrom !== null && dragFrom !== i ? (dragFrom < i ? "border-b-2 border-b-app-accent" : "border-t-2 border-t-app-accent") : ""} ${dragFrom === i ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-1 px-1 py-1">
                  <span
                    title="Drag to reorder"
                    aria-hidden="true"
                    className="cursor-grab px-0.5 text-app-muted select-none active:cursor-grabbing"
                  >
                    ⋮⋮
                  </span>
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => onSelect({ kind: "block", index: i })}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-app-accent"
                  >
                    {def ? <Icon name={def.meta.icon} className="size-4 shrink-0 text-app-muted" /> : null}
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm">
                        {label}
                        {invalid[i] ? (
                          <span className="size-1.5 rounded-full bg-app-danger" aria-label="has errors" role="img" />
                        ) : null}
                      </span>
                      <span className="block truncate text-[11px] text-app-muted">{summary(block)}</span>
                    </span>
                  </button>
                </div>
                <div
                  className={`flex justify-end gap-0.5 px-1 pb-1 ${selected ? "" : "hidden group-focus-within:flex group-hover:flex"}`}
                >
                  <button
                    type="button"
                    className={iconButton}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                    aria-label={`Move ${label} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    disabled={i === blocks.length - 1}
                    onClick={() => move(i, i + 1)}
                    aria-label={`Move ${label} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => {
                      dispatch({ type: "duplicateBlock", index: i });
                      onSelect({ kind: "block", index: i + 1 });
                    }}
                    aria-label={`Duplicate ${label}`}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    className={`${iconButton} hover:text-app-danger`}
                    onClick={() => {
                      if (!window.confirm(`Delete the ${label} block "${block.id}"?`)) return;
                      dispatch({ type: "removeBlock", index: i });
                      if (selectedIndex >= i)
                        onSelect(
                          blocks.length > 1
                            ? { kind: "block", index: Math.max(0, selectedIndex - (selectedIndex === i ? 0 : 1)) }
                            : { kind: "page" },
                        );
                    }}
                    aria-label={`Delete ${label}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
