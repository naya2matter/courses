// ─── BlogVideoPlayer ──────────────────────────────────────────────────────────
// Styled HTML5 <video> player with optional quality switching and VTT subtitles.
// Quality switcher: swaps the src and seeks back to the saved position via
// loadedmetadata so the resume is precise even with range-based streaming.
// Subtitle: rendered as a native <track> — the browser shows its own CC button.

import { useEffect, useRef, useState } from "react"
import type { BlogMedia } from "../types/user-blog.types"
import { ExpiredMediaCard } from "./blog-audio-player"

interface BlogVideoPlayerProps {
  media: BlogMedia
  onRefresh: () => void
}

export function BlogVideoPlayer({ media, onRefresh }: BlogVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mediaError, setMediaError] = useState(false)
  const [activeUrl, setActiveUrl] = useState(media.stream_url)
  const [activeQuality, setActiveQuality] = useState("auto")
  // Holds the position to seek to after a quality-switch src reload
  const pendingSeekRef = useRef<number | null>(null)

  const qualities = media.qualities ?? []

  // Reset player state when caller provides fresh signed URLs (expired media refresh)
  useEffect(() => {
    setMediaError(false)
    setActiveUrl(media.stream_url)
    setActiveQuality("auto")
    pendingSeekRef.current = null
  }, [media.stream_url])

  function switchQuality(streamUrl: string, quality: string) {
    // Save current position before the src changes
    pendingSeekRef.current = videoRef.current?.currentTime ?? 0
    setActiveUrl(streamUrl)
    setActiveQuality(quality)
  }

  function handleLoadedMetadata() {
    const el = videoRef.current
    if (!el || pendingSeekRef.current === null) return
    const pos = pendingSeekRef.current
    pendingSeekRef.current = null
    if (pos > 0 && pos < el.duration) {
      el.currentTime = pos
    }
    void el.play().catch(() => {})
  }

  if (mediaError) {
    return <ExpiredMediaCard onRefresh={onRefresh} />
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/[0.07]">
      {/* Quality selector — only rendered when quality variants exist */}
      {qualities.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.03] px-4 py-2">
          <span className="mr-1 text-[11px] font-medium text-white/35">Quality</span>
          <button
            type="button"
            onClick={() => switchQuality(media.stream_url, "auto")}
            className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              activeQuality === "auto"
                ? "bg-indigo-500/80 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Auto
          </button>
          {qualities.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => switchQuality(q.stream_url, q.quality)}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                activeQuality === q.quality
                  ? "bg-indigo-500/80 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {q.quality}
            </button>
          ))}
        </div>
      )}

      {/* stream_url / activeUrl used verbatim; signed params preserved as-is */}
      <video
        ref={videoRef}
        controls
        src={activeUrl}
        poster={media.thumbnail_url ?? undefined}
        className="aspect-video w-full"
        onError={() => setMediaError(true)}
        onLoadedMetadata={handleLoadedMetadata}
        aria-label={media.name}
        preload="metadata"
      >
        {/* Subtitle track — browser renders its own CC button when present */}
        {media.subtitle_url && (
          <track
            kind="subtitles"
            src={media.subtitle_url}
            srcLang="ar"
            label="Arabic"
            default
          />
        )}
        Your browser does not support the video element.
      </video>
    </div>
  )
}
