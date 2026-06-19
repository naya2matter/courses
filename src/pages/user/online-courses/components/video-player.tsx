// ─── Online Course Video Player ───────────────────────────────────────────────
// Streams a signed media URL directly in a native <video> (the signed URL needs
// no auth header and supports HTTP Range seeking out of the box). All engagement
// events are forwarded to the parent's learning-session handlers.
//
// Quality switching: swaps <video> src while saving the current playback
// position; the position is restored in handleLoadedMetadata after the new
// source loads, then playback resumes automatically.
//
// Subtitles: rendered as a native <track> — the browser renders its own CC
// button. No custom UI required.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  VolumeXIcon,
  Maximize2Icon,
  SkipBackIcon,
  SkipForwardIcon,
  GaugeIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { VideoQuality } from "../types/user-online-courses.types"

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0")
}
function clockTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

interface Props {
  src: string
  resumePosition: number
  qualities?: VideoQuality[]
  subtitleUrl?: string | null
  onPlay: () => void
  onPause: () => void
  onSeek: (from: number, to: number) => void
  onSpeedChange: () => void
  onFullscreen: () => void
  onTimeUpdate: (position: number, duration: number) => void
  onEnded: () => void
}

export function VideoPlayer({
  src,
  resumePosition,
  qualities = [],
  subtitleUrl,
  onPlay,
  onPause,
  onSeek,
  onSpeedChange,
  onFullscreen,
  onTimeUpdate,
  onEnded,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [buffered, setBuffered] = useState(0)
  const [showSubtitles, setShowSubtitles] = useState(true)

  // Quality / active URL state
  const [activeUrl, setActiveUrl] = useState(src)
  const [activeQuality, setActiveQuality] = useState("auto")
  // Holds the playback position to restore after a quality-switch src reload
  const qualitySwitchSeekRef = useRef<number | null>(null)

  const lastTimeRef = useRef(0)
  const seekingRef = useRef(false)
  const resumedRef = useRef(false)

  // Auto-hide controls while playing
  const [controlsVisible, setControlsVisible] = useState(true)
  const isPlayingRef = useRef(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Seek to the saved resume position once metadata is available.
  // Also handles restoring position after a quality switch.
  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    setDuration(el.duration)

    if (qualitySwitchSeekRef.current !== null) {
      // Quality switch — restore position and resume playback
      const pos = qualitySwitchSeekRef.current
      qualitySwitchSeekRef.current = null
      if (pos > 0 && pos < el.duration) {
        el.currentTime = pos
        setCurrentTime(pos)
        lastTimeRef.current = pos
      }
      void el.play().catch(() => {})
    } else if (!resumedRef.current && resumePosition > 0 && resumePosition < el.duration) {
      // Initial resume from saved progress
      el.currentTime = resumePosition
      setCurrentTime(resumePosition)
      lastTimeRef.current = resumePosition
      resumedRef.current = true
    } else {
      resumedRef.current = true
    }
  }, [resumePosition])

  function handleTimeUpdateInternal() {
    const el = videoRef.current
    if (!el) return
    setCurrentTime(el.currentTime)
    if (!seekingRef.current) lastTimeRef.current = el.currentTime
    if (el.buffered.length > 0) setBuffered(el.buffered.end(el.buffered.length - 1))
    onTimeUpdate(el.currentTime, el.duration || duration)
  }

  function nudgeControls() {
    setControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (isPlayingRef.current) {
      hideTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current) setControlsVisible(false)
      }, 3000)
    }
  }

  function handlePlayInternal() {
    setIsPlaying(true)
    isPlayingRef.current = true
    nudgeControls()
    onPlay()
  }
  function handlePauseInternal() {
    setIsPlaying(false)
    isPlayingRef.current = false
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setControlsVisible(true)
    onPause()
  }
  function handleSeeking() {
    seekingRef.current = true
  }
  function handleSeeked() {
    const el = videoRef.current
    if (!el) return
    const from = lastTimeRef.current
    const to = el.currentTime
    seekingRef.current = false
    lastTimeRef.current = to
    if (Math.abs(to - from) > 0.5) onSeek(from, to)
  }
  function handleRateChange() {
    const el = videoRef.current
    if (!el) return
    setPlaybackRate(el.playbackRate)
    onSpeedChange()
  }
  function handleEndedInternal() {
    setIsPlaying(false)
    isPlayingRef.current = false
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setControlsVisible(true)
    onEnded()
  }

  function togglePlay() {
    const el = videoRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }
  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = videoRef.current
    if (!el) return
    const time = Number(e.target.value)
    el.currentTime = time
    setCurrentTime(time)
  }
  function skipFixed(seconds: number) {
    const el = videoRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + seconds))
  }
  function toggleMute() {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setIsMuted(el.muted)
  }
  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = videoRef.current
    if (!el) return
    const vol = Number(e.target.value)
    el.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }
  function cycleSpeed() {
    const el = videoRef.current
    if (!el) return
    const idx = PLAYBACK_SPEEDS.indexOf(playbackRate)
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length]
    el.playbackRate = next // triggers ratechange → handleRateChange
  }
  function toggleFullscreen() {
    const node = containerRef.current
    if (!node) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void node.requestFullscreen?.()
  }

  // Quality switch: save position, swap src, restore position in loadedmetadata
  function switchQuality(streamUrl: string, quality: string) {
    qualitySwitchSeekRef.current = videoRef.current?.currentTime ?? 0
    setActiveUrl(streamUrl)
    setActiveQuality(quality)
  }

  // Sync subtitle track visibility with the toggle state
  useEffect(() => {
    const el = videoRef.current
    if (!el || !subtitleUrl) return
    for (const track of Array.from(el.textTracks)) {
      track.mode = showSubtitles ? "showing" : "hidden"
    }
  }, [showSubtitles, subtitleUrl])

  // Count entering-fullscreen toggles for the attention score.
  useEffect(() => {
    function onFsChange() {
      if (document.fullscreenElement === containerRef.current) onFullscreen()
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [onFullscreen])

  const seekMax = duration > 0 ? duration : 100
  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      onMouseMove={nudgeControls}
      onMouseLeave={() => { if (isPlayingRef.current) setControlsVisible(false) }}
      className={`group relative w-full overflow-hidden rounded-2xl bg-black ${isPlaying && !controlsVisible ? "cursor-none" : ""}`}
    >
      {/* Quality bar — always visible, above the video */}
      {qualities.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-black px-4 py-2.5">
          <span className="mr-1 text-[11px] font-medium text-white/35">Quality</span>
          <button
            type="button"
            onClick={() => switchQuality(src, "auto")}
            className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              activeQuality === "auto" ? "bg-indigo-500/80 text-white" : "text-white/40 hover:text-white/70"
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
                activeQuality === q.quality ? "bg-indigo-500/80 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {q.quality}
            </button>
          ))}
        </div>
      )}

      {/* Video — relative wrapper so the controls overlay positions correctly */}
      <div className="relative">
        <video
          ref={videoRef}
          src={activeUrl}
          className="aspect-video w-full bg-black"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdateInternal}
          onPlay={handlePlayInternal}
          onPause={handlePauseInternal}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onRateChange={handleRateChange}
          onEnded={handleEndedInternal}
          onClick={togglePlay}
          playsInline
          preload="metadata"
        >
          {subtitleUrl && (
            <track
              kind="subtitles"
              src={subtitleUrl}
              srcLang="ar"
              label="Arabic"
              default
            />
          )}
        </video>

        {/* Controls overlay — auto-hides 3 s after last interaction while playing */}
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          {/* Seek bar */}
          <div className="relative mb-2">
            <div className="absolute inset-y-1/2 h-1 w-full -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
              <div className="absolute h-full rounded-full bg-white/25" style={{ width: `${bufferedPct}%` }} />
              <div className="absolute h-full rounded-full bg-indigo-500" style={{ width: `${playedPct}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={seekMax}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              aria-label="Seek"
              className="relative z-10 h-3 w-full cursor-pointer appearance-none bg-transparent
                [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow"
            />
          </div>

          <div className="flex items-center gap-2 text-white">
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              {isPlaying
                ? <PauseIcon className="size-4.5" fill="currentColor" />
                : <PlayIcon className="size-4.5 translate-x-px" fill="currentColor" />}
            </button>

            <Button variant="ghost" size="icon" onClick={() => skipFixed(-10)}
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white" title="Back 10s">
              <SkipBackIcon className="size-4" fill="currentColor" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skipFixed(10)}
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white" title="Forward 10s">
              <SkipForwardIcon className="size-4" fill="currentColor" />
            </Button>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" onClick={toggleMute}
                className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white">
                {isMuted || volume === 0 ? <VolumeXIcon className="size-4" /> : <Volume2Icon className="size-4" />}
              </Button>
              <input
                type="range" min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                className="hidden h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/20 accent-indigo-500 sm:block
                  [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            <span className="ml-1 text-xs font-medium tabular-nums text-white/80">
              {clockTime(currentTime)} <span className="text-white/40">/ {clockTime(duration)}</span>
            </span>

            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={cycleSpeed}
                className="h-8 gap-1 rounded-full px-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white" title="Playback speed">
                <GaugeIcon className="size-3.5" />{playbackRate}x
              </Button>

              {/* CC toggle — only when a subtitle track is provided */}
              {subtitleUrl && (
                <button
                  type="button"
                  onClick={() => setShowSubtitles((v) => !v)}
                  title={showSubtitles ? "Hide subtitles" : "Show subtitles"}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                    showSubtitles ? "bg-indigo-500/80 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  CC
                </button>
              )}

              <Button variant="ghost" size="icon" onClick={toggleFullscreen}
                className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white" title="Fullscreen">
                <Maximize2Icon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
