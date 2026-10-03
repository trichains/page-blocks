import { Fragment, type ReactNode } from "react";
import { externalLinkProps } from "@/blocks/ui";
import { parseMarkdown, type MdInline } from "@/lib/markdown";

/** Renders the markdown subset as React elements. No dangerouslySetInnerHTML anywhere. */
export function Markdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className="space-y-4 text-lg leading-relaxed text-pretty">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          const Tag = `h${block.level}` as "h2" | "h3" | "h4";
          const size = block.level === 2 ? "text-2xl" : block.level === 3 ? "text-xl" : "text-lg";
          return (
            <Tag key={i} className={`font-heading pt-2 font-semibold tracking-tight ${size}`}>
              {renderInline(block.children)}
            </Tag>
          );
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={i}
              className={`space-y-1.5 pl-6 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-pb-muted`}
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </Tag>
          );
        }
        return <p key={i}>{renderInline(block.children)}</p>;
      })}
    </div>
  );
}

function renderInline(nodes: MdInline[]): ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return <Fragment key={i}>{node.value}</Fragment>;
      case "strong":
        return (
          <strong key={i} className="font-semibold">
            {renderInline(node.children)}
          </strong>
        );
      case "em":
        return <em key={i}>{renderInline(node.children)}</em>;
      case "code":
        return (
          <code key={i} className="rounded bg-pb-surface px-1.5 py-0.5 font-mono text-[0.9em]">
            {node.value}
          </code>
        );
      case "link":
        return (
          <a
            key={i}
            href={node.href}
            className="text-pb-accent underline underline-offset-4"
            {...externalLinkProps(node.href)}
          >
            {renderInline(node.children)}
          </a>
        );
    }
  });
}
