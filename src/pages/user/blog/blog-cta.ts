// ─── Blog CTA helper ──────────────────────────────────────────────────────────
// Call-to-action label for a blog card, tailored to the post's media type so the
// button reads "Watch Video" / "Listen Now" / "Read Article" instead of a
// generic "Read" for every post.

export function blogReadCta(
  mediaType: "Video" | "Audio" | null,
  short = false,
): string {
  if (mediaType === "Video") return short ? "Watch" : "Watch Video"
  if (mediaType === "Audio") return short ? "Listen" : "Listen Now"
  return short ? "Read" : "Read Article"
}
