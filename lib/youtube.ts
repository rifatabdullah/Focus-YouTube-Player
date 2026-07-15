const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Returns an 11-character YouTube video ID from common URL shapes or raw input. */
export function parseYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (VIDEO_ID.test(value)) return value;

  try {
    const candidateUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidateUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    let candidate: string | null = null;

    if (host === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") candidate = url.searchParams.get("v");
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts"].includes(parts[0])) candidate = parts[1] ?? null;
      }
    }

    return candidate && VIDEO_ID.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}
