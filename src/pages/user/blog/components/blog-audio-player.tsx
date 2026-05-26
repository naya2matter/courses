// ─── BlogAudioPlayer ──────────────────────────────────────────────────────────
// Premium custom audio player with:
//   • Album-art thumbnail + episode metadata
//   • Seekable progress bar (pointer over hidden range input)
//   • Play / pause, skip ±15 s, mute toggle
//   • Time / duration display
//   • Expired-URL error card with Refresh button
//
// IMPORTANT: media.stream_url is used verbatim as the HTML5 <audio> src.
// The signed query params (expires, signature) must never be modified.

import { useEffect, useRef, useState } from "react"
import {
  AlertCircleIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BlogMedia } from "../types/user-blog.types"

// ── Expired card (also exported for use by BlogVideoPlayer) ──────────────────

export function ExpiredMediaCard({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
        <AlertCircleIcon className="size-5 text-amber-400" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-300">Streaming link expired</p>
        <p className="text-xs text-amber-400/60">
          This streaming link expired. Refresh the page to generate a new secure link.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
      >
        <RefreshCwIcon className="size-3.5" aria-hidden="true" />
        Refresh Media
      </Button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BlogAudioPlayerProps {
  media: BlogMedia
  onRefresh: () => void
}

export function BlogAudioPlayer({ media, onRefresh }: BlogAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(media.duration ?? 0)
  const [isMuted, setIsMuted] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [mediaError, setMediaError] = useState(false)

  // Reset player state when the signed URL refreshes
  useEffect(() => {
    setMediaError(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setIsBuffering(false)
  }, [media.stream_url])

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
    } else {
      void el.play()
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current
    if (!el) return
    const t = Number(e.target.value)
    el.currentTime = t
    setCurrentTime(t)
  }

  function skipBy(secs: number) {
    const el = audioRef.current
    if (!el) return
    const dur = isFinite(el.duration) ? el.duration : 0
    el.currentTime = Math.max(0, Math.min(dur, el.currentTime + secs))
  }

  function toggleMute() {
    const el = audioRef.current
    if (!el) return
    const next = !isMuted
    el.muted = next
    setIsMuted(next)
  }

  if (mediaError) {
    return <ExpiredMediaCard onRefresh={onRefresh} />
  }

  const dur = duration > 0 ? duration : 0
  const progressPct = dur > 0 ? Math.min(100, (currentTime / dur) * 100) : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-sm">
      {/* Header: thumbnail + metadata */}
      <div className="flex gap-4 p-5 sm:gap-5 sm:p-6">
        {/* Album art */}
        <div className="size-20 shrink-0 overflow-hidden rounded-xl shadow-lg sm:size-24">
          {media.thumbnail_url ? (
            <img
              src={media.thumbnail_url}
              alt={media.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-amber-500/25 to-orange-600/25 flex items-center justify-center">
              <MicIcon className="size-7 text-amber-400/80" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
            Audio Episode
          </p>
          <p className="line-clamp-2 font-semibold leading-snug text-white">
            {media.name}
          </p>
          {dur > 0 && (
            <p className="mt-0.5 text-xs text-white/35">{fmtTime(Math.round(dur))}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Progress track */}
        <div className="space-y-1.5">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            {/* Filled portion */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              style={{ width: `${progressPct}%` }}
            />
            {/* Invisible range input covers the track for click/drag seeking */}
            <input
              type="range"
              min={0}
              max={dur || 1}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Seek audio position"
            />
          </div>
          <div className="flex justify-between text-[10px] tabular-nums text-white/30">
            <span>{fmtTime(currentTime)}</span>
            <span>{dur > 0 ? fmtTime(Math.round(dur)) : "—"}</span>
          </div>
        </div>

        {/* Button row */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => skipBy(-15)}
            className="flex size-9 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/80"
            aria-label="Skip back 15 seconds"
          >
            <SkipBackIcon className="size-4" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <RefreshCwIcon className="size-5 animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <PauseIcon className="size-5" fill="currentColor" />
            ) : (
              <PlayIcon className="size-5 translate-x-0.5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => skipBy(15)}
            className="flex size-9 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/80"
            aria-label="Skip forward 15 seconds"
          >
            <SkipForwardIcon className="size-4" />
          </button>

          <button
            onClick={toggleMute}
            className="ml-1 flex size-9 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/80"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeXIcon className="size-4" />
            ) : (
              <Volume2Icon className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Hidden audio element — stream_url used verbatim; signed params preserved */}
      <audio
        ref={audioRef}
        src={media.stream_url}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          const el = audioRef.current
          if (el) setCurrentTime(el.currentTime)
        }}
        onDurationChange={() => {
          const el = audioRef.current
          if (el && isFinite(el.duration)) setDuration(el.duration)
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => setMediaError(true)}
        aria-label={media.name}
      />
    </div>
  )
}
