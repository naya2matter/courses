// ─── Edit Video Sheet ─────────────────────────────────────────────────────────
// Slide-in sheet for editing a video's metadata.
// file_path is immutable — it is not shown or sent in the update payload.

import { useEffect, useRef, useState } from "react"
import {
  Loader2Icon,
  AlertCircleIcon,
  ImageIcon,
  VideoIcon,
  ClockIcon,
  HardDriveIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { isApiError } from "@/lib/api"
import type { Video, UpdateVideoPayload, VideoDetail } from "../types/video.types"
import type { VideoCategory } from "../../categories/types/category.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface EditVideoSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  video: Video | null
  categories: VideoCategory[]
  onUpdate: (id: number, payload: UpdateVideoPayload) => Promise<VideoDetail>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

const STATUS_STYLE: Record<
  Video["transcode_status"],
  { label: string; dot: string; text: string }
> = {
  completed:  { label: "Ready",      dot: "bg-emerald-400", text: "text-emerald-400" },
  failed:     { label: "Failed",     dot: "bg-red-400",     text: "text-red-400"     },
  processing: { label: "Processing", dot: "bg-blue-400",    text: "text-blue-400"    },
  pending:    { label: "Pending",    dot: "bg-amber-400",   text: "text-amber-400"   },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditVideoSheet({
  open,
  onClose,
  onSuccess,
  video,
  categories,
  onUpdate,
}: EditVideoSheetProps) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [durationSeconds, setDurationSeconds] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Prefill form when sheet opens ─────────────────────────────────────────

  useEffect(() => {
    if (open && video) {
      setName(video.name)
      setCategoryId(video.video_category?.id != null ? String(video.video_category.id) : "")
      setDescription(video.description ?? "")
      setDurationSeconds(video.duration_seconds != null ? String(video.duration_seconds) : "")
      setThumbnailFile(null)
      setThumbnailPreviewUrl(typeof video.thumbnail_path === "string" ? video.thumbnail_path.trim() : "")
      setSubmitError(null)
    }
  }, [open, video])

  useEffect(() => {
    if (!thumbnailFile) return
    const objectUrl = URL.createObjectURL(thumbnailFile)
    setThumbnailPreviewUrl(objectUrl)
    return () => { URL.revokeObjectURL(objectUrl) }
  }, [thumbnailFile])

  const detail = video as VideoDetail | null
  const qualities = detail?.qualities
  const subtitleVttPath = detail?.subtitle_vtt_path
  const status = video?.transcode_status ?? "pending"
  const statusStyle = STATUS_STYLE[status]

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleClose() {
    if (isSubmitting) return
    setSubmitError(null)
    onClose()
  }

  function handleClearThumbnailSelection() {
    setThumbnailFile(null)
    setThumbnailPreviewUrl(typeof video?.thumbnail_path === "string" ? video.thumbnail_path.trim() : "")
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!video) return
    setSubmitError(null)

    if (!name.trim()) { setSubmitError("Name is required."); return }
    if (!categoryId) { setSubmitError("Please select a category."); return }

    const payload: UpdateVideoPayload = {
      name: name.trim(),
      video_category_id: Number(categoryId),
      description: description.trim() || null,
      duration_seconds: durationSeconds !== "" ? Number(durationSeconds) : null,
      thumbnail: thumbnailFile,
    }

    setIsSubmitting(true)
    try {
      await onUpdate(video.id, payload)
      onSuccess()
      handleClose()
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const messages = Object.values(err.data.errors as Record<string, string[]>)
            .flat().slice(0, 3)
          setSubmitError(messages.join(" "))
        } else {
          setSubmitError(err.message || "Failed to update video.")
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError("An unexpected error occurred.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl border-l border-white/10">

        {/* ── Header: thumbnail + video name + status ─────────────────────── */}
        <SheetHeader className="shrink-0 border-b border-white/10 px-6 py-5">
          <div className="flex items-start gap-4">
            {/* Mini thumbnail preview */}
            <div className="relative h-[52px] w-[84px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {thumbnailPreviewUrl ? (
                <img
                  src={thumbnailPreviewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <VideoIcon className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
              <span
                className={cn(
                  "absolute bottom-1 right-1 h-2 w-2 rounded-full border border-background/80",
                  statusStyle.dot,
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold leading-snug line-clamp-2">
                {video?.name ?? "Edit Video"}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Edit the metadata for this video.
              </SheetDescription>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className={cn("font-medium", statusStyle.text)}>
                  {statusStyle.label}
                </span>
                {video?.duration_seconds != null && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 opacity-60" />
                    {formatDuration(video.duration_seconds)}
                  </span>
                )}
                {video?.file_size != null && (
                  <span className="flex items-center gap-1">
                    <HardDriveIcon className="h-3 w-3 opacity-60" />
                    {formatFileSize(video.file_size)}
                  </span>
                )}
                {subtitleVttPath && (
                  <span className="ml-auto font-medium text-violet-400/80">
                    Subtitle attached
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">

            {/* Error */}
            {submitError && (
              <div className="px-6 pt-5">
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* ── Thumbnail ──────────────────────────────────────────────── */}
            <div className="border-b border-white/6 px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Thumbnail
                </p>
                {thumbnailFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearThumbnailSelection}
                    disabled={isSubmitting}
                  >
                    Revert
                  </Button>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {thumbnailPreviewUrl ? (
                  <img
                    src={thumbnailPreviewUrl}
                    alt={`Thumbnail for ${video?.name ?? "video"}`}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center gap-2 text-muted-foreground/40">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-sm">No thumbnail uploaded</span>
                  </div>
                )}
              </div>

              <input
                ref={thumbnailInputRef}
                id="edit-video-thumbnail-input"
                type="file"
                accept="image/*"
                disabled={isSubmitting}
                className="hidden"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              />

              <div className="mt-3 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-background hover:bg-accent"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <ImageIcon className="mr-2 h-3.5 w-3.5" />
                  {thumbnailFile ? "Replace" : "Choose Thumbnail"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {thumbnailFile
                    ? `${thumbnailFile.name} · ${formatFileSize(thumbnailFile.size)}`
                    : "JPG, PNG or WEBP · leave empty to keep current"}
                </span>
              </div>
            </div>

            {/* ── Metadata ───────────────────────────────────────────────── */}
            <div className="border-b border-white/6 px-6 py-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Metadata
              </p>

              <div className="space-y-2">
                <Label htmlFor="edit-video-name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-video-name"
                  placeholder="e.g. Onboarding Overview"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-video-category" className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                  <SelectTrigger id="edit-video-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {categories.length === 0 && (
                      <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                        No categories available.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-video-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="edit-video-description"
                  rows={3}
                  placeholder="Optional description…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={5000}
                  className="resize-none"
                />
              </div>
            </div>

            {/* ── Technical ──────────────────────────────────────────────── */}
            <div className={cn("px-6 py-5 space-y-4", (qualities && qualities.length > 0) ? "border-b border-white/6" : "")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Technical
              </p>

              <div className="space-y-2">
                <Label htmlFor="edit-video-duration" className="text-sm font-medium">
                  Duration (seconds)
                </Label>
                <Input
                  id="edit-video-duration"
                  type="number"
                  min={1}
                  placeholder="e.g. 300"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the current value.
                </p>
              </div>
            </div>

            {/* ── Qualities (read-only) ───────────────────────────────────── */}
            {qualities && qualities.length > 0 && (
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Available Qualities
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {qualities.map((q) => (
                    <div
                      key={q.quality}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-3 py-2"
                    >
                      <span className="font-mono text-xs font-semibold text-foreground/80">
                        {q.quality}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(q.file_size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <SheetFooter className="shrink-0 flex-row justify-end gap-3 border-t border-white/10 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
