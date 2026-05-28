import { useCallback, useEffect, useRef, useState } from "react"

import {
  endLearningSession,
  sendSessionProgress,
  startLearningSession,
  updatePdfProgress,
} from "@/services/userOnlineCourse.service"
import type {
  LearningSessionEvent,
  SessionEndPayload,
  SessionEndResponse,
  SessionMetrics,
} from "@/types/user-online-course"

type ContentType = "video" | "pdf"

interface UseLearningSessionOptions {
  courseId: number
  contentId: number
  contentType: ContentType | null
  initialResumePosition: number
  initialCompletion: number
  totalPdfPages: number | null
  onRealError?: (message: string, status?: number) => void
  /** Called once when a non-beacon session end completes successfully. */
  onSessionEnded?: (result: SessionEndResponse["data"]) => void
}

interface EndSessionOptions {
  reason?: string
  useKeepAlive?: boolean
  completionOverride?: number
}

interface FlushProgressOptions {
  useKeepAlive?: boolean
  markUnmountHandled?: boolean
}

interface UseLearningSessionResult {
  displayedCompletion: number
  resumePosition: number
  resumeHint: string | null
  sessionSummary: SessionEndResponse["data"] | null
  ensureSessionStarted: (forceType?: ContentType) => Promise<number | null>
  flushProgressSnapshot: (opts?: FlushProgressOptions) => Promise<void>
  onVideoPlay: () => void
  onVideoProgress: (position: number, duration: number) => void
  onVideoPause: (position: number, duration: number) => void
  onVideoSeek: (from: number, to: number, duration: number) => void
  onVideoRateChange: () => void
  onVideoEnd: (position: number, duration: number) => void
  onPdfOpen: () => void
  onPdfPageChange: (page: number, totalPages: number | null) => void
  endSession: (opts?: EndSessionOptions) => Promise<SessionEndResponse["data"] | null>
}

const MILESTONES = [25, 50, 75, 95] as const
const ALLOWED_EVENT_TYPES = new Set([
  "pause",
  "resume",
  "skip",
  "seek",
  "milestone",
])

const EMPTY_METRICS: SessionMetrics = {
  active_playback_time: 0,
  playback_position: 0,
  completion_percentage: 0,
  skip_count: 0,
  seek_count: 0,
  replay_count: 0,
  pause_count: 0,
  speed_changes: 0,
}

interface PersistedLearningSessionSnapshot {
  version: 1
  sessionId: number
  startedAt: number | null
  latestPosition: number
  latestCompletion: number
  metrics: SessionMetrics
  events: LearningSessionEvent[]
  milestones: number[]
  activePlaybackSeconds: number
  fullscreenCount: number
  viewedPages: number[]
  pdfCurrentPage: number
  pdfTotalPages: number | null
}

const PERSISTED_SNAPSHOT_VERSION = 1 as const
const LEARNING_SESSION_STORAGE_PREFIX = "online-course-learning-session:"

function getPersistedSnapshotKey(courseId: number, contentId: number): string {
  return `${LEARNING_SESSION_STORAGE_PREFIX}${courseId}:${contentId}`
}

function readPersistedSnapshot(courseId: number, contentId: number): PersistedLearningSessionSnapshot | null {
  if (typeof window === "undefined") return null

  const key = getPersistedSnapshotKey(courseId, contentId)
  const raw = window.sessionStorage.getItem(key)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PersistedLearningSessionSnapshot
    if (parsed?.version !== PERSISTED_SNAPSHOT_VERSION || typeof parsed.sessionId !== "number") {
      window.sessionStorage.removeItem(key)
      return null
    }
    return parsed
  } catch {
    window.sessionStorage.removeItem(key)
    return null
  }
}

function writePersistedSnapshot(
  courseId: number,
  contentId: number,
  snapshot: PersistedLearningSessionSnapshot,
): void {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(getPersistedSnapshotKey(courseId, contentId), JSON.stringify(snapshot))
}

function removePersistedSnapshot(courseId: number, contentId: number): void {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(getPersistedSnapshotKey(courseId, contentId))
}

function clampCompletion(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError")
    || (err instanceof Error && err.name === "AbortError")
  )
}

