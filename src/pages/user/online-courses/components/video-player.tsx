// ─── Online Course Video Player ───────────────────────────────────────────────
// Streams a signed media URL directly in a native <video> (the signed URL needs
// no auth header and supports HTTP Range seeking out of the box). All engagement
// events are forwarded to the parent's learning-session handlers.

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
  MonitorIcon,
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
  subtitleUrl?: string | null
  qualities?: VideoQuality[]
  resumePosition: number
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
  subtitleUrl,
  qualities,
  resumePosition,
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

  const [activeSrc, setActiveSrc] = useState(src)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [activeQuality, setActiveQuality] = useState<string>("Auto")

  useEffect(() => {
    setActiveSrc(src)
    setActiveQuality("Auto")
  }, [src])

  useEffect(() => {
    if (!showQualityMenu) return
    function close(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-quality-menu]")) setShowQualityMenu(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [showQualityMenu])

  const lastTimeRef = useRef(0)
  const seekingRef = useRef(false)
  const resumedRef = useRef(false)

  // Auto-hide controls while playing
  const [controlsVisible, setControlsVisible] = useState(true)
  const isPlayingRef = useRef(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    setDuration(el.duration)
    if (!resumedRef.current && resumePosition > 0 && resumePosition < el.duration) {
      el.currentTime = resumePosition
      setCurrentTime(resumePosition)
      lastTimeRef.current = resumePosition
    }
    resumedRef.current = true
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
  function switchQuality(q: VideoQuality) {
    const el = videoRef.current
    const pos = el ? el.currentTime : 0
    const wasPlaying = el ? !el.paused : false

    setActiveSrc(q.stream_url)
    setActiveQuality(q.quality)
    setShowQualityMenu(false)

    requestAnimationFrame(() => {
      const vid = videoRef.current
      if (!vid) return
      vid.currentTime = pos
      if (wasPlaying) void vid.play()
    })
  }
  function cycleSpeed() {
    const el = videoRef.current
    if (!el) return
    const idx = PLAYBACK_SPEEDS.indexOf(playbackRate)
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length]
    el.playbackRate = next
    setPlaybackRate(next)
    onSpeedChange()
  }
  function toggleFullscreen() {
    const node = containerRef.current
    if (!node) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void node.requestFullscreen?.()
  }

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
      <video
        ref={videoRef}
        src={activeSrc}
        crossOrigin="anonymous"
        className="aspect-video w-full bg-black"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdateInternal}
        onPlay={handlePlayInternal}
        onPause={handlePauseInternal}
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onEnded={handleEndedInternal}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      >
        {subtitleUrl && (
          <track kind="subtitles" src={subtitleUrl} srcLang="ar" label="Arabic" default />
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

            {qualities && qualities.length > 0 && (
              <div className="relative" data-quality-menu>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowQualityMenu(v => !v)}
                  className="h-8 gap-1 rounded-full px-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                  title="Video quality"
                >
                  <MonitorIcon className="size-3.5" />{activeQuality}
                </Button>

                {showQualityMenu && (
                  <div className="absolute bottom-10 right-0 z-50 min-w-[90px] overflow-hidden rounded-xl border border-white/10 bg-[#18181f] shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        const el = videoRef.current
                        const pos = el ? el.currentTime : 0
                        const wasPlaying = el ? !el.paused : false
                        setActiveSrc(src)
                        setActiveQuality("Auto")
                        setShowQualityMenu(false)
                        requestAnimationFrame(() => {
                          const vid = videoRef.current
                          if (!vid) return
                          vid.currentTime = pos
                          if (wasPlaying) void vid.play()
                        })
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-xs transition hover:bg-white/8 ${
                        activeQuality === "Auto" ? "text-indigo-400" : "text-white/70"
                      }`}
                    >
                      <span>Auto</span>
                      <span className="text-white/30">Original</span>
                    </button>

                    {qualities
                      .slice()
                      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
                      .map(q => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => switchQuality(q)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-xs transition hover:bg-white/8 ${
                            activeQuality === q.quality ? "text-indigo-400" : "text-white/70"
                          }`}
                        >
                          <span>{q.quality}</span>
                          <span className="text-white/30">{Math.round(q.file_size / 1_000_000)}MB</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            <Button variant="ghost" size="icon" onClick={toggleFullscreen}
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white" title="Fullscreen">
              <Maximize2Icon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
