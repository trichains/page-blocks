export type VideoSource = { provider: "youtube" | "vimeo"; id: string };

const YOUTUBE = [
  /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})(?:[&#].*)?$/i,
  /^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/(?:embed|shorts|live)\/([\w-]{11})(?:[?#].*)?$/i,
  /^https?:\/\/youtu\.be\/([\w-]{11})(?:[?#].*)?$/i,
];
const VIMEO = [
  /^https?:\/\/(?:www\.)?vimeo\.com\/(\d{6,12})(?:[/?#].*)?$/i,
  /^https?:\/\/player\.vimeo\.com\/video\/(\d{6,12})(?:[?#].*)?$/i,
];

/** Extracts provider + id from a YouTube or Vimeo URL. Returns null for anything else. */
export function parseVideoUrl(url: string): VideoSource | null {
  const trimmed = url.trim();
  for (const re of YOUTUBE) {
    const m = trimmed.match(re);
    if (m) return { provider: "youtube", id: m[1] };
  }
  for (const re of VIMEO) {
    const m = trimmed.match(re);
    if (m) return { provider: "vimeo", id: m[1] };
  }
  return null;
}

/**
 * Embed URL used only after the visitor clicks play. `autoplay=1` here starts the
 * video the visitor just asked for; nothing plays on page load.
 */
export function embedUrl(source: VideoSource): string {
  if (source.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0`;
  }
  return `https://player.vimeo.com/video/${source.id}?autoplay=1&dnt=1`;
}
