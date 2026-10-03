import type { BlockRenderProps } from "../types";

export function Footer({ id, props }: BlockRenderProps<"footer">) {
  return (
    <footer id={id} data-block-id={id} className="border-t border-pb-border px-5 py-10 @3xl:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 @3xl:flex-row @3xl:items-start @3xl:justify-between">
        <div className="max-w-sm">
          <p className="font-heading font-semibold">{props.brand}</p>
          {props.text ? <p className="mt-2 text-sm leading-relaxed text-pb-muted">{props.text}</p> : null}
        </div>
        {props.links.length ? (
          <nav aria-label={`${props.brand} links`}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {props.links.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="text-pb-muted underline-offset-4 hover:text-pb-fg hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
      {props.legal ? <p className="mx-auto mt-8 w-full max-w-6xl text-xs text-pb-muted">{props.legal}</p> : null}
    </footer>
  );
}
