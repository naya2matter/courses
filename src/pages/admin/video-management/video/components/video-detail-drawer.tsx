// ─── Video Detail Drawer ──────────────────────────────────────────────────────
// Right-side drawer that shows full video details.
// Fetches GET /admin/videos/getById/{id} when opened.

import { useEffect, useState } from "react"
import {
  XIcon,
  Loader2Icon,
  AlertCircleIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  VideoIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  HardDriveIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer"

import { getVideoById, retryTranscode } from "../service/video.service"
import type { VideoDetail } from "../types/video.types"
import { VideoSubtitleCard } from "./video-subtitle-card"

// ── Props ─────────────────────────────────────────────────────────────────────

interface VideoDetailDrawerProps {
  videoId: number | null
  onClose: () => void
  /** Called after a successful retry so the parent list can refresh. */
  onRetry?: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type TranscodeStatus = VideoDetail["transcode_status"]

const STATUS_CONFIG: Record<
  TranscodeStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
  },
  processing: {
    label: "Processing",
    className:
      "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/15",
  },
  completed: {
    label: "Ready",
    className:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15",
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/15",
  },
}

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
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
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
          {value ?? "—"}
        </p>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VideoDetailDrawer({ videoId, onClose, onRetry }: VideoDetailDrawerProps) {
  const [video, setVideo] = useState<VideoDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const open = videoId !== null

  useEffect(() => {
    if (!open || videoId == null) {
      setVideo(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getVideoById(videoId)
      .then((data) => {
        if (!cancelled) setVideo(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof Error ? err.message : "Failed to load video details."
        setError(msg)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [videoId, open])

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      direction="right"
    >
      <DrawerContent className="sm:max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <DrawerHeader className="flex-row items-center justify-between gap-2 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <VideoIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <DrawerTitle className="text-sm font-semibold leading-tight line-clamp-1">
                {video ? video.name : "Video Details"}
              </DrawerTitle>
              <DrawerDescription className="text-xs">
                Full video information
              </DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <XIcon className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2Icon className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading details…</p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertCircleIcon className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Failed to load details</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (videoId != null) {
                    setError(null)
                    setIsLoading(true)
                    getVideoById(videoId)
                      .then(setVideo)
                      .catch((err) => {
                        const msg =
                          err instanceof Error ? err.message : "Failed to load video details."
                        setError(msg)
                      })
                      .finally(() => setIsLoading(false))
                  }
                }}
              >
                <RefreshCwIcon className="mr-2 h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && video && (
            <div className="px-5 pb-6">
              {/* Status badge + retry button */}
              <div className="flex items-center gap-2 py-4 border-b border-white/8">
                <Badge
                  variant="outline"
                  className={cn("text-xs", STATUS_CONFIG[video.transcode_status].className)}
                >
                  {STATUS_CONFIG[video.transcode_status].label}
                </Badge>
                {video.id && (
                  <span className="text-xs text-muted-foreground">ID #{video.id}</span>
                )}
                {video.transcode_status === "failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-7 px-2.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                    disabled={isRetrying}
                    onClick={async () => {
                      if (videoId == null) return
                      setIsRetrying(true)
                      try {
                        await retryTranscode(videoId)
                        toast.success("Transcode reset — video is queued again.")
                        onRetry?.()
                        // Re-fetch detail to show updated status
                        const updated = await getVideoById(videoId)
                        setVideo(updated)
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Failed to retry transcode.",
                        )
                      } finally {
                        setIsRetrying(false)
                      }
                    }}
                  >
                    {isRetrying ? (
                      <Loader2Icon className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcwIcon className="mr-1.5 h-3 w-3" />
                    )}
                    Retry Transcode
                  </Button>
                )}
              </div>

              {/* Details */}
              <div className="mt-2">
                <DetailRow icon={TagIcon} label="Category" value={video.video_category?.name} />
                <DetailRow icon={UserIcon} label="Created by" value={video.creator?.name} />
                <DetailRow icon={ClockIcon} label="Duration" value={formatDuration(video.duration_seconds)} />
                <DetailRow icon={HardDriveIcon} label="File size" value={formatFileSize(video.file_size)} />
                <DetailRow icon={FileIcon} label="File path" value={video.file_path} mono breakAll />
                {video.thumbnail_path && (
                  <DetailRow icon={ImageIcon} label="Thumbnail path" value={video.thumbnail_path} mono breakAll />
                )}
                {video.subtitle_vtt_path && (
                  <DetailRow icon={FileTextIcon} label="Subtitle VTT" value={video.subtitle_vtt_path} mono breakAll />
                )}
                <DetailRow icon={CalendarIcon} label="Created" value={formatDate(video.created_at)} />
                <DetailRow icon={CalendarIcon} label="Updated" value={formatDate(video.updated_at)} />
              </div>

              {/* Description */}
              {video.description && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1.5">Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg bg-white/4 border border-white/8 p-3">
                    {video.description}
                  </p>
                </div>
              )}

              {/* Qualities */}
              {video.qualities && video.qualities.length > 0 && (
                <div className="mt-5">
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
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                          {q.file_path}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtitle management */}
              <div className="mt-5">
                <VideoSubtitleCard
                  videoId={video.id}
                  onSubtitleChange={() => {
                    // Re-fetch the full video detail so subtitle_vtt_path stays in sync
                    if (videoId != null) {
                      getVideoById(videoId).then(setVideo).catch(() => null)
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
