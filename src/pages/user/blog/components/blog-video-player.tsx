// ─── BlogVideoPlayer ──────────────────────────────────────────────────────────
// Cinematic video player using a styled HTML5 <video> element.
// Uses media.stream_url verbatim — signed query params are never modified.
// On onerror (e.g. expired signed URL), shows the ExpiredMediaCard.

import { useEffect, useState } from "react"
import type { BlogMedia } from "../types/user-blog.types"
import { ExpiredMediaCard } from "./blog-audio-player"

interface BlogVideoPlayerProps {
  media: BlogMedia
  onRefresh: () => void
}

export function BlogVideoPlayer({ media, onRefresh }: BlogVideoPlayerProps) {
  const [mediaError, setMediaError] = useState(false)

  // Reset error state when the caller provides a fresh signed URL
  useEffect(() => {
    setMediaError(false)
  }, [media.stream_url])

  if (mediaError) {
    return <ExpiredMediaCard onRefresh={onRefresh} />
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/40 ring-1 ring-white/[0.07]">
      {/* stream_url used verbatim; signed params preserved as-is */}
      <video
        controls
        src={media.stream_url}
        poster={media.thumbnail_url ?? undefined}
        className="aspect-video w-full"
        onError={() => setMediaError(true)}
        aria-label={media.name}
        preload="metadata"
      >
        Your browser does not support the video element.
      </video>
    </div>
  )
}
