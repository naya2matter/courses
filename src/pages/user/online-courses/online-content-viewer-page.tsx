// ─── Online Content Viewer Page ───────────────────────────────────────────────
// Route: /user/online-courses/:courseId/content/:contentId
//
// Flow:
//   1. Call resume endpoint to get last playback_position.
//   2. Call content endpoint to get signed media_url (valid 4 h).
//   3. Render HTML5 <video> or PDF viewer using media_url directly.
//   4. Seek video to playback_position when metadata loads.
//   5. If media fails / 403 → show expiry notice with Refresh Media button.

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  LockIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  ListIcon,
  XIcon,
} from "lucide-react"

import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import {
  getContentResumePosition,
  openCourseContent,
  getMyOnlineCourseById,
} from "@/services/userOnlineCourse.service"
import { useLearningSession } from "./hooks/use-learning-session"
import type {
  ResumeProgressResponse,
  UserCourseMediaResponse,
  UserOnlineCourseDetail,
} from "@/types/user-online-course"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(s: number): string {
  if (s <= 0) return ""
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h > 0) return `${h}h ${rem > 0 ? `${rem}m` : ""}`
  return `${m}m`
}

// ── Video player ──────────────────────────────────────────────────────────────

function VideoPlayer({
  src,
  resumePosition,
  onExpired,
  onStartSession,
  onProgress,
  onPause,
  onSeek,
  onRateChange,
  onPlay,
  onEnd,
}: {
  src: string
  resumePosition: number
  onExpired: () => void
  onStartSession: () => Promise<number | null>
  onProgress: (position: number, duration: number) => void
  onPause: (position: number, duration: number) => void
  onSeek: (from: number, to: number, duration: number) => void
  onRateChange: () => void
  onPlay: () => void
  onEnd: (position: number, duration: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mediaError, setMediaError] = useState(false)
  const lastKnownTimeRef = useRef(0)
  const hasSyncedInitialResumeRef = useRef(false)

  useEffect(() => {
    hasSyncedInitialResumeRef.current = false
    lastKnownTimeRef.current = 0
  }, [src])

  // Seek to resume position once metadata is available
  function handleMetadata() {
    if (videoRef.current && resumePosition > 0 && !hasSyncedInitialResumeRef.current) {
      videoRef.current.currentTime = resumePosition
      hasSyncedInitialResumeRef.current = true
      lastKnownTimeRef.current = resumePosition
    }
  }

  function handleError() {
    setMediaError(true)
    onExpired()
  }

  async function handlePlay() {
    const resume = await onStartSession()
    if (!videoRef.current || resume == null) return
    onPlay()
    // Apply backend resume only on the initial play, not every pause/resume.
    if (!hasSyncedInitialResumeRef.current && resume > 0 && Math.abs(videoRef.current.currentTime - resume) > 1) {
      videoRef.current.currentTime = resume
      hasSyncedInitialResumeRef.current = true
      lastKnownTimeRef.current = resume
    }
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return
    lastKnownTimeRef.current = videoRef.current.currentTime
    onProgress(videoRef.current.currentTime, videoRef.current.duration)
  }

  function handlePause() {
    if (!videoRef.current) return
    onPause(videoRef.current.currentTime, videoRef.current.duration)
  }

  function handleSeeked() {
    if (!videoRef.current) return
    const to = videoRef.current.currentTime
    const from = lastKnownTimeRef.current
    onSeek(from, to, videoRef.current.duration)
    lastKnownTimeRef.current = to
  }

  function handleRateChange() {
    onRateChange()
  }

  function handleEnded() {
    if (!videoRef.current) return
    onEnd(videoRef.current.currentTime, videoRef.current.duration)
  }

  if (mediaError) return null

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      onLoadedMetadata={handleMetadata}
      onError={handleError}
      onPlay={handlePlay}
      onTimeUpdate={handleTimeUpdate}
      onPause={handlePause}
      onSeeked={handleSeeked}
      onRateChange={handleRateChange}
      onEnded={handleEnded}
      className="h-full w-full rounded-2xl bg-black object-contain"
      playsInline
    />
  )
}

