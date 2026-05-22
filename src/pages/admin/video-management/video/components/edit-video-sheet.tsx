// ─── Edit Video Sheet ─────────────────────────────────────────────────────────
// Slide-in sheet for editing a video's metadata.
// file_path is immutable — it is not shown or sent in the update payload.

import { useEffect, useRef, useState } from "react"
import { Loader2Icon, AlertCircleIcon, ImageIcon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
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
  const [fileSize, setFileSize] = useState("")
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
      setFileSize(video.file_size != null ? String(video.file_size) : "")
      setThumbnailFile(null)
      setThumbnailPreviewUrl(typeof video.thumbnail_path === "string" ? video.thumbnail_path.trim() : "")
      setSubmitError(null)
    }
  }, [open, video])

  useEffect(() => {
    if (!thumbnailFile) return

    const objectUrl = URL.createObjectURL(thumbnailFile)
    setThumbnailPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [thumbnailFile])

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

    if (!name.trim()) {
      setSubmitError("Name is required.")
      return
    }
    if (!categoryId) {
      setSubmitError("Please select a category.")
      return
    }

    const payload: UpdateVideoPayload = {
      name: name.trim(),
      video_category_id: Number(categoryId),
      description: description.trim() || null,
      duration_seconds: durationSeconds !== "" ? Number(durationSeconds) : null,
      file_size: fileSize !== "" ? Number(fileSize) : null,
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
            .flat()
            .slice(0, 3)
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
      <SheetContent className="sm:max-w-lg flex flex-col gap-0 p-0 border-l border-white/10">
        <SheetHeader className="px-6 py-5 border-b border-white/10">
          <SheetTitle className="text-xl">Edit Video</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Update the video&apos;s metadata. The video file itself cannot be changed.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

            {submitError && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Name */}
            <div className="space-y-3">
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
                className="h-10"
                autoFocus
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label htmlFor="edit-video-category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="edit-video-category" className="h-10">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      No categories available.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="edit-video-description" className="text-sm font-medium">Description</Label>
              <textarea
                id="edit-video-description"
                rows={3}
                placeholder="Optional description…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={5000}
                className={[
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                ].join(" ")}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Thumbnail Image
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave this empty to keep the current thumbnail.
                  </p>
                </div>

                {thumbnailFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={handleClearThumbnailSelection}
                    disabled={isSubmitting}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 rounded-2xl border border-white/10 bg-background/40 p-4">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-background">
                  {thumbnailPreviewUrl ? (
                    <img
                      src={thumbnailPreviewUrl}
                      alt={`Thumbnail for ${video?.name ?? "video"}`}
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                      No thumbnail uploaded
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

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/10 bg-background hover:bg-accent"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <UploadIcon className="mr-2 h-4 w-4" />
                    {thumbnailFile ? "Replace Thumbnail" : "Choose Thumbnail"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    {thumbnailFile
                      ? `${thumbnailFile.name} (${formatFileSize(thumbnailFile.size)})`
                      : "JPG, PNG, or WEBP up to 4 MB."}
                  </p>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <Label htmlFor="edit-video-duration" className="text-sm font-medium">Duration (seconds)</Label>
              <Input
                id="edit-video-duration"
                type="number"
                min={1}
                placeholder="e.g. 300"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                disabled={isSubmitting}
                className="h-10"
              />
            </div>

            {/* File size
            <div className="space-y-3">
              <Label htmlFor="edit-video-filesize" className="text-sm font-medium">File size (bytes)</Label>
              <Input
                id="edit-video-filesize"
                type="number"
                min={0}
                placeholder="e.g. 52428800"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                disabled={isSubmitting}
                className="h-10"
              />
            </div> */}
          </div>

          <SheetFooter className="px-6 py-4 border-t border-white/10 mt-auto bg-background/50 backdrop-blur-sm">
            <div className="flex w-full justify-end gap-3">
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
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
