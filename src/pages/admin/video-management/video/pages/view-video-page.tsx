// ─── View Video Page ──────────────────────────────────────────────────────────
// Full-page admin view of a single video.
//
// Layout:
//   • Header: title + inline status badge + quick actions
//   • Primary panel: video player (with subtitle track) + cue list (sync-highlighted)
//   • Secondary panel: metadata details + VideoSubtitleCard

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  LayersIcon,
  Loader2Icon,
  PencilIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  VideoIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isApiError } from "@/lib/api"

import {
  getVideoById,
  getVideoStreamUrl,
  getVideoSubtitleContent,
  retryTranscode,
  updateVideo,
} from "../service/video.service"
import type { VideoDetail } from "../types/video.types"
import { VideoSubtitleCard } from "../components/video-subtitle-card"
import { EditVideoSheet } from "../components/edit-video-sheet"
import { getVideoCategories } from "../../categories/service/category.service"
import type { VideoCategory } from "../../categories/types/category.types"

// ── Status config ─────────────────────────────────────────────────────────────

type TranscodeStatus = VideoDetail["transcode_status"]

const STATUS_CONFIG: Record<
  TranscodeStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
    dot: "bg-amber-400",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/15",
    dot: "bg-blue-400 animate-pulse",
  },
  completed: {
    label: "Ready",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15",
    dot: "bg-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/15",
    dot: "bg-red-400",
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes?: number | null): string {
  if (bytes == null) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

// ── VTT cue parser ────────────────────────────────────────────────────────────

interface VttCue {
  idx: number
  start: number // seconds
  end: number   // seconds
  text: string
}

function parseVttTime(ts: string): number {
  const clean = ts.trim().replace(",", ".")
  const parts = clean.split(":")
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  return (
    parseFloat(parts[0]) * 3600 +
    parseFloat(parts[1]) * 60 +
    parseFloat(parts[2])
  )
}

function parseVttCues(content: string): VttCue[] {
  const cues: VttCue[] = []
  const blocks = content.split(/\n\n+/)
  let index = 0
  for (const block of blocks) {
    const lines = block.trim().split("\n")
    const timingIdx = lines.findIndex((l) => l.includes(" --> "))
    if (timingIdx === -1) continue
    const match = lines[timingIdx].match(/([\d:]+[.,]\d+)\s*-->\s*([\d:]+[.,]\d+)/)
    if (!match) continue
    const text = lines
      .slice(timingIdx + 1)
      .join("\n")
      .trim()
    if (!text) continue
    cues.push({ idx: index++, start: parseVttTime(match[1]), end: parseVttTime(match[2]), text })
  }
  return cues
}

function formatCueTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// ── Video player panel ────────────────────────────────────────────────────────

function VideoPlayerPanel({
  videoId,
  subtitleBlobUrl,
  onVideoMount,
}: {
  videoId: number
  subtitleBlobUrl: string | null
  onVideoMount: (el: HTMLVideoElement | null) => void
}) {
  const [streamUrl, setStreamUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const url = await getVideoStreamUrl(videoId)
        if (!cancelled) setStreamUrl(url)
      } catch (err) {
        if (cancelled) return
        if (isApiError(err)) {
          setError(
            err.status === 404
              ? "Video file not found on server."
              : err.message || "Failed to load video.",
          )
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load video stream.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [videoId, reloadCount])

  return (
    <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <VideoIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Video Preview</p>
        </div>
        <div className="flex items-center gap-2">
          {subtitleBlobUrl && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Subtitles
            </span>
          )}
          {error && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setReloadCount((c) => c + 1)}
            >
              <RefreshCwIcon className="mr-1 h-3.5 w-3.5" />
              Retry
            </Button>
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2Icon className="h-6 w-6 animate-spin" />
            <p className="text-xs">Loading video…</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-destructive/80">
            <AlertCircleIcon className="h-6 w-6" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {streamUrl && !isLoading && !error && (
          <video
            ref={(el) => onVideoMount(el)}
            src={streamUrl}
            controls
            className="w-full h-full"
            preload="metadata"
          >
            {subtitleBlobUrl && (
              <track
                kind="subtitles"
                src={subtitleBlobUrl}
                label="Subtitles"
                default
              />
            )}
          </video>
        )}
      </div>
    </div>
  )
}

// ── VTT cue list panel ────────────────────────────────────────────────────────

function VttCuePanel({
  content,
  isLoading,
  error,
  onReload,
  videoEl,
  subtitlePath,
}: {
  content: string | null
  isLoading: boolean
  error: string | null
  onReload: () => void
  videoEl: HTMLVideoElement | null
  subtitlePath: string
}) {
  const [currentTime, setCurrentTime] = useState(0)
  const activeCueRef = useRef<HTMLDivElement>(null)

  const cues = useMemo<VttCue[]>(() => (content ? parseVttCues(content) : []), [content])

  const activeCueIdx = useMemo(() => {
    if (!cues.length) return -1
    return cues.findIndex((c) => currentTime >= c.start && currentTime < c.end)
  }, [cues, currentTime])

  const activeCue = activeCueIdx >= 0 ? cues[activeCueIdx] : null

  // Sync video current time
  useEffect(() => {
    if (!videoEl) return
    const handler = () => setCurrentTime(videoEl.currentTime)
    videoEl.addEventListener("timeupdate", handler)
    return () => videoEl.removeEventListener("timeupdate", handler)
  }, [videoEl])

  // Auto-scroll active cue into view
  useEffect(() => {
    if (activeCueIdx >= 0 && activeCueRef.current) {
      activeCueRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [activeCueIdx])

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-card overflow-hidden h-full">

      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Subtitle Cues</p>
          {cues.length > 0 && (
            <span className="rounded-full border border-white/8 bg-white/5 px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
              {cues.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onReload}
          disabled={isLoading}
        >
          <RefreshCwIcon className={cn("mr-1 h-3.5 w-3.5", isLoading && "animate-spin")} />
          Reload
        </Button>
      </div>

      {/* "Now Playing" banner — only when a cue is active */}
      {activeCue && (
        <div className="shrink-0 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-500/15 to-transparent px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400/60">
            Now playing
          </p>
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {activeCue.text}
          </p>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-indigo-400/50">
            {formatCueTime(activeCue.start)} → {formatCueTime(activeCue.end)}
          </p>
        </div>
      )}

      {/* Cue list — flex-1 so it fills the remaining panel height */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.12) transparent" }}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center text-destructive/80">
            <AlertCircleIcon className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!isLoading && !error && cues.length === 0 && content !== null && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground/50">
            <FileTextIcon className="h-5 w-5 opacity-40" />
            <p className="text-xs">No subtitle cues found in file.</p>
          </div>
        )}
        {!isLoading && !error && cues.length > 0 && (
          <div className="p-2 space-y-0.5">
            {cues.map((cue) => {
              const isActive = cue.idx === activeCueIdx
              return (
                <div
                  key={cue.idx}
                  ref={isActive ? activeCueRef : undefined}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
                    "border-l-2",
                    isActive
                      ? "border-l-indigo-500 bg-indigo-500/12"
                      : "border-l-transparent hover:border-l-white/10 hover:bg-white/4",
                  )}
                >
                  {/* Timestamp pill — click to seek */}
                  <button
                    type="button"
                    className={cn(
                      "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs tabular-nums transition-all",
                      isActive
                        ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                        : "border-white/8 bg-white/5 text-muted-foreground/60 hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400",
                    )}
                    title={`Seek to ${formatCueTime(cue.start)}`}
                    onClick={() => {
                      if (videoEl) {
                        videoEl.currentTime = cue.start
                        videoEl.play().catch(() => null)
                      }
                    }}
                  >
                    {formatCueTime(cue.start)}
                  </button>
                  <p
                    className={cn(
                      "flex-1 text-sm leading-relaxed",
                      isActive ? "font-medium text-foreground" : "text-foreground/65",
                    )}
                  >
                    {cue.text}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer — subtitle path */}
      <div className="shrink-0 border-t border-white/6 px-4 py-2">
        <p className="truncate text-xs text-muted-foreground/35" title={subtitlePath}>
          {subtitlePath}
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ViewVideoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const videoId = Number(id)

  // The video DOM element — shared between player and cue panel for time sync.
  // Using state (not ref) so effects in VttCuePanel re-run when it becomes available.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const handleVideoMount = useCallback((el: HTMLVideoElement | null) => {
    setVideoEl(el)
  }, [])

  const [video, setVideo] = useState<VideoDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [subtitleRevision, setSubtitleRevision] = useState(0)

  // Subtitle state managed here so both the player <track> and the cue panel share one fetch.
  const subtitleBlobUrlRef = useRef<string | null>(null)
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string | null>(null)
  const [subtitleContent, setSubtitleContent] = useState<string | null>(null)
  const [isSubtitleLoading, setIsSubtitleLoading] = useState(false)
  const [subtitleError, setSubtitleError] = useState<string | null>(null)

  // ── Load video + categories ─────────────────────────────────────────────────
  useEffect(() => {
    if (!Number.isInteger(videoId) || videoId <= 0) {
      setError("Invalid video ID.")
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [detail, cats] = await Promise.all([
          getVideoById(videoId),
          getVideoCategories({ per_page: 200 }).catch(() => ({ items: [] as VideoCategory[] })),
        ])
        setVideo(detail)
        setCategories(cats.items)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        if (isApiError(err)) {
          setError(
            err.status === 404 ? "Video not found." : err.message || "Failed to load video.",
          )
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load video.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return () => { controller.abort() }
  }, [videoId])

  // ── Load subtitle content whenever the path or revision changes ─────────────
  useEffect(() => {
    if (!video?.subtitle_vtt_path) {
      setSubtitleContent(null)
      setSubtitleError(null)
      if (subtitleBlobUrlRef.current) {
        URL.revokeObjectURL(subtitleBlobUrlRef.current)
        subtitleBlobUrlRef.current = null
      }
      setSubtitleBlobUrl(null)
      return
    }

    const controller = new AbortController()
    setIsSubtitleLoading(true)
    setSubtitleError(null)

    getVideoSubtitleContent(video.id, controller.signal)
      .then((text) => {
        setSubtitleContent(text)
        const blob = new Blob([text], { type: "text/vtt" })
        const url = URL.createObjectURL(blob)
        if (subtitleBlobUrlRef.current) URL.revokeObjectURL(subtitleBlobUrlRef.current)
        subtitleBlobUrlRef.current = url
        setSubtitleBlobUrl(url)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setSubtitleError(err.message || "Failed to load subtitle.")
      })
      .finally(() => setIsSubtitleLoading(false))

    return () => { controller.abort() }
  }, [video?.subtitle_vtt_path, subtitleRevision])

  // Revoke subtitle blob URL on page unmount
  useEffect(() => {
    return () => {
      if (subtitleBlobUrlRef.current) URL.revokeObjectURL(subtitleBlobUrlRef.current)
    }
  }, [])

  async function handleRetry() {
    if (!video) return
    setIsRetrying(true)
    try {
      const updated = await retryTranscode(video.id)
      setVideo(updated)
      toast.success("Transcode reset — video is queued again.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry transcode.")
    } finally {
      setIsRetrying(false)
    }
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="aspect-video animate-pulse rounded-2xl bg-white/5" />
          <div className="aspect-video animate-pulse rounded-2xl bg-white/5" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="h-80 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/video-management/video")}
          className="w-fit"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!video) return null

  const statusCfg = STATUS_CONFIG[video.transcode_status]
  const thumbnailUrl =
    typeof video.thumbnail_path === "string" ? video.thumbnail_path.trim() : ""

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            <Link
              to="/admin/video-management/video"
              className="hover:underline underline-offset-2"
            >
              Videos
            </Link>
            {" / "}
            <span className="text-foreground/60">{video.name}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">{video.name}</h1>
            <Badge
              variant="outline"
              className={cn("gap-1.5 text-xs", statusCfg.className)}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            #{video.id}
            {video.video_category && (
              <>
                {" · "}
                <span className="text-foreground/60">{video.video_category.name}</span>
              </>
            )}
            {video.duration_seconds != null && (
              <>{" · "}{formatDuration(video.duration_seconds)}</>
            )}
            {video.file_size != null && (
              <>{" · "}{formatFileSize(video.file_size)}</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {video.transcode_status === "failed" && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
              disabled={isRetrying}
              onClick={handleRetry}
            >
              {isRetrying ? (
                <Loader2Icon className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcwIcon className="mr-2 h-3.5 w-3.5" />
              )}
              Retry Transcode
            </Button>
          )}
          {video.transcode_status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
              disabled={isRetrying}
              onClick={handleRetry}
            >
              {isRetrying ? (
                <Loader2Icon className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcwIcon className="mr-2 h-3.5 w-3.5" />
              )}
              Re-transcode
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <PencilIcon className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/video-management/video")}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* ── Primary: player + subtitle cue panel ─────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[3fr_2fr]">
        <VideoPlayerPanel
          videoId={video.id}
          subtitleBlobUrl={subtitleBlobUrl}
          onVideoMount={handleVideoMount}
        />

        {/* Bounded height: fixed on mobile, matches the player's height on lg+
            (the inner panel absolutely fills the stretched grid cell so the
            cue list scrolls internally instead of growing the page). */}
        <div className="relative h-[460px] lg:h-auto">
          <div className="h-full lg:absolute lg:inset-0">
            {video.subtitle_vtt_path ? (
              <VttCuePanel
                key={`vtt-${video.id}-${subtitleRevision}`}
                content={subtitleContent}
                isLoading={isSubtitleLoading}
                error={subtitleError}
                onReload={() => setSubtitleRevision((r) => r + 1)}
                videoEl={videoEl}
                subtitlePath={video.subtitle_vtt_path}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-card/20 p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/5">
                  <FileTextIcon className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/60">No subtitle attached</p>
                  <p className="text-xs text-muted-foreground/40">
                    Upload a <span className="font-mono">.vtt</span> file in the Subtitle panel below
                    to enable live cue tracking.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Secondary: metadata + subtitle management ─────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        {/* Metadata card — thumbnail side-by-side with detail rows */}
        <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Metadata
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* Thumbnail + core fields side by side */}
            <div className="flex gap-5">
              {/* Thumbnail — fixed width, aspect-video */}
              <div className="hidden sm:block w-48 shrink-0">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-background/60">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={`Thumbnail for ${video.name}`}
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center gap-2 text-xs text-muted-foreground/40">
                      <ImageIcon className="h-4 w-4 opacity-40" />
                      No thumbnail
                    </div>
                  )}
                </div>
              </div>

              {/* Core metadata */}
              <div className="flex-1 min-w-0">
                {[
                  { label: "Category",   value: video.video_category?.name ?? null },
                  { label: "Created by", value: video.creator?.name ?? null },
                  { label: "Duration",   value: formatDuration(video.duration_seconds) },
                  { label: "File size",  value: formatFileSize(video.file_size) },
                  { label: "Created",    value: formatDate(video.created_at) },
                  { label: "Updated",    value: formatDate(video.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
                    <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                      {value ?? <span className="italic text-muted-foreground/40">—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail shown on small screens under the data (hidden on sm+) */}
            <div className="sm:hidden overflow-hidden rounded-xl border border-white/10 bg-background/60">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={`Thumbnail for ${video.name}`}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center gap-2 text-xs text-muted-foreground/40">
                  <ImageIcon className="h-4 w-4 opacity-40" />
                  No thumbnail
                </div>
              )}
            </div>

            {/* File paths */}
            <div className="space-y-2 border-t border-white/6 pt-4">
              <div className="flex gap-3 py-1.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/8 bg-white/5">
                  <FileIcon className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">File path</p>
                  <p className="font-mono text-xs text-foreground/80 break-all">{video.file_path}</p>
                </div>
              </div>
              {video.subtitle_vtt_path && (
                <div className="flex gap-3 py-1.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/8 bg-white/5">
                    <FileTextIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Subtitle path</p>
                    <p className="font-mono text-xs text-foreground/80 break-all">{video.subtitle_vtt_path}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div className="border-t border-white/6 pt-4">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Description</p>
                <p className="rounded-xl border border-white/8 bg-white/4 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}

            {/* Available qualities */}
            {video.qualities && video.qualities.length > 0 && (
              <div className="border-t border-white/6 pt-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <LayersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Available Qualities
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {video.qualities.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5"
                    >
                      <Badge variant="secondary" className="font-mono text-xs">
                        {q.quality}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(q.file_size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subtitle management card */}
        <VideoSubtitleCard
          videoId={video.id}
          onSubtitleChange={() => {
            getVideoById(video.id)
              .then((updated) => {
                setVideo(updated)
                setSubtitleRevision((r) => r + 1)
              })
              .catch(() => null)
          }}
        />
      </div>

      {/* ── Edit sheet ────────────────────────────────────────────────────── */}
      <EditVideoSheet
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false)
          toast.success("Video updated.")
          getVideoById(video.id).then(setVideo).catch(() => null)
        }}
        video={video}
        categories={categories}
        onUpdate={updateVideo}
      />
    </div>
  )
}