// ── PDF viewer ────────────────────────────────────────────────────────────────

function PdfViewer({
  src,
  resumePage,
  totalPages,
  onExpired,
  onOpenSession,
  onPageChange,
}: {
  src: string
  resumePage: number
  totalPages: number | null
  onExpired: () => void
  onOpenSession: () => void
  onPageChange: (page: number, totalPages: number | null) => void
}) {
  const [currentPage, setCurrentPage] = useState(Math.max(1, resumePage))
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const next = Math.max(1, resumePage)
    setCurrentPage(next)
  }, [resumePage])

  const pageSrc = currentPage > 1 ? `${src}#page=${currentPage}` : src

  useEffect(() => {
    onOpenSession()
  }, [onOpenSession])

  useEffect(() => {
    onPageChange(currentPage, totalPages)
  }, [currentPage, onPageChange, totalPages])

  function movePage(step: number) {
    const maxPage = totalPages ?? Number.MAX_SAFE_INTEGER
    setCurrentPage((prev) => Math.max(1, Math.min(maxPage, prev + step)))
  }

  if (loadFailed) return null

  return (
    <div className="flex flex-col bg-[#05050A]">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-2 text-xs text-white/45">
        <span>
          Page {currentPage}{totalPages ? ` / ${totalPages}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 border-white/10 bg-white/5 px-2.5 text-white/70"
            onClick={() => movePage(-1)}
            disabled={currentPage <= 1}
          >
            Prev
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 border-white/10 bg-white/5 px-2.5 text-white/70"
            onClick={() => movePage(1)}
            disabled={totalPages != null && currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <object
        data={pageSrc}
        type="application/pdf"
        className="h-[75vh] w-full rounded-none border-none bg-transparent"
        onError={() => {
          setLoadFailed(true)
          onExpired()
        }}
      >
        {/* Fallback for browsers that can't embed PDFs */}
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <FileTextIcon className="size-12 text-white/15" />
          <p className="text-sm text-white/50">
            Your browser cannot display this PDF inline.
          </p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/30"
          >
            Open PDF in new tab
          </a>
        </div>
      </object>
    </div>
  )
}

// ── Media expired notice ──────────────────────────────────────────────────────

function MediaExpiredNotice({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <Alert className="border-amber-500/25 bg-amber-500/8">
      <AlertCircleIcon className="size-4 text-amber-400" />
      <AlertTitle className="text-amber-300">Secure media link expired</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-amber-200/70">
        <span>This secure media link has expired (links are valid for 4 hours). Refresh to get a new link.</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-fit border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
        >
          <RefreshCwIcon className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Media
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// ── Viewer skeleton ───────────────────────────────────────────────────────────

function ViewerSkeleton({ type }: { type?: "video" | "pdf" }) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-48 bg-white/8" />
      <Skeleton
        className={`w-full rounded-2xl bg-white/5 ${type === "pdf" ? "h-[70vh]" : "h-64 sm:h-80 lg:h-[50vh]"}`}
      />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3 bg-white/5" />
        <Skeleton className="h-3 w-1/4 bg-white/5" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OnlineContentViewerPage() {
  const navigate = useNavigate()
  const { courseId, contentId } = useParams<{
    courseId: string
    contentId: string
  }>()

  const cId = Number(courseId)
  const ctId = Number(contentId)

  const [course, setCourse] = useState<UserOnlineCourseDetail | null>(null)
  const [media, setMedia] = useState<UserCourseMediaResponse | null>(null)
  const [resume, setResume] = useState<ResumeProgressResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [mediaExpired, setMediaExpired] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const autoAdvanceTimeoutRef = useRef<number | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchContent = useCallback(
    async (showFullLoader = true) => {
      if (!cId || !ctId) return
      if (showFullLoader) setIsLoading(true)
      else setIsRefreshing(true)
      setError(null)
      setMediaExpired(false)

      try {
        // Fetch resume position + media URL in parallel
        const [courseData, resumeData, mediaData] = await Promise.all([
          getMyOnlineCourseById(cId).catch(() => null),
          getContentResumePosition(ctId).catch(() => null),
          openCourseContent(cId, ctId),
        ])
        setCourse(courseData)
        setResume(resumeData)
        setMedia(mediaData)
      } catch (err: unknown) {
        const e = err as { message?: string; status?: number }
        setError({ message: e?.message ?? "Failed to load content.", status: e?.status })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [cId, ctId],
  )

  useEffect(() => {
    fetchContent(true)
  }, [fetchContent])

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current != null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current)
      }
    }
  }, [])

  const {
    displayedCompletion,
    resumePosition: trackedResumePosition,
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
  } = useLearningSession({
    courseId: cId,
    contentId: ctId,
    contentType: media?.content_type ?? null,
    initialResumePosition:
      resume?.playback_position
      ?? media?.progress?.playback_position
      ?? 0,
    initialCompletion:
      media?.progress?.completion_percentage
      ?? resume?.completion_percentage
      ?? 0,
    totalPdfPages: media?.pdf_total_pages ?? null,
    onRealError: (message, status) => {
      // 403 "already completed" is an expected state — use a softer warning.
      // All other session errors (401, 422, network) are surfaced as error toasts
      // so the player stays visible and the user understands what happened.
      if (status === 403 && message.includes("already been completed")) {
        toast.warning(message, { duration: 6000 })
      } else if (status === 401) {
        toast.error(message, { duration: 8000 })
      } else {
        toast.error(message, { duration: 6000 })
      }
    },
    onSessionEnded: (result) => {
      if (result.content_completed) {
        // Mark the current content as completed in the sidebar immediately.
        setCourse((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            modules: prev.modules.map((mod) => ({
              ...mod,
              content: mod.content.map((c) =>
                c.id === ctId
                  ? {
                      ...c,
                      progress: {
                        ...(c.progress ?? { playback_position: 0 }),
                        is_completed: true,
                        completion_percentage: 100,
                      },
                    }
                  : c
              ),
            })),
          }
        })

        if (media?.next_content) {
          toast.success("Content completed! Moving to the next content...", { duration: 3500 })
          if (autoAdvanceTimeoutRef.current != null) {
            window.clearTimeout(autoAdvanceTimeoutRef.current)
          }
          autoAdvanceTimeoutRef.current = window.setTimeout(() => {
            navigate(`/user/online-courses/${cId}/content/${media.next_content!.id}`)
          }, 3000)
        } else {
          toast.success("Content completed! Your progress has been saved.", { duration: 7000 })
        }
      }
    },
  })

  // ── Navigation helpers ────────────────────────────────────────────────────

  async function persistBeforeLeave() {
    if (autoAdvanceTimeoutRef.current != null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current)
      autoAdvanceTimeoutRef.current = null
    }

    if (media?.content_type === "video") {
      await flushProgressSnapshot({ markUnmountHandled: true })
      return
    }

    await endSession({ reason: "route_change" })
  }

  async function goToContent(id: number) {
    await persistBeforeLeave()
    navigate(`/user/online-courses/${cId}/content/${id}`)
  }

  async function goBack() {
    await persistBeforeLeave()
    navigate(`/user/online-courses/${cId}`)
  }

  const resumePos = trackedResumePosition
  const pct = displayedCompletion

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col lg:flex-row bg-[#020205] text-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-[-1.5rem]">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pt-6">
        
        {/* Header / Mobile Toggle */}
        <div className="flex items-center justify-between mb-6 shrink-0 z-10 px-2 lg:px-6">
          <button
            type="button"
            onClick={goBack}
            className="group flex w-fit items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white/60 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white/90 hover:border-white/20 shadow-sm"
          >
            <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Course
          </button>
          
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
          >
            {sidebarOpen ? <XIcon className="size-5" /> : <ListIcon className="size-5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-2 lg:px-6 pb-20">
          {/* ── Loading ── */}
          {isLoading && (
            <ViewerSkeleton type={media?.content_type} />
          )}

          {/* ── Error ── */}
          {!isLoading && error && (
            <div className="flex flex-col items-center gap-5 py-24">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                {error.status === 403 ? (
                  <LockIcon className="size-10 text-white/30" />
                ) : (
                  <AlertCircleIcon className="size-10 text-red-500/70" />
                )}
              </div>
              <div className="space-y-2 text-center max-w-sm">
                <p className="text-xl font-bold tracking-tight text-white/90">
                  {error.status === 403
                    ? "Content locked"
                    : "Failed to load media"}
                </p>
                <p className="text-sm text-white/50 leading-relaxed">
                  {error.status === 403
                    ? "This module is locked or this course is not assigned to your account."
                    : error.message}
                </p>
              </div>
              {error.status !== 403 && (
                <Button
                  variant="outline"
                  onClick={() => fetchContent(true)}
                  className="rounded-full border-white/10 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <RefreshCwIcon className="mr-2 size-4" />
                  Try Again
                </Button>
              )}
            </div>
          )}

          {/* ── Media ── */}
          {!isLoading && media && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-700 w-full relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
              {/* Title + badges */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
                      {media.content_type === "video" ? (
                        <PlayCircleIcon className="size-6 text-indigo-400" />
                      ) : (
                        <FileTextIcon className="size-6 text-violet-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
                        {media.title}
                      </h1>
                      {resumeHint && pct < 100 && !media.progress?.is_completed && (
                        <p className="text-xs uppercase font-medium tracking-widest text-indigo-300/70">
                          {resumeHint}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/5 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70"
                  >
                    {media.content_type}
                  </Badge>
                  {media.duration_seconds > 0 && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/5 backdrop-blur-md px-3.5 py-1.5 text-xs text-white/60"
                    >
                      {formatDuration(media.duration_seconds)}
                    </Badge>
                  )}
                  {(media.progress?.is_completed || sessionSummary?.content_completed || pct >= 100) && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                    >
                      <CheckCircle2Icon className="mr-1.5 size-3.5 inline" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              {sessionSummary && (
                <div className="grid grid-cols-1 gap-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm p-5 sm:grid-cols-2 shadow-inner">
                  <div className="flex items-center gap-3 text-sm text-indigo-100/90">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    <span className="text-indigo-200/80 font-medium tracking-wide">Attention score:</span>
                    <span className="font-bold tabular-nums text-white text-base">{sessionSummary.attention_score}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-indigo-100/90">
                    <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    <span className="text-violet-200/80 font-medium tracking-wide">Course progress:</span>
                    <span className="font-bold tabular-nums text-white text-base">{(Number(sessionSummary.course_progress_percentage) || 0).toFixed(2)}%</span>
                  </div>
                </div>
              )}

              {/* Expired notice */}
              {mediaExpired && (
                <MediaExpiredNotice
                  onRefresh={() => fetchContent(false)}
                  isRefreshing={isRefreshing}
                />
              )}

              {/* ── Video player ── */}
              {media.content_type === "video" && !mediaExpired && (
                <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-[#000] ring-1 ring-white/10 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)]">
                  <VideoPlayer
                    src={media.media_url}
                    resumePosition={resumePos}
                    onExpired={() => setMediaExpired(true)}
                    onStartSession={() => ensureSessionStarted("video")}
                    onProgress={onVideoProgress}
                    onPause={onVideoPause}
                    onSeek={onVideoSeek}
                    onRateChange={onVideoRateChange}
                    onPlay={onVideoPlay}
                    onEnd={onVideoEnd}
                  />
                </div>
              )}

              {/* ── PDF viewer ── */}
              {media.content_type === "pdf" && !mediaExpired && (
                <div className="rounded-[2rem] overflow-hidden border border-white/10 ring-1 ring-black/5 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)]">
                  <PdfViewer
                    src={media.media_url}
                    resumePage={Math.max(1, Math.floor(resumePos))}
                    totalPages={media.pdf_total_pages}
                    onExpired={() => setMediaExpired(true)}
                    onOpenSession={onPdfOpen}
                    onPageChange={onPdfPageChange}
                  />
                </div>
              )}

              {/* Progress bar */}
              {pct > 0 && (
                <div className="space-y-3 mt-4 px-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">
                    <span>Current progress</span>
                    <span className={`tabular-nums ${(pct >= 100 || media.progress?.is_completed) ? "text-emerald-400" : "text-white/80"}`}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-inset ring-white/5">
                    <div
                      className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
                        (pct >= 100 || media.progress?.is_completed)
                          ? "bg-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
                          : "bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Prev / Next navigation */}
              {(media.prev_content || media.next_content) && (
                <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-6">
                  {media.prev_content ? (
                    <button
                      type="button"
                      onClick={() => goToContent(media.prev_content!.id)}
                      className="group flex flex-1 items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/80 transition-colors">
                        <ChevronLeftIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">Previous Module</p>
                        <p className="truncate text-base font-semibold text-white/90 group-hover:text-white">
                          {media.prev_content.title}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {media.next_content ? (
                    <button
                      type="button"
                      onClick={() => goToContent(media.next_content!.id)}
                      className="group flex flex-1 items-center justify-end gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-right transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">Next Module</p>
                        <p className="truncate text-base font-semibold text-white/90 group-hover:text-white">
                          {media.next_content.title}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/80 transition-colors">
                        <ChevronRightIcon className="size-5" />
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar (Modules) ── */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-80 transform border-l border-white/10 bg-[#06060c]/95 backdrop-blur-3xl transition-transform duration-300 lg:static lg:translate-x-0 lg:flex flex-col ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
            <BookOpenIcon className="size-4 text-indigo-400" />
            Curriculum
          </h2>
          <button 
            type="button"
            className="lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon className="size-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 p-4 space-y-6">
          {!course ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
            </div>
          ) : (
            course.modules.map((mod) => (
              <div key={mod.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest px-2">
                  Module {mod.order_number}
                </h3>
                <div className="flex flex-col gap-1">
                  {mod.content.map(c => {
                    const isActive = c.id === ctId
                    const isLocked = !c.is_unlocked
                    const isCompleted = c.progress?.is_completed
                    return (
                      <button
                        type="button"
                        key={c.id}
                        disabled={isLocked}
                        onClick={() => {
                          if (!isLocked && !isActive) goToContent(c.id)
                          setSidebarOpen(false)
                        }}
                        className={`group flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          isActive 
                            ? "bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                            : isLocked 
                              ? "opacity-40 cursor-not-allowed" 
                              : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className={`flex shrink-0 items-center justify-center size-8 rounded-lg ${isActive ? "bg-indigo-500/20 text-indigo-400" : isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/50"}`}>
                          {isLocked ? <LockIcon className="size-3.5" /> : isCompleted ? <CheckCircle2Icon className="size-4" /> : c.content_type === 'video' ? <PlayCircleIcon className="size-3.5" /> : <FileTextIcon className="size-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`truncate text-sm font-medium ${isActive ? "text-indigo-100" : "text-white/80"} ${!isLocked && !isActive ? "group-hover:text-white" : ""}`}>{c.title}</p>
                          <p className="text-[10px] text-white/40 mt-0.5 font-medium">{formatDuration(c.duration_seconds)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  )
}

