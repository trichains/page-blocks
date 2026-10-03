import type { IconName } from "@/blocks/shared";

/** Small inline stroke icon set (24x24). Inline SVG keeps pages free of icon-font requests. */
const PATHS: Record<IconName, string[]> = {
  bolt: ["M13 2 4 14h7l-1 8 9-12h-7l1-8z"],
  shield: ["M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3z", "m9 12 2 2 4-4"],
  chart: ["M4 20V10", "M10 20V4", "M16 20v-7", "M22 20H2"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
  layers: ["m12 3 9 5-9 5-9-5 9-5z", "m3 13 9 5 9-5", "m3 17 9 5 9-5"],
  users: [
    "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 20v-1a4 4 0 0 0-3-3.9",
    "M16 3.1a4 4 0 0 1 0 7.8",
  ],
  check: ["M20 6 9 17l-5-5"],
  mail: ["M3 5h18v14H3z", "m3 6 9 7 9-7"],
  code: ["m16 18 6-6-6-6", "m8 6-6 6 6 6"],
  globe: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M2 12h20", "M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"],
  card: ["M2 6h20v12H2z", "M2 10h20", "M6 15h4"],
  refresh: ["M21 12a9 9 0 0 1-15.5 6.2L3 16", "M3 12a9 9 0 0 1 15.5-6.2L21 8", "M21 3v5h-5", "M3 21v-5h5"],
  lock: ["M5 11h14v10H5z", "M8 11V7a4 4 0 0 1 8 0v4"],
  play: ["M7 4v16l13-8L7 4z"],
  message: ["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"],
  calendar: ["M3 5h18v16H3z", "M3 10h18", "M8 3v4", "M16 3v4"],
  tag: ["M3 12V3h9l9 9-9 9-9-9z", "M7.5 7.5h.01"],
  text: ["M4 6h16", "M4 12h16", "M4 18h10"],
  image: ["M3 4h18v16H3z", "m3 16 5-5 4 4 3-3 6 6", "M15 9h.01"],
  list: ["M9 6h12", "M9 12h12", "M9 18h12", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
  form: ["M4 4h16v16H4z", "M8 9h8", "M8 13h8", "M8 17h4"],
  timer: ["M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M12 10v4l2 2", "M9 2h6"],
  help: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3", "M12 17h.01"],
  megaphone: ["M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z", "M15 8a5 5 0 0 1 0 8", "M18 5a9 9 0 0 1 0 14"],
  footer: ["M3 4h18v16H3z", "M3 15h18"],
};

export function Icon({ name, className, label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={24}
      height={24}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
