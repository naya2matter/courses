// ─── BlogMediaBadge ───────────────────────────────────────────────────────────

const MEDIA_CLASSES = {
  Video: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Audio: "bg-sky-500/15 text-sky-400 border-sky-500/30",
} as const

export function BlogMediaBadge({
  mediaType,
}: {
  mediaType: "Video" | "Audio" | null | undefined
}) {
  if (!mediaType) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Text
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${MEDIA_CLASSES[mediaType]}`}
    >
      {mediaType}
    </span>
  )
}
