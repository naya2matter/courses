// ─── useAudioPlayer ───────────────────────────────────────────────────────────
// Owns a single <audio> element and encapsulates ALL playback + progress logic
// for the user audio player. The component just renders controls from the state
// this hook returns and attaches `audioProps` (+ `audioRef`) to the <audio> tag.
//
// Progress tracking model (matches the backend AudioService):
//   • listened_time is measured as ACTUAL CONTENT PLAYED — we sum positive
//     `currentTime` advances reported by `timeupdate`. This is correct under
//     playback-rate changes, pauses, and buffering stalls (a stalled element
//     emits no advance), and seeks are excluded.
//   • current_time sent in each chunk is the live playback position. The server
//     keeps the MAX, so it doubles as the resume point.
//   • Chunks are buffered and flushed periodically + on pause/end/unmount/tab-
//     hide. Each in-flight flush carries a stable top-level `batch_key`; on
//     failure we resend the SAME key so the server's idempotency cache prevents
//     double-counting. A new key is minted only after a flush succeeds.

import { useCallback, useEffect, useRef, useState } from "react"

import { updateAudioProgress } from "../service/user-audio.service"
import type {
  ProgressChunk,
  UserAudioProgressDetail,
} from "../types/user-audio.types"

const FLUSH_INTERVAL_MS = 10_000
const MAX_CHUNKS = 300
const MAX_CHUNK_LISTENED = 3600 // server caps each chunk at 1 hour
// A single timeupdate advance larger than this is treated as a seek, not as
// listened content. Generous enough to cover high playback rates + slow ticks.
const SEEK_ADVANCE_THRESHOLD = 4

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export type SaveState = "idle" | "saving" | "saved" | "error"

export interface UseAudioPlayerOptions {
  audioId: number
  /** Resume position from the server (progress.current_time), in seconds. */
  initialTime?: number | null
  /** Called whenever the server returns a fresh progress record. */
  onProgress?: (progress: UserAudioProgressDetail) => void
}

/** Event handlers spread onto the <audio> element. */
export interface AudioElementProps {
  onPlay: () => void
  onPause: () => void
  onEnded: () => void
  onSeeking: () => void
  onSeeked: () => void
  onTimeUpdate: () => void
  onLoadedMetadata: () => void
  onWaiting: () => void
  onPlaying: () => void
  onRateChange: () => void
  onVolumeChange: () => void
}

/** Ref-free player state + imperative controls — safe to pass to children. */
export interface AudioPlayerControls {
  // ── reactive state ──
  isPlaying: boolean
  isBuffering: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isLooping: boolean
  saveState: SaveState

  // ── imperative controls ──
  togglePlay: () => void
  seekTo: (time: number) => void
  skip: (seconds: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  cycleSpeed: () => void
  toggleLoop: () => void
}

/** Full return: the element bindings plus the ref-free controls. */
export interface UseAudioPlayerResult {
  audioRef: React.RefObject<HTMLAudioElement | null>
  audioProps: AudioElementProps
  controls: AudioPlayerControls
}

export function useAudioPlayer({
  audioId,
  initialTime,
  onProgress,
}: UseAudioPlayerOptions): UseAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")

  // ── progress tracking refs (don't trigger re-renders) ──
  const lastPosRef = useRef(0)             // last seen currentTime, for delta calc
  const listenedAccumRef = useRef(0)       // fractional content-seconds not yet flushed
  const livePosRef = useRef(0)             // latest playback position
  const seekingRef = useRef(false)
  const pendingChunksRef = useRef<ProgressChunk[]>([])
  const pendingBatchKeyRef = useRef<string | null>(null)
  const isFlushingRef = useRef(false)
  const resumeAppliedRef = useRef(false)

