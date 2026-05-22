// ─── View Video Page ──────────────────────────────────────────────────────────
// Full-page admin view of a single video.
//
// Layout:
//   • Top: page header (title, breadcrumb, edit / retry / back actions)
//   • Primary panel: video player (left) ↔ VTT subtitle content viewer (right)
//     so the admin can watch the video while reading the cue text side-by-side.
//   • Secondary panel: metadata details + VideoSubtitleCard (manage subtitle)

import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  FileIcon,
  FileTextIcon,
  HardDriveIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  TagIcon,
  UserIcon,
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
  getVideoStreamBlobUrl,
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

const STATUS_CONFIG: Record<TranscodeStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/15",
  },
  completed: {
    label: "Ready",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/15",
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
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
  breakAll = false,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  mono?: boolean
  breakAll?: boolean
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-white/6 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 border border-white/8">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p
          className={cn(
            "text-sm text-foreground",
            mono && "font-mono text-xs",
            breakAll && "break-all",
          )}
        >
          {value ?? <span className="italic text-muted-foreground/60">—</span>}
        </p>
      </div>
    </div>
  )
}

// ── Video player panel ────────────────────────────────────────────────────────

function VideoPlayerPanel({ videoId }: { videoId: number }) {
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let activeUrl: string | null = null
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const url = await getVideoStreamBlobUrl(videoId, controller.signal)
        activeUrl = url
        setBlobUrl(url)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        if (isApiError(err)) {
          setError(err.status === 404 ? "Video file not found on server." : (err.message || "Failed to load video."))
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load video stream.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()

    return () => {
      controller.abort()
      if (activeUrl) URL.revokeObjectURL(activeUrl)
    }
  }, [videoId, reloadCount])

  return (
    <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <VideoIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Video Preview</p>
        </div>
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

      <div className="relative aspect-video bg-black/60">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2Icon className="h-6 w-6 animate-spin" />
            <p className="text-xs">Loading video… this may take a moment for large files.</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-destructive/80 p-6 text-center">
            <AlertCircleIcon className="h-6 w-6" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {blobUrl && !isLoading && !error && (
          <video
            src={blobUrl}
            controls
            className="w-full h-full"
            preload="metadata"
          />
        )}
      </div>
    </div>
  )
}

// ── VTT content viewer panel ──────────────────────────────────────────────────

function VttContentPanel({ videoId, subtitlePath }: { videoId: number; subtitlePath: string }) {
  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const text = await getVideoSubtitleContent(videoId, controller.signal)
        setContent(text)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        if (isApiError(err)) {
          setError(err.status === 404 ? "Subtitle file not found on server." : (err.message || "Failed to load subtitle."))
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load subtitle content.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()

    return () => { controller.abort() }
  }, [videoId, reloadCount])

  // Count cue blocks (lines starting with a timestamp like "00:00:")
  const cueCount = content.split("\n").filter((l) => /^\d{2}:\d{2}/.test(l.trim())).length

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Subtitle Content (VTT)</p>
        </div>
        <div className="flex items-center gap-2">
          {cueCount > 0 && (
            <span className="text-xs text-muted-foreground">{cueCount} cues</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setReloadCount((c) => c + 1)}
            disabled={isLoading}
          >
            <RefreshCwIcon className={cn("mr-1 h-3.5 w-3.5", isLoading && "animate-spin")} />
            Reload
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
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
        {!isLoading && !error && (
          <pre className="overflow-auto h-full max-h-96 p-4 text-xs font-mono text-foreground/85 leading-relaxed whitespace-pre-wrap break-all">
            {content || <span className="italic text-muted-foreground/60">Empty subtitle file.</span>}
          </pre>
        )}
      </div>

      <div className="px-4 py-2 border-t border-white/6 shrink-0">
        <p className="text-xs text-muted-foreground/60 truncate">
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

  const [video, setVideo] = useState<VideoDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [categories, setCategories] = useState<VideoCategory[]>([])

  // Track whether a subtitle has just been added/removed so we can re-render
  // the VTT panel with a fresh key.
  const [subtitleRevision, setSubtitleRevision] = useState(0)

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
          setError(err.status === 404 ? "Video not found." : (err.message || "Failed to load video."))
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
        <div className="flex items-center gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className="aspect-video animate-pulse rounded-2xl bg-white/5" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
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
  const thumbnailUrl = typeof video.thumbnail_path === "string" ? video.thumbnail_path.trim() : ""

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <Link
              to="/admin/video-management/video"
              className="hover:underline underline-offset-2"
            >
              Videos
            </Link>
            {" / "}
            <span>{video.name}</span>
          </p>
          <h1 className="text-2xl font-bold tracking-tight line-clamp-2">{video.name}</h1>
          <p className="text-xs text-muted-foreground">ID #{video.id}</p>
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
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <PencilIcon className="mr-2 h-3.5 w-3.5" />
            Edit Video
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

      {/* ── Status badge ────────────────────────────────────────────────────── */}
      <Badge variant="outline" className={cn("text-xs", statusCfg.className)}>
        {statusCfg.label}
      </Badge>

      {/* ── Primary: player + VTT viewer side by side ────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Video player */}
        <VideoPlayerPanel videoId={video.id} />

        {/* VTT content viewer — only shown when a subtitle exists */}
        {video.subtitle_vtt_path ? (
          <VttContentPanel
            key={`vtt-${video.id}-${subtitleRevision}`}
            videoId={video.id}
            subtitlePath={video.subtitle_vtt_path}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-card/50 p-10 text-center text-muted-foreground">
            <FileTextIcon className="h-8 w-8 opacity-30" />
            <div>
              <p className="text-sm font-medium">No subtitle attached</p>
              <p className="text-xs mt-1 opacity-70">
                Upload a .vtt file using the Subtitle panel below to enable the content viewer.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Secondary: metadata + subtitle card ─────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

        {/* Metadata */}
        <div className="rounded-2xl border border-white/10 bg-card p-5 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Metadata
          </p>

          <div className="mb-5 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Thumbnail</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/60">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={`Thumbnail for ${video.name}`}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center px-6 text-sm text-muted-foreground">
                  No thumbnail uploaded
                </div>
              )}
            </div>
          </div>

          <DetailRow icon={TagIcon} label="Category" value={video.video_category?.name} />
          <DetailRow icon={UserIcon} label="Created by" value={video.creator?.name} />
          <DetailRow icon={ClockIcon} label="Duration" value={formatDuration(video.duration_seconds)} />
          <DetailRow icon={HardDriveIcon} label="File size" value={formatFileSize(video.file_size)} />
          <DetailRow icon={FileIcon} label="File path" value={video.file_path} mono breakAll />
          {video.subtitle_vtt_path && (
            <DetailRow icon={FileTextIcon} label="Subtitle path" value={video.subtitle_vtt_path} mono breakAll />
          )}
          <DetailRow icon={CalendarIcon} label="Created" value={formatDate(video.created_at)} />
          <DetailRow icon={CalendarIcon} label="Updated" value={formatDate(video.updated_at)} />

          {video.description && (
            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg bg-white/4 border border-white/8 p-3">
                {video.description}
              </p>
            </div>
          )}

          {video.qualities && video.qualities.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Available Qualities
              </p>
              <div className="space-y-2">
                {video.qualities.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-white/4 border border-white/8 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {q.quality}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(q.file_size)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-48">
                      {q.file_path}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subtitle management card */}
        <VideoSubtitleCard
          videoId={video.id}
          onSubtitleChange={() => {
            // Re-fetch the video so subtitle_vtt_path is updated,
            // then bump revision so VttContentPanel re-mounts.
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
