// ─── useLearningSession ───────────────────────────────────────────────────────
// Manages the full learning-session lifecycle for a VIDEO content item:
//
//   start  → on first Play (skipped if the content is already completed)
//   progress → at milestones (25/50/75/95%), on pause, on seek, and every 120s
//   end    → on natural end, on unmount (SPA navigation), and on tab close
//
// The video player is a thin DOM layer that forwards semantic events to the
// handlers returned here; all metric accounting, timing, throttling and network
// calls live in this hook. PDFs do NOT use this hook (they post to /progress/pdf).

import { useCallback, useEffect, useRef, useState } from "react"

import {
  startSession,
  sendSessionProgress,
  endSession,
  endSessionBeacon,
} from "../service/user-online-courses.service"
import type {
  SessionEndData,
  SessionEventLogEntry,
} from "../types/user-online-courses.types"

const PROGRESS_INTERVAL_MS = 120_000 // periodic ping cadence while playing
const MILESTONES = [25, 50, 75, 95] as const
const SEEK_EPSILON = 2 // seconds — ignore micro-seeks when classifying direction
const MAX_EVENTS = 50 // backend caps events_log at 50 entries

interface Options {
  courseId: number
  contentId: number
  /** When true the content is already 100% done → review mode, no tracking. */
  alreadyCompleted: boolean
}

interface Counters {
  skip: number
  seek: number
  replay: number
  pause: number
  speed: number
  fullscreen: number
}