  // Keep latest callback + resume position in refs without re-subscribing the
  // playback effects (written in effects, not during render).
  const onProgressRef = useRef(onProgress)
  const initialTimeRef = useRef(initialTime)
  useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])
  useEffect(() => {
    initialTimeRef.current = initialTime
  }, [initialTime])

  // ── flush: materialize accumulated listen time → send buffered chunks ──
  const flush = useCallback(async () => {
    if (isFlushingRef.current) return

    // Roll the whole seconds we've accumulated into a chunk; keep the remainder.
    const whole = Math.floor(listenedAccumRef.current)
    if (whole > 0) {
      listenedAccumRef.current -= whole
      pendingChunksRef.current.push({
        current_time: Math.max(0, livePosRef.current),
        listened_time: Math.min(whole, MAX_CHUNK_LISTENED),
      })
    }

    if (pendingChunksRef.current.length === 0) return

    // Mint a batch key once; reuse it across retries for idempotency.
    if (!pendingBatchKeyRef.current) {
      pendingBatchKeyRef.current = `aud${audioId}-${Date.now()}-${Math.round(
        livePosRef.current,
      )}`
    }

    const chunks = pendingChunksRef.current.slice(0, MAX_CHUNKS)
    const batchKey = pendingBatchKeyRef.current

    isFlushingRef.current = true
    setSaveState("saving")
    try {
      const res = await updateAudioProgress(audioId, {
        chunks,
        batch_key: batchKey,
      })
      // Drop the chunks we just sent; keep any that overflowed MAX_CHUNKS.
      pendingChunksRef.current = pendingChunksRef.current.slice(chunks.length)
      pendingBatchKeyRef.current = null
      setSaveState("saved")
      onProgressRef.current?.(res.data)
    } catch {
      // Keep chunks + batch key buffered; the next flush retries the same
      // idempotent payload, so the server won't double-count.
      setSaveState("error")
    } finally {
      isFlushingRef.current = false
    }
  }, [audioId])

  // Periodic flush while actively playing.
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) void flush()
    }, FLUSH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isPlaying, flush])

  // Flush on tab-hide / page-hide (mobile + closing tab) and on unmount.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush()
    }
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", onHide)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", onHide)
      void flush()
    }
  }, [flush])

  // ── element event handlers ──
  const handlePlay = useCallback(() => setIsPlaying(true), [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    setIsBuffering(false)
    void flush()
  }, [flush])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    void flush()
  }, [flush])

  const handleSeeking = useCallback(() => {
    seekingRef.current = true
  }, [])

  const handleSeeked = useCallback(() => {
    const el = audioRef.current
    if (el) {
      lastPosRef.current = el.currentTime
      livePosRef.current = el.currentTime
      setCurrentTime(el.currentTime)
    }
    seekingRef.current = false
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    const pos = el.currentTime
    livePosRef.current = pos
    setCurrentTime(pos)

    if (seekingRef.current) {
      lastPosRef.current = pos
      return
    }

    const advance = pos - lastPosRef.current
    lastPosRef.current = pos
    // Count only forward advances that aren't seek jumps.
    if (advance > 0 && advance < SEEK_ADVANCE_THRESHOLD) {
      listenedAccumRef.current += advance
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    setDuration(Number.isFinite(el.duration) ? el.duration : 0)

    // Apply the server resume position exactly once.
    if (!resumeAppliedRef.current) {
      resumeAppliedRef.current = true
      const resume = initialTimeRef.current ?? 0
      if (resume > 0 && resume < el.duration) {
        el.currentTime = resume
        lastPosRef.current = resume
        livePosRef.current = resume
        setCurrentTime(resume)
      }
    }
  }, [])

  const handleWaiting = useCallback(() => setIsBuffering(true), [])
  const handlePlaying = useCallback(() => setIsBuffering(false), [])
  const handleRateChange = useCallback(() => {
    const el = audioRef.current
    if (el) setPlaybackRate(el.playbackRate)
  }, [])
  const handleVolumeChange = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    setVolumeState(el.volume)
    setIsMuted(el.muted || el.volume === 0)
  }, [])

  // ── imperative controls ──
  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }, [])

  const seekTo = useCallback((time: number) => {
    const el = audioRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(el.duration || time, time))
    el.currentTime = clamped
    setCurrentTime(clamped)
  }, [])

  const skip = useCallback((seconds: number) => {
    const el = audioRef.current
    if (!el) return
    seekTo(el.currentTime + seconds)
  }, [seekTo])

  const setVolume = useCallback((v: number) => {
    const el = audioRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(1, v))
    el.volume = clamped
    el.muted = clamped === 0
  }, [])

  const toggleMute = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.muted = !el.muted
  }, [])

  const cycleSpeed = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    const idx = PLAYBACK_SPEEDS.indexOf(el.playbackRate as never)
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length]
    el.playbackRate = next
  }, [])

  const toggleLoop = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.loop = !el.loop
    setIsLooping(el.loop)
  }, [])

  return {
    audioRef,
    audioProps: {
      onPlay: handlePlay,
      onPause: handlePause,
      onEnded: handleEnded,
      onSeeking: handleSeeking,
      onSeeked: handleSeeked,
      onTimeUpdate: handleTimeUpdate,
      onLoadedMetadata: handleLoadedMetadata,
      onWaiting: handleWaiting,
      onPlaying: handlePlaying,
      onRateChange: handleRateChange,
      onVolumeChange: handleVolumeChange,
    },
    controls: {
      isPlaying,
      isBuffering,
      currentTime,
      duration,
      volume,
      isMuted,
      playbackRate,
      isLooping,
      saveState,
      togglePlay,
      seekTo,
      skip,
      setVolume,
      toggleMute,
      cycleSpeed,
      toggleLoop,
    },
  }
}