function toSafeEventType(type: string): LearningSessionEvent["type"] | null {
  if (ALLOWED_EVENT_TYPES.has(type)) return type
  if (
    type === "ended"
    || type === "pdf_open"
    || type === "pdf_page_change"
    || type === "visibility_hidden"
    || type === "visibility_visible"
    || type === "fullscreen_enter"
    || type === "fullscreen_exit"
    || type === "pagehide"
    || type === "unmount"
  ) {
    return "pause"
  }
  if (type === "speed_change") return "seek"
  return null
}

export function useLearningSession(options: UseLearningSessionOptions): UseLearningSessionResult {
  const {
    courseId,
    contentId,
    contentType,
    initialResumePosition,
    initialCompletion,
    totalPdfPages,
    onRealError,
    onSessionEnded,
  } = options

  const [resumePosition, setResumePosition] = useState(Math.max(0, initialResumePosition))
  const [displayedCompletion, setDisplayedCompletion] = useState(clampCompletion(initialCompletion))
  const [resumeHint, setResumeHint] = useState<string | null>(null)
  const [sessionSummary, setSessionSummary] = useState<SessionEndResponse["data"] | null>(null)

  const sessionIdRef = useRef<number | null>(null)
  const startPromiseRef = useRef<Promise<number | null> | null>(null)
  const endingPromiseRef = useRef<Promise<SessionEndResponse["data"] | null> | null>(null)

  const startedAtRef = useRef<number | null>(null)
  const endedRef = useRef(false)
  const closedByPagehideRef = useRef(false)
  const skipNextUnmountFlushRef = useRef(false)

  const metricsRef = useRef<SessionMetrics>({ ...EMPTY_METRICS })
  const eventsRef = useRef<LearningSessionEvent[]>([])
  const milestonesRef = useRef<Set<number>>(new Set())

  const latestPositionRef = useRef(Math.max(0, initialResumePosition))
  const latestCompletionRef = useRef(clampCompletion(initialCompletion))
  const latestContentTypeRef = useRef<ContentType | null>(contentType)

  const playingRef = useRef(false)
  const playStartedAtRef = useRef<number | null>(null)
  const activePlaybackSecondsRef = useRef(0)
  const progressTickerRef = useRef<number | null>(null)

  const fullscreenCountRef = useRef(0)
  const viewedPagesRef = useRef<Set<number>>(new Set())
  const pdfCurrentPageRef = useRef(Math.max(1, Math.floor(initialResumePosition || 1)))
  const pdfTotalPagesRef = useRef<number | null>(totalPdfPages)
  // Deduplicate progress-error toasts: only fire once per session for 401/403.
  const progressErrorShownRef = useRef(false)

  const clearPersistedSnapshot = useCallback(() => {
    if (!courseId || !contentId) return
    removePersistedSnapshot(courseId, contentId)
  }, [contentId, courseId])

  const persistSessionSnapshot = useCallback(() => {
    if (!courseId || !contentId || !sessionIdRef.current) return

    writePersistedSnapshot(courseId, contentId, {
      version: PERSISTED_SNAPSHOT_VERSION,
      sessionId: sessionIdRef.current,
      startedAt: startedAtRef.current,
      latestPosition: latestPositionRef.current,
      latestCompletion: latestCompletionRef.current,
      metrics: metricsRef.current,
      events: eventsRef.current,
      milestones: [...milestonesRef.current],
      activePlaybackSeconds: activePlaybackSecondsRef.current,
      fullscreenCount: fullscreenCountRef.current,
      viewedPages: [...viewedPagesRef.current],
      pdfCurrentPage: pdfCurrentPageRef.current,
      pdfTotalPages: pdfTotalPagesRef.current,
    })
  }, [contentId, courseId])

  const pushEvent = useCallback((event: LearningSessionEvent) => {
    const safeType = toSafeEventType(event.type)
    if (!safeType) return

    const safe: LearningSessionEvent = {
      ...event,
      type: safeType,
      at: Math.floor(event.at),
      ...(event.from != null && { from: Math.floor(event.from) }),
      ...(event.to != null && { to: Math.floor(event.to) }),
    }
    const next = [...eventsRef.current, safe]
    eventsRef.current = next.slice(-50)
    persistSessionSnapshot()
  }, [persistSessionSnapshot])

  const trackDisplayedCompletion = useCallback((next: number) => {
    const clamped = clampCompletion(next)
    latestCompletionRef.current = Math.max(latestCompletionRef.current, clamped)
    setDisplayedCompletion((prev) => Math.max(prev, latestCompletionRef.current))
  }, [])

  const syncPdfProgress = useCallback(async () => {
    if (latestContentTypeRef.current !== "pdf") return
    if (!courseId || !contentId) return

    const totalPages = pdfTotalPagesRef.current
    if (!totalPages || totalPages < 1) return

    try {
      const result = await updatePdfProgress({
        content_id: contentId,
        course_online_id: courseId,
        current_page: pdfCurrentPageRef.current,
        pages_viewed: viewedPagesRef.current.size,
        total_pages: totalPages,
      })

      trackDisplayedCompletion(result.completion_percentage)
    } catch (err) {
      if (isAbortError(err)) return
      // Keep PDF progress failures non-fatal during interaction; end-session still retries separately.
    }
  }, [contentId, courseId, trackDisplayedCompletion])

  const elapsedSinceStart = useCallback(() => {
    if (!startedAtRef.current) return 0
    return Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000))
  }, [])

  const addPlaybackSlice = useCallback(() => {
    if (!playingRef.current || !playStartedAtRef.current) return
    const delta = Math.max(0, Math.floor((Date.now() - playStartedAtRef.current) / 1000))
    activePlaybackSecondsRef.current += delta
    playStartedAtRef.current = Date.now()
  }, [])

  const getActivePlaybackSeconds = useCallback(() => {
    if (!playingRef.current || !playStartedAtRef.current) return activePlaybackSecondsRef.current
    const running = Math.max(0, Math.floor((Date.now() - playStartedAtRef.current) / 1000))
    return activePlaybackSecondsRef.current + running
  }, [])

  const stopProgressTicker = useCallback(() => {
    if (progressTickerRef.current != null) {
      window.clearInterval(progressTickerRef.current)
      progressTickerRef.current = null
    }
  }, [])

  const startProgressTicker = useCallback(() => {
    if (progressTickerRef.current != null) return
    progressTickerRef.current = window.setInterval(() => {
      void sendProgressSnapshot(latestPositionRef.current, latestCompletionRef.current)
    }, 120000)
  }, [])

  const startPlaybackClock = useCallback(() => {
    if (playingRef.current) return
    playingRef.current = true
    playStartedAtRef.current = Date.now()
    startProgressTicker()
  }, [startProgressTicker])

  const stopPlaybackClock = useCallback(() => {
    addPlaybackSlice()
    playingRef.current = false
    playStartedAtRef.current = null
    stopProgressTicker()
  }, [addPlaybackSlice, stopProgressTicker])

  const toMetrics = useCallback((position: number, completion: number): SessionMetrics => {
    const next: SessionMetrics = {
      ...metricsRef.current,
      active_playback_time: getActivePlaybackSeconds(),
      playback_position: Math.max(0, position),
      completion_percentage: clampCompletion(completion),
    }
    metricsRef.current = next
    return next
  }, [getActivePlaybackSeconds])

  const sendProgressSnapshot = useCallback(async (position: number, completion: number) => {
    if (!sessionIdRef.current || endedRef.current) return

    const payload = toMetrics(position, completion)
    latestPositionRef.current = payload.playback_position
    trackDisplayedCompletion(payload.completion_percentage)
    persistSessionSnapshot()

    try {
      await sendSessionProgress(sessionIdRef.current, payload)
    } catch (err) {
      if (isAbortError(err)) return

      // Transient network errors are silently ignored — progress is fire-and-forget.
      // Only policy violations (401 / 403) are surfaced to the user, and only once
      // per session to avoid toast spam on every tick/pause/seek.
      const e = err as { status?: number; data?: { message?: string } }
      if ((e?.status === 401 || e?.status === 403) && !progressErrorShownRef.current) {
        progressErrorShownRef.current = true
        const msg =
          e.status === 401
            ? "Your session expired. Please log in again."
            : "Progress update rejected — this session belongs to a different user."
        onRealError?.(msg, e.status)
      }
    }
  }, [onRealError, persistSessionSnapshot, toMetrics, trackDisplayedCompletion])

  const resetSessionState = useCallback((resumePos: number, completion: number, pages: number | null) => {
    sessionIdRef.current = null
    startPromiseRef.current = null
    endingPromiseRef.current = null

    startedAtRef.current = null
    endedRef.current = false
    closedByPagehideRef.current = false

    metricsRef.current = { ...EMPTY_METRICS }
    eventsRef.current = []
    milestonesRef.current = new Set()

    latestPositionRef.current = Math.max(0, resumePos)
    latestCompletionRef.current = clampCompletion(completion)
    latestContentTypeRef.current = contentType

    activePlaybackSecondsRef.current = 0
    playingRef.current = false
    playStartedAtRef.current = null
    stopProgressTicker()

    fullscreenCountRef.current = 0
    skipNextUnmountFlushRef.current = false
    progressErrorShownRef.current = false
    viewedPagesRef.current = new Set()
    pdfCurrentPageRef.current = Math.max(1, Math.floor(resumePos || 1))
    pdfTotalPagesRef.current = pages

    setResumePosition(Math.max(0, resumePos))
    setDisplayedCompletion(clampCompletion(completion))
    setResumeHint(null)
    setSessionSummary(null)
  }, [contentType, stopProgressTicker])

  useEffect(() => {
    resetSessionState(initialResumePosition, initialCompletion, totalPdfPages)
  }, [contentId, courseId, contentType, initialResumePosition, initialCompletion, resetSessionState, totalPdfPages])

  useEffect(() => {
    if (sessionIdRef.current || endedRef.current) return
    latestPositionRef.current = Math.max(0, initialResumePosition)
    latestCompletionRef.current = Math.max(latestCompletionRef.current, clampCompletion(initialCompletion))
    setResumePosition(Math.max(0, initialResumePosition))
    setDisplayedCompletion((prev) => Math.max(prev, clampCompletion(initialCompletion)))
    pdfTotalPagesRef.current = totalPdfPages
  }, [initialCompletion, initialResumePosition, totalPdfPages])

  const ensureSessionStarted = useCallback(async (forceType?: ContentType) => {
    const effectiveType = forceType ?? latestContentTypeRef.current
    if (!courseId || !contentId || !effectiveType) return null
    if (sessionIdRef.current) return latestPositionRef.current
    if (startPromiseRef.current) return startPromiseRef.current

    const startPromise = (async () => {
      try {
        const started = await startLearningSession({
          course_online_id: courseId,
          content_id: contentId,
          content_type: effectiveType,
        })

        const persisted = readPersistedSnapshot(courseId, contentId)
        const shouldRestoreSnapshot = persisted?.sessionId === started.session_id

        sessionIdRef.current = started.session_id
        endedRef.current = false
        closedByPagehideRef.current = false
        skipNextUnmountFlushRef.current = false

        const nextResume = Math.max(0, started.resume_position)
        const nextCompletion = shouldRestoreSnapshot
          ? Math.max(latestCompletionRef.current, clampCompletion(persisted.latestCompletion))
          : latestCompletionRef.current
        const nextPosition = shouldRestoreSnapshot
          ? Math.max(nextResume, Math.max(0, persisted.latestPosition))
          : nextResume

        if (shouldRestoreSnapshot && persisted) {
          startedAtRef.current = persisted.startedAt ?? Date.now()
          metricsRef.current = {
            ...EMPTY_METRICS,
            ...persisted.metrics,
            playback_position: nextPosition,
            completion_percentage: nextCompletion,
          }
          eventsRef.current = persisted.events.slice(-50)
          milestonesRef.current = new Set(persisted.milestones)
          activePlaybackSecondsRef.current = Math.max(0, persisted.activePlaybackSeconds)
          fullscreenCountRef.current = Math.max(0, persisted.fullscreenCount)
          viewedPagesRef.current = new Set(persisted.viewedPages)
          pdfCurrentPageRef.current = Math.max(1, Math.floor(persisted.pdfCurrentPage || 1))
          pdfTotalPagesRef.current = persisted.pdfTotalPages ?? totalPdfPages
        } else {
          startedAtRef.current = Date.now()
          clearPersistedSnapshot()
        }

        setResumePosition(nextPosition)
        setDisplayedCompletion(nextCompletion)
        latestPositionRef.current = nextPosition
        latestCompletionRef.current = nextCompletion
        metricsRef.current.playback_position = nextPosition
        metricsRef.current.completion_percentage = nextCompletion

        if (effectiveType === "video") {
          setResumeHint(nextPosition > 0 ? `Resume from ${formatClock(nextPosition)}` : null)
        } else {
          const page = Math.max(1, Math.floor(nextPosition || 1))
          viewedPagesRef.current.add(page)
          pdfCurrentPageRef.current = page
          setResumeHint(nextPosition > 0 ? `Resume from page ${page}` : null)
        }

        persistSessionSnapshot()

        return nextPosition
      } catch (err) {
        if (isAbortError(err)) return null

        const e = err as { message?: string; status?: number; data?: { message?: string } }

        if (onRealError && (e?.status === 401 || e?.status === 403 || e?.status === 422 || e?.status === 0)) {
          const backendMsg = e?.data?.message?.toLowerCase() ?? ""
          let userMessage: string

          if (e.status === 403) {
            // Distinguish "already completed" from "not assigned / module locked"
            if (backendMsg.includes("complet")) {
              userMessage = "This content has already been completed — no new session needed."
            } else {
              userMessage = "Access denied — this course is not assigned to you or the module is still locked."
            }
          } else if (e.status === 401) {
            userMessage = "Your session expired. Please log in again."
          } else if (e.status === 422) {
            userMessage = e?.data?.message ?? "Invalid request. Please try again."
          } else {
            // status 0 — network failure
            userMessage = "No internet connection. Please check your network and try again."
          }

          onRealError(userMessage, e?.status)
        }
        if (e?.status === 401 || e?.status === 403 || e?.status === 422) {
          clearPersistedSnapshot()
        }
        return null
      } finally {
        startPromiseRef.current = null
      }
    })()

    startPromiseRef.current = startPromise
    return startPromise
  }, [clearPersistedSnapshot, contentId, courseId, onRealError, persistSessionSnapshot, totalPdfPages])

  const flushProgressSnapshot = useCallback(async (opts: FlushProgressOptions = {}) => {
    const { useKeepAlive = false, markUnmountHandled = false } = opts
    if (!sessionIdRef.current || endedRef.current) return

    if (markUnmountHandled) {
      skipNextUnmountFlushRef.current = true
    }

    addPlaybackSlice()

    const position = latestContentTypeRef.current === "pdf"
      ? pdfCurrentPageRef.current
      : latestPositionRef.current

    if (!useKeepAlive) {
      await sendProgressSnapshot(position, latestCompletionRef.current)
      return
    }

    const payload = toMetrics(position, latestCompletionRef.current)
    latestPositionRef.current = payload.playback_position
    trackDisplayedCompletion(payload.completion_percentage)
    persistSessionSnapshot()

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
      const token = localStorage.getItem("auth_token")

      await fetch(`${baseUrl}/user/online-courses/sessions/${sessionIdRef.current}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    } catch {
      // Best-effort flush on pagehide: local snapshot is already persisted for resume.
    }
  }, [addPlaybackSlice, persistSessionSnapshot, sendProgressSnapshot, toMetrics, trackDisplayedCompletion])

  const endSession = useCallback(async (opts: EndSessionOptions = {}) => {
    const { useKeepAlive = false, completionOverride, reason } = opts

    if (!sessionIdRef.current || endedRef.current) {
      return endingPromiseRef.current ?? null
    }
    if (endingPromiseRef.current) return endingPromiseRef.current

    const promise = (async () => {
      const sessionId = sessionIdRef.current
      if (!sessionId) return null

      endedRef.current = true
      if (reason) {
        pushEvent({ type: reason, at: latestPositionRef.current })
      }

      stopPlaybackClock()

      const finalMetrics = toMetrics(
        latestPositionRef.current,
        completionOverride ?? latestCompletionRef.current,
      )

      const payload: SessionEndPayload = {
        ...finalMetrics,
        wall_clock_time: elapsedSinceStart(),
        fullscreen_count: fullscreenCountRef.current,
        events_log: eventsRef.current.slice(-50),
      }

      try {
        let result: SessionEndResponse["data"] | null = null

        if (useKeepAlive) {
          const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
          const token = localStorage.getItem("auth_token")
          const url = `${baseUrl}/user/online-courses/sessions/${sessionId}/end`

          if (!token && typeof navigator.sendBeacon === "function") {
            const body = new Blob([JSON.stringify(payload)], { type: "application/json" })
            navigator.sendBeacon(url, body)
          } else {
            await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(payload),
              keepalive: true,
            })
          }
        } else {
          result = await endLearningSession(sessionId, payload)
        }

        trackDisplayedCompletion(payload.completion_percentage)

        if (result) {
          setSessionSummary(result)
          if (result.content_completed) {
            trackDisplayedCompletion(100)
          }
          clearPersistedSnapshot()
          // Notify the consumer so it can react (e.g. show a completion toast).
          // Only fires for interactive ends — beacon path never sets result.
          if (!useKeepAlive) {
            onSessionEnded?.(result)
          }
        }

        return result
      } catch (err) {
        if (isAbortError(err)) return null

        if (!useKeepAlive && onRealError) {
          const e = err as { message?: string; status?: number; data?: { message?: string } }
          if (e?.status === 401 || e?.status === 403 || e?.status === 422 || e?.status === 0) {
            let userMessage: string
            if (e.status === 401) {
              userMessage = "Your session expired. Please log in again."
            } else if (e.status === 422) {
              userMessage = e?.data?.message ?? "Session data was invalid. Please try again."
            } else if (e.status === 0) {
              userMessage = "Progress could not be saved \u2014 no internet connection."
            } else {
              // 403 or any other unexpected status
              userMessage = "Unable to finalize your session. Please try again."
            }
            onRealError(userMessage, e?.status)
          }
        }

        // Allow a retry for non-pagehide paths.
        if (!useKeepAlive) {
          endedRef.current = false
        }
        return null
      }
    })()

    endingPromiseRef.current = promise
    return promise
  }, [clearPersistedSnapshot, elapsedSinceStart, onRealError, onSessionEnded, pushEvent, stopPlaybackClock, toMetrics, trackDisplayedCompletion])

  const onVideoPlay = useCallback(() => {
    void ensureSessionStarted("video")
    startPlaybackClock()
  }, [ensureSessionStarted, startPlaybackClock])

  const onVideoProgress = useCallback((position: number, duration: number) => {
    latestPositionRef.current = Math.max(0, position)
    if (duration > 0) {
      const computed = clampCompletion((position / duration) * 100)
      trackDisplayedCompletion(computed)

      for (const milestone of MILESTONES) {
        if (computed >= milestone && !milestonesRef.current.has(milestone)) {
          milestonesRef.current.add(milestone)
          pushEvent({ type: "milestone", at: position, pct: milestone })
          void sendProgressSnapshot(position, latestCompletionRef.current)
        }
      }
    }

    toMetrics(latestPositionRef.current, latestCompletionRef.current)
  }, [pushEvent, sendProgressSnapshot, toMetrics, trackDisplayedCompletion])

  const onVideoPause = useCallback((position: number, duration: number) => {
    metricsRef.current.pause_count += 1
    pushEvent({ type: "pause", at: position })
    stopPlaybackClock()
    onVideoProgress(position, duration)
    void sendProgressSnapshot(latestPositionRef.current, latestCompletionRef.current)
  }, [onVideoProgress, pushEvent, sendProgressSnapshot, stopPlaybackClock])

  const onVideoSeek = useCallback((from: number, to: number, duration: number) => {
    metricsRef.current.seek_count += 1
    if (to < from) metricsRef.current.replay_count += 1
    if (to - from >= 10) metricsRef.current.skip_count += 1
    pushEvent({ type: "seek", at: to, from, to })
    onVideoProgress(to, duration)
    void sendProgressSnapshot(to, latestCompletionRef.current)
  }, [onVideoProgress, pushEvent, sendProgressSnapshot])

  const onVideoRateChange = useCallback(() => {
    metricsRef.current.speed_changes += 1
    pushEvent({ type: "speed_change", at: latestPositionRef.current })
  }, [pushEvent])

  const onVideoEnd = useCallback((position: number, duration: number) => {
    pushEvent({ type: "ended", at: position, pct: 100 })
    stopPlaybackClock()
    onVideoProgress(position, duration)
    void sendProgressSnapshot(position, 100)
    void endSession({ completionOverride: 100, reason: "ended" })
  }, [endSession, onVideoProgress, pushEvent, sendProgressSnapshot, stopPlaybackClock])

  const onPdfOpen = useCallback(() => {
    void (async () => {
      const startedResume = await ensureSessionStarted("pdf")
      const page = Math.max(1, Math.floor(startedResume ?? resumePosition ?? 1))
      pdfCurrentPageRef.current = page
      viewedPagesRef.current.add(page)
      latestPositionRef.current = page
      if (pdfTotalPagesRef.current) {
        const completion = (viewedPagesRef.current.size / pdfTotalPagesRef.current) * 100
        trackDisplayedCompletion(completion)
      }
      pushEvent({ type: "pdf_open", at: page })
      void sendProgressSnapshot(page, latestCompletionRef.current)
      void syncPdfProgress()
    })()
  }, [ensureSessionStarted, pushEvent, resumePosition, sendProgressSnapshot, syncPdfProgress, trackDisplayedCompletion])

  const onPdfPageChange = useCallback((page: number, pages: number | null) => {
    if (!sessionIdRef.current || endedRef.current) return

    const nextPage = Math.max(1, page)
    pdfCurrentPageRef.current = nextPage
    latestPositionRef.current = nextPage

    pdfTotalPagesRef.current = pages
    viewedPagesRef.current.add(nextPage)

    if (pages && pages > 0) {
      const completion = (viewedPagesRef.current.size / pages) * 100
      trackDisplayedCompletion(completion)
    }

    pushEvent({ type: "pdf_page_change", at: nextPage, pct: latestCompletionRef.current })
    void sendProgressSnapshot(nextPage, latestCompletionRef.current)
    void syncPdfProgress()
  }, [pushEvent, sendProgressSnapshot, syncPdfProgress, trackDisplayedCompletion])

  const handleVisibility = useCallback(() => {
    if (!sessionIdRef.current || endedRef.current) return

    if (document.visibilityState === "hidden") {
      addPlaybackSlice()
      pushEvent({ type: "visibility_hidden", at: latestPositionRef.current })
    } else {
      pushEvent({ type: "visibility_visible", at: latestPositionRef.current })
    }

    const position = latestContentTypeRef.current === "pdf"
      ? pdfCurrentPageRef.current
      : latestPositionRef.current

    void sendProgressSnapshot(position, latestCompletionRef.current)
  }, [addPlaybackSlice, pushEvent, sendProgressSnapshot])

  const handleFullscreen = useCallback(() => {
    if (!sessionIdRef.current || endedRef.current) return
    fullscreenCountRef.current += 1
    pushEvent({
      type: document.fullscreenElement ? "fullscreen_enter" : "fullscreen_exit",
      at: latestPositionRef.current,
    })
  }, [pushEvent])

  const handlePageHide = useCallback(() => {
    if (closedByPagehideRef.current) return
    closedByPagehideRef.current = true
    if (latestContentTypeRef.current === "video") {
      void flushProgressSnapshot({ useKeepAlive: true })
      return
    }
    void endSession({ useKeepAlive: true, reason: "pagehide" })
  }, [endSession, flushProgressSnapshot])

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibility)
    document.addEventListener("fullscreenchange", handleFullscreen)
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      document.removeEventListener("fullscreenchange", handleFullscreen)
      window.removeEventListener("pagehide", handlePageHide)

      if (closedByPagehideRef.current) return
      if (skipNextUnmountFlushRef.current) {
        skipNextUnmountFlushRef.current = false
        return
      }

      if (latestContentTypeRef.current === "video") {
        void flushProgressSnapshot()
        return
      }

      void endSession({ reason: "unmount" })
    }
  }, [endSession, flushProgressSnapshot, handleFullscreen, handlePageHide, handleVisibility])

  return {
    displayedCompletion,
    resumePosition,
    resumeHint,
    sessionSummary,
    ensureSessionStarted,
    flushProgressSnapshot,
    onVideoPlay,
    onVideoProgress,
    onVideoPause,
    onVideoSeek,
    onVideoRateChange,
    onVideoEnd,
    onPdfOpen,
    onPdfPageChange,
    endSession,
  }
}