export function useLearningSession({ courseId, contentId, alreadyCompleted }: Options) {
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const [result, setResult] = useState<SessionEndData | null>(null)
  const [liveContentPct, setLiveContentPct] = useState(0)
  const lastRenderedPctRef = useRef(-1)

  // Keep the latest identifiers in refs so the unload listeners (registered
  // once) always read current values without re-subscribing.
  const courseIdRef = useRef(courseId)
  const contentIdRef = useRef(contentId)
  const completedRef = useRef(alreadyCompleted)
  courseIdRef.current = courseId
  contentIdRef.current = contentId
  completedRef.current = alreadyCompleted

  const sessionIdRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)         // wall-clock session start (ms)
  const playingRef = useRef(false)
  const segmentStartRef = useRef(0)      // ms when the current play segment began
  const activeTimeRef = useRef(0)        // accumulated active-play seconds
  const maxCompletionRef = useRef(0)
  const lastPositionRef = useRef(0)
  const durationRef = useRef(0)
  const lastSentRef = useRef(0)          // ms of last progress ping
  const endedRef = useRef(false)
  const startingRef = useRef(false)
  const milestonesRef = useRef<Set<number>>(new Set())
  const eventsRef = useRef<SessionEventLogEntry[]>([])
  const counters = useRef<Counters>({ skip: 0, seek: 0, replay: 0, pause: 0, speed: 0, fullscreen: 0 })

  const wallSeconds = () => (startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0)

  /** Fold the in-flight play segment into the active-time accumulator. */
  const foldSegment = useCallback(() => {
    if (playingRef.current) {
      const secs = (Date.now() - segmentStartRef.current) / 1000
      activeTimeRef.current += Math.max(0, secs)
      segmentStartRef.current = Date.now()
    }
  }, [])

  const liveActiveTime = () => {
    let t = activeTimeRef.current
    if (playingRef.current) t += Math.max(0, (Date.now() - segmentStartRef.current) / 1000)
    return Math.round(t)
  }

  const pushEvent = useCallback((entry: SessionEventLogEntry) => {
    if (eventsRef.current.length >= MAX_EVENTS) return
    eventsRef.current.push(entry)
  }, [])

  const buildProgressBody = useCallback(() => {
    const c = counters.current
    return {
      active_playback_time: liveActiveTime(),
      playback_position: Math.round(lastPositionRef.current * 10) / 10,
      completion_percentage: Math.round(maxCompletionRef.current * 100) / 100,
      skip_count: c.skip,
      seek_count: c.seek,
      replay_count: c.replay,
      pause_count: c.pause,
      speed_changes: c.speed,
    }
  }, [])

  const sendProgress = useCallback(() => {
    const id = sessionIdRef.current
    if (id == null || endedRef.current) return
    lastSentRef.current = Date.now()
    void sendSessionProgress(id, buildProgressBody()).catch(() => {
      /* best-effort ping — ignore transient failures */
    })
  }, [buildProgressBody])

  /** Start the session lazily on first play (no-op for completed content). */
  const ensureStarted = useCallback(async () => {
    if (completedRef.current) return
    if (sessionIdRef.current != null || startingRef.current) return
    startingRef.current = true
    try {
      const res = await startSession({
        course_online_id: courseIdRef.current,
        content_id: contentIdRef.current,
        content_type: "video",
      })
      sessionIdRef.current = res.data.session_id
      startedAtRef.current = Date.now()
      lastSentRef.current = Date.now()
      setSessionId(res.data.session_id)
    } catch {
      // 403 = already completed / not assigned → silently fall back to review mode
    } finally {
      startingRef.current = false
    }
  }, [])

  // ── Semantic handlers (wired to the <video> element) ────────────────────────

  const handlePlay = useCallback(() => {
    playingRef.current = true
    segmentStartRef.current = Date.now()
    void ensureStarted()
  }, [ensureStarted])

  const handlePause = useCallback(() => {
    if (!playingRef.current) return
    foldSegment()
    playingRef.current = false
    counters.current.pause += 1
    sendProgress()
  }, [foldSegment, sendProgress])

  const handleSeek = useCallback((fromPos: number, toPos: number) => {
    foldSegment()
    counters.current.seek += 1
    if (toPos > fromPos + SEEK_EPSILON) counters.current.skip += 1
    else if (toPos < fromPos - SEEK_EPSILON) counters.current.replay += 1
    pushEvent({ type: "seek", at: Math.round(wallSeconds()), from: Math.round(fromPos), to: Math.round(toPos) })
    sendProgress()
  }, [foldSegment, pushEvent, sendProgress])

  const handleSpeedChange = useCallback(() => {
    counters.current.speed += 1
  }, [])

  const handleFullscreen = useCallback(() => {
    counters.current.fullscreen += 1
  }, [])

  const handleTimeUpdate = useCallback((position: number, duration: number) => {
    if (duration > 0) durationRef.current = duration
    lastPositionRef.current = position
    const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0
    if (pct > maxCompletionRef.current) maxCompletionRef.current = pct

    // Live UI progress — only re-render when the integer percentage changes.
    const rounded = Math.min(100, Math.round(pct))
    if (rounded !== lastRenderedPctRef.current) {
      lastRenderedPctRef.current = rounded
      setLiveContentPct(rounded)
    }

    // Fire any newly-crossed milestones (each once) with an immediate ping.
    let crossed = false
    for (const m of MILESTONES) {
      if (pct >= m && !milestonesRef.current.has(m)) {
        milestonesRef.current.add(m)
        pushEvent({ type: "milestone", at: Math.round(wallSeconds()), pct: m })
        crossed = true
      }
    }
    if (crossed) {
      sendProgress()
      return
    }
    // Otherwise throttle to the periodic cadence while actively playing.
    if (playingRef.current && Date.now() - lastSentRef.current >= PROGRESS_INTERVAL_MS) {
      sendProgress()
    }
  }, [pushEvent, sendProgress])

  // ── End the session (normal path: natural end / SPA navigation) ─────────────

  const finalize = useCallback(async () => {
    const id = sessionIdRef.current
    if (id == null || endedRef.current) return
    endedRef.current = true
    foldSegment()
    playingRef.current = false
    setIsEnding(true)
    try {
      const res = await endSession(id, {
        ...buildProgressBody(),
        wall_clock_time: Math.round(wallSeconds()),
        fullscreen_count: counters.current.fullscreen,
        events_log: eventsRef.current.slice(0, MAX_EVENTS),
      })
      setResult(res.data)
    } catch {
      // best-effort — the row may still be written; ignore UI-side
    } finally {
      setIsEnding(false)
    }
  }, [buildProgressBody, foldSegment])

  const handleEnded = useCallback(() => {
    void finalize()
  }, [finalize])

  // ── Unload handling: progress on tab-hide, keepalive end on page-hide ───────

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        foldSegment()
        sendProgress()
      }
    }
    function onPageHide() {
      const id = sessionIdRef.current
      if (id == null || endedRef.current) return
      endedRef.current = true
      foldSegment()
      endSessionBeacon(id, {
        ...buildProgressBody(),
        wall_clock_time: Math.round(wallSeconds()),
        fullscreen_count: counters.current.fullscreen,
        events_log: eventsRef.current.slice(0, MAX_EVENTS),
      })
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
    }
  }, [foldSegment, sendProgress, buildProgressBody])

  // End the session when the component unmounts (e.g. navigating to next item).
  useEffect(() => {
    return () => {
      void finalize()
    }
  }, [finalize])

  return {
    sessionId,
    isEnding,
    result,
    liveContentPct,
    handlePlay,
    handlePause,
    handleSeek,
    handleSpeedChange,
    handleFullscreen,
    handleTimeUpdate,
    handleEnded,
    finalize,
  }
}
