// ─── User Online Course — Content Viewer ──────────────────────────────────────
// Route: /user/online-courses/:courseId/content/:contentId

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlayCircleIcon,
  FileTextIcon,
  CheckCircle2Icon,
  GaugeIcon,
  TrophyIcon,
  BookOpenIcon,
  DownloadIcon,
  PaperclipIcon,
  ClockIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isApiError } from "@/lib/api"
import { useDynamicBreadcrumb } from "@/context/breadcrumb"

import { openContent, formatDuration, downloadAttachment } from "./service/user-online-courses.service"
import type { ContentViewerData, SessionEndData } from "./types/user-online-courses.types"
import { useLearningSession } from "./hooks/use-learning-session"
import { VideoPlayer } from "./components/video-player"

const PdfViewer = lazy(() =>
  import("./components/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
)

// ── Circular progress ring ────────────────────────────────────────────────────

const RING_R = 42
const RING_CIRC = 2 * Math.PI * RING_R

function ProgressRing({ pct, done, label }: { pct: number; done: boolean; label: string }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const offset = RING_CIRC * (1 - clamped / 100)
  return (
    <div className="relative size-[116px]">
      <svg viewBox="0 0 108 108" className="size-full -rotate-90">
        <circle cx="54" cy="54" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        <circle
          cx="54" cy="54" r={RING_R}
          fill="none"
          stroke={done ? "#10b981" : "#6366f1"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.55s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className={`text-[26px] font-black tabular-nums leading-none ${done ? "text-emerald-400" : "text-white"}`}>
          {clamped}%
        </span>
        <span className="text-[9px] uppercase tracking-widest text-white/30">{label}</span>
      </div>
    </div>
  )
}

// ── Attention score helpers ───────────────────────────────────────────────────

// Watched-percentage at which a video counts as complete — the ring turns
// green, the "Done" badge shows, the next item unlocks, and the completion
// toast + auto-advance fire. Requires a full watch-through (100%).
const AUTO_ADVANCE_PCT = 100

// Persist the last video session result per content item so the "Session results"
// card stays visible when the learner leaves and returns (e.g. Previous → back).
const sessionResultKey = (contentId: number) => `pne-session-result-${contentId}`

function attentionMeta(score: number) {
  if (score >= 90) return { label: "Excellent", barCls: "bg-emerald-500", textCls: "text-emerald-400", desc: "You stayed highly focused throughout — very little skipping, pausing, or time away from the video." }
  if (score >= 70) return { label: "Good",      barCls: "bg-indigo-500",  textCls: "text-indigo-300",  desc: "Solid focus with only a few interruptions. Try to keep distractions to a minimum next time." }
  if (score >= 50) return { label: "Average",   barCls: "bg-amber-500",   textCls: "text-amber-400",   desc: "Your focus dipped during parts of the video — some skipping or time away from the page." }
  return              { label: "Low focus",   barCls: "bg-red-500",     textCls: "text-red-400",     desc: "A lot of skipping, pausing, or time away from the video. Rewatch the key parts to get the most out of it." }
}

// ── Inner viewer (remounted per content item) ─────────────────────────────────

function Viewer({ courseId, contentId }: { courseId: number; contentId: number }) {
  const navigate = useNavigate()
  const [data, setData] = useState<ContentViewerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfCompletion, setPdfCompletion] = useState<{ pct: number; done: boolean } | null>(null)
  // Last saved session result for this content (Viewer remounts per contentId,
  // so a lazy initializer reads the right one once on mount).
  const [persistedResult] = useState<SessionEndData | null>(() => {
    try {
      const raw = localStorage.getItem(sessionResultKey(contentId))
      return raw ? (JSON.parse(raw) as SessionEndData) : null
    } catch {
      return null
    }
  })
  const [resultExpanded, setResultExpanded] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const hasToastedRef = useRef(false)
  const hasAutoAdvancedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setIsLoading(true)
      setError(null)
      hasToastedRef.current = false
      hasAutoAdvancedRef.current = false
      setVideoEnded(false)
      try {
        const res = await openContent(courseId, contentId)
        if (!cancelled) setData(res.data)
      } catch (err) {
        if (cancelled) return
        if (isApiError(err)) {
          setError(
            err.status === 403
              ? "This content is locked — finish the previous module first."
              : err.status === 404
                ? "Content not found."
                : err.message || "Failed to open this content.",
          )
        } else if (err instanceof Error) setError(err.message)
        else setError("Failed to open this content.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [courseId, contentId])

  useDynamicBreadcrumb(data?.title)

  const isVideo = data?.content_type === "video"
  const alreadyCompleted = data?.progress?.is_completed ?? false
  const session = useLearningSession({ courseId, contentId, alreadyCompleted })

  // Toast on video content completion
  useEffect(() => {
    if (session.result?.content_completed && !hasToastedRef.current) {
      hasToastedRef.current = true
      toast.success("Video completed!", { description: "Great work! Your progress has been saved." })
    }
  }, [session.result?.content_completed])

  // Toast on PDF completion
  useEffect(() => {
    if (pdfCompletion?.done && !hasToastedRef.current) {
      hasToastedRef.current = true
      toast.success("Document completed!", { description: "You've read all the pages. Well done!" })
    }
  }, [pdfCompletion?.done])

  // Persist the live session result to storage so the card can be restored on a
  // later visit. Write-only sync to an external system (no local state update).
  useEffect(() => {
    if (session.result) {
      try {
        localStorage.setItem(sessionResultKey(contentId), JSON.stringify(session.result))
      } catch { /* ignore quota / privacy-mode errors */ }
    }
  }, [session.result, contentId])

  const goTo = useCallback(
    (id: number) => navigate(`/user/online-courses/${courseId}/content/${id}`),
    [navigate, courseId],
  )

  // Full completion: once the learner reaches 100% watched (or the video fires
  // its native "ended" event), notify them and automatically move on to the
  // next item after a short pause so they have time to read the toast.
  useEffect(() => {
    if (!isVideo || hasAutoAdvancedRef.current) return
    if (session.liveContentPct < AUTO_ADVANCE_PCT && !videoEnded) return
    hasAutoAdvancedRef.current = true
    toast.success("Video complete!", {
      description: data?.next_content ? "Moving on to the next item…" : "Great work — you've finished this video.",
    })
    if (data?.next_content) {
      const nextId = data.next_content.id
      const timer = setTimeout(() => goTo(nextId), 1800)
      return () => clearTimeout(timer)
    }
  }, [isVideo, session.liveContentPct, videoEnded, data?.next_content, goTo])

  const [isDownloading, setIsDownloading] = useState(false)
  const handleAttachmentDownload = useCallback(async () => {
    if (!data?.attachment_path) return
    setIsDownloading(true)
    try {
      const blob = await downloadAttachment(courseId, contentId)
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = data.attachment_name ?? "attachment"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error("Download failed", {
        description: "Could not fetch the attachment. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }, [courseId, contentId, data?.attachment_path, data?.attachment_name])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-white/40">
        <Loader2Icon className="size-5 animate-spin" /> Loading content…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-400">
        <AlertCircleIcon className="size-4" />
        <AlertTitle>Unable to open content</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error ?? "Something went wrong."}</span>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/user/online-courses/${courseId}`)}
            className="shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300">
            Back to course
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const savedPct = Math.round(data.progress?.completion_percentage ?? 0)

  // Ring: live content-item completion — updates every 1% while watching/reading
  const contentPct = isVideo
    ? Math.max(session.liveContentPct, savedPct)
    : (pdfCompletion ? Math.round(pdfCompletion.pct) : savedPct)

  // Linear bar: course-wide progress — updated by the session-end result
  const coursePct = session.result
    ? Math.round(session.result.course_progress_percentage)
    : savedPct

  // A video is "done" only once watched 100% live (or ended natively), or the
  // backend/session already recorded completion.
  const contentDone = isVideo
    ? (session.result?.content_completed || alreadyCompleted || contentPct >= AUTO_ADVANCE_PCT || videoEnded)
    : (pdfCompletion?.done ?? alreadyCompleted)

  // Prefer the live result; fall back to the persisted one so the card survives
  // navigating away and back to an already-completed video.
  const shownResult = session.result ?? persistedResult
  const attn = shownResult ? attentionMeta(shownResult.attention_score) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_296px]">

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-5">

        {/* Content header */}
        <div className="flex items-center gap-3">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            isVideo ? "bg-sky-500/15 text-sky-400" : "bg-amber-500/15 text-amber-400"
          }`}>
            {isVideo ? <PlayCircleIcon className="size-5" /> : <FileTextIcon className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight text-white">{data.title}</h1>
            <p className="mt-0.5 text-xs text-white/40">
              <span className="capitalize">{data.content_type}</span>
              {isVideo && data.duration_seconds > 0 && ` · ${formatDuration(data.duration_seconds)}`}
              {!isVideo && data.pdf_total_pages != null && ` · ${data.pdf_total_pages} pages`}
            </p>
          </div>
          {contentDone && (
            <Badge variant="outline"
              className="shrink-0 gap-1 rounded-full border-emerald-500/25 bg-emerald-500/15 text-[11px] text-emerald-400">
              <CheckCircle2Icon className="size-3" />Done
            </Badge>
          )}
        </div>

        {/* Player / viewer */}
        {isVideo ? (
          <VideoPlayer
            src={data.media_url}
            resumePosition={data.progress?.playback_position ?? 0}
            qualities={data.qualities ?? []}
            subtitleUrl={data.subtitle_url ?? null}
            onPlay={session.handlePlay}
            onPause={session.handlePause}
            onSeek={session.handleSeek}
            onSpeedChange={session.handleSpeedChange}
            onFullscreen={session.handleFullscreen}
            onTimeUpdate={session.handleTimeUpdate}
            onEnded={() => {
              session.handleEnded()
              setVideoEnded(true)
            }}
          />
        ) : (
          <Suspense fallback={
            <div className="flex min-h-[60vh] items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#0c0c14] text-sm text-white/40">
              <Loader2Icon className="size-5 animate-spin" /> Loading PDF viewer…
            </div>
          }>
            <PdfViewer
              src={data.media_url}
              courseId={courseId}
              contentId={contentId}
              totalPages={data.pdf_total_pages}
              resumePage={data.progress?.playback_position ?? 0}
              fileName={data.title}
              onProgress={(pct, done) => setPdfCompletion({ pct, done })}
            />
          </Suspense>
        )}

        {/* Prev / Next navigation */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {data.prev_content ? (
            <button type="button" onClick={() => goTo(data.prev_content!.id)}
              className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/14 hover:bg-white/[0.06]">
              <ChevronLeftIcon className="size-4 shrink-0 text-white/35 transition-transform group-hover:-translate-x-0.5" />
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] uppercase tracking-wider text-white/30">Previous</p>
                <p className="truncate text-sm font-medium text-white/75">{data.prev_content.title}</p>
              </div>
            </button>
          ) : <span />}

          {data.next_content ? (
            <button
              type="button"
              onClick={() => {
                if (!contentDone) {
                  toast.warning("Finish this content first", {
                    description: isVideo
                      ? "Finish watching this video to unlock the next item."
                      : "Read through all pages to unlock the next item.",
                  })
                  return
                }
                goTo(data.next_content!.id)
              }}
              className={`group flex items-center justify-end gap-3 rounded-xl border px-4 py-3 text-right transition-colors ${
                contentDone
                  ? "border-indigo-500/20 bg-indigo-500/[0.07] hover:border-indigo-500/35 hover:bg-indigo-500/[0.12]"
                  : "cursor-not-allowed border-white/8 bg-white/[0.03] opacity-50"
              }`}
            >
              <div className="min-w-0">
                <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${contentDone ? "text-indigo-400/60" : "text-white/30"}`}>Up next</p>
                <p className={`truncate text-sm font-medium ${contentDone ? "text-indigo-200" : "text-white/40"}`}>{data.next_content.title}</p>
              </div>
              <ChevronRightIcon className={`size-4 shrink-0 transition-transform ${contentDone ? "text-indigo-400 group-hover:translate-x-0.5" : "text-white/25"}`} />
            </button>
          ) : (
            <button type="button" onClick={() => navigate(`/user/online-courses/${courseId}`)}
              className="group flex items-center justify-end gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-right transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/[0.12]">
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] uppercase tracking-wider text-emerald-400/60">Finished</p>
                <p className="truncate text-sm font-medium text-emerald-200">Back to course</p>
              </div>
              <BookOpenIcon className="size-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="space-y-4">

        {/* Expected time card — target = video duration × 2 */}
        {isVideo && data.duration_seconds > 0 && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/80">
              <ClockIcon className="size-4 text-indigo-400" />Expected Time
            </h2>
            <p className="text-sm leading-relaxed text-white/55">
              You are expected to complete this video within{" "}
              <span className="font-semibold text-white">
                {Math.max(1, Math.round((data.duration_seconds * 2) / 60))} minutes
              </span>
              .
            </p>
          </div>
        )}

        {/* Progress card */}
        <div className="rounded-2xl border border-white/8 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Your progress</h2>
            {session.isEnding && (
              <span className="flex items-center gap-1.5 text-[11px] text-white/35">
                <Loader2Icon className="size-3 animate-spin" />Saving…
              </span>
            )}
          </div>

          {/* Circular ring — live content completion */}
          <div className="my-5 flex flex-col items-center gap-3">
            <ProgressRing pct={contentPct} done={contentDone} label={isVideo ? "watched" : "read"} />
            {contentDone ? (
              <Badge variant="outline"
                className="gap-1.5 rounded-full border-emerald-500/25 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                <CheckCircle2Icon className="size-3.5" />Completed
              </Badge>
            ) : (
              <p className="max-w-[180px] text-center text-[11px] leading-relaxed text-white/35">
                {isVideo
                  ? "Finish watching this video to mark it complete."
                  : "Turn through every page to complete this document."}
              </p>
            )}
          </div>

          {/* Course-wide progress linear bar */}
          <div className="space-y-1.5 border-t border-white/6 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Course overall</span>
              <span className={`font-semibold tabular-nums ${contentDone ? "text-emerald-400" : "text-indigo-300"}`}>
                {coursePct}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  contentDone ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400"
                }`}
                style={{ width: `${coursePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Attachment download */}
        {data.attachment_path && (
          <div className="rounded-2xl border border-white/8 bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
              <PaperclipIcon className="size-4 text-white/40" />Attachment
            </h2>
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleAttachmentDownload}
              className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 transition-colors group-hover:bg-indigo-500/25">
                {isDownloading
                  ? <Loader2Icon className="size-4 animate-spin" />
                  : <FileTextIcon className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white/80 group-hover:text-white">
                  {data.attachment_name ?? "Download attachment"}
                </span>
                <span className="text-[11px] text-white/35">
                  {isDownloading ? "Downloading…" : "Click to download"}
                </span>
              </span>
              <DownloadIcon className="size-4 shrink-0 text-white/30 transition-colors group-hover:text-indigo-400" />
            </button>
          </div>
        )}

        {/* Session summary — shown after a video session ends, and again on return.
            Click the header to expand a breakdown of the focus score. */}
        {isVideo && shownResult && attn && (
          <div className="rounded-2xl border border-white/8 bg-card p-5">
            <button
              type="button"
              onClick={() => setResultExpanded((v) => !v)}
              aria-expanded={resultExpanded}
              className="flex w-full items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              <GaugeIcon className="size-4 text-indigo-400" />Session results
              <span className="ml-auto flex items-center gap-1 text-[11px] font-normal text-white/35">
                {resultExpanded ? "Hide" : "Details"}
                <ChevronDownIcon className={`size-4 transition-transform ${resultExpanded ? "rotate-180" : ""}`} />
              </span>
            </button>

            <div className="mt-4 flex items-center gap-4">
              <div className={`flex size-[60px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${
                shownResult.attention_score >= 70
                  ? "border-indigo-500/30 bg-indigo-500/10"
                  : "border-white/10 bg-white/5"
              }`}>
                <span className={`text-[22px] font-black tabular-nums leading-none ${attn.textCls}`}>
                  {shownResult.attention_score}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-white/25">/ 100</span>
              </div>
              <div className="space-y-1">
                <p className={`flex items-center gap-1.5 text-sm font-semibold ${attn.textCls}`}>
                  <TrophyIcon className="size-3.5 text-amber-400" />{attn.label}
                </p>
                <p className="text-xs text-white/40">
                  {shownResult.content_completed
                    ? "Content marked complete ✓"
                    : "Keep watching to complete"}
                </p>
              </div>
            </div>

            {/* Attention score bar */}
            <div className="mt-4 space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${attn.barCls}`}
                  style={{ width: `${shownResult.attention_score}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-white/20">
                <span>Low</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Expanded breakdown */}
            {resultExpanded && (
              <div className="mt-4 space-y-3 border-t border-white/6 pt-4">
                <p className="text-xs leading-relaxed text-white/50">{attn.desc}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">Focus score</p>
                    <p className={`text-sm font-semibold tabular-nums ${attn.textCls}`}>{shownResult.attention_score}/100</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">Course progress</p>
                    <p className="text-sm font-semibold tabular-nums text-white/80">{coursePct}%</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">This video</p>
                    <p className={`text-sm font-semibold ${shownResult.content_completed ? "text-emerald-400" : "text-white/70"}`}>
                      {shownResult.content_completed ? "Completed" : "In progress"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">Rating</p>
                    <p className={`text-sm font-semibold ${attn.textCls}`}>{attn.label}</p>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-white/30">
                  Your focus score reflects how consistently you watched — pausing, skipping ahead, or
                  leaving the tab lowers it.
                </p>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

// ── Route component ────────────────────────────────────────────────────────────

export function OnlineContentViewerPage() {
  const navigate = useNavigate()
  const { courseId: courseIdParam, contentId: contentIdParam } = useParams<{ courseId: string; contentId: string }>()
  const courseId = Number(courseIdParam)
  const contentId = Number(contentIdParam)
  const valid = Number.isInteger(courseId) && courseId > 0 && Number.isInteger(contentId) && contentId > 0

  return (
    <div className="flex flex-col gap-5 text-white">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/user/online-courses/${courseId}`)}
        className="-ml-2 w-fit gap-2 rounded-full text-white/50 hover:text-white">
        <ArrowLeftIcon className="size-4" />Back to course
      </Button>

      {valid ? (
        <Viewer key={contentId} courseId={courseId} contentId={contentId} />
      ) : (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-400">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Invalid content</AlertTitle>
          <AlertDescription>This content link is not valid.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
