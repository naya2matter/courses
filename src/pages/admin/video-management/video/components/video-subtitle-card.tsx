// ─── Video Subtitle Card ───────────────────────────────────────────────────────
// Self-contained card for managing a video's WebVTT subtitle.
// Handles fetch, upload (with XHR progress), and delete with confirmation.

import { useEffect, useRef, useState } from "react"
import {
  AlertCircleIcon,
  FileTextIcon,
  Loader2Icon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { isApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

import {
  deleteVideoSubtitle,
  getVideoSubtitle,
  uploadVideoSubtitle,
} from "../service/video.service"
import type { VideoSubtitleData } from "../types/video.types"

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_SUBTITLE_BYTES = 10 * 1024 * 1024 // 10 MB

// ── Props ─────────────────────────────────────────────────────────────────────

interface VideoSubtitleCardProps {
  videoId: number
  /**
   * Called after a successful upload or delete so the parent (e.g. the detail
   * drawer) can refresh the video record (subtitle_vtt_path may have changed).
   */
  onSubtitleChange?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VideoSubtitleCard({ videoId, onSubtitleChange }: VideoSubtitleCardProps) {
  // ── Subtitle fetch state ───────────────────────────────────────────────────
  const [subtitle, setSubtitle] = useState<VideoSubtitleData | null>(null)
  const [isLoadingSubtitle, setIsLoadingSubtitle] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ── Upload dialog state ────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Delete dialog state ────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Drag state ─────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false)

  // ── Subtitle fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    setIsLoadingSubtitle(true)
    setLoadError(null)

    getVideoSubtitle(videoId)
      .then((data) => {
        if (!cancelled) setSubtitle(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof DOMException && err.name === "AbortError") return
        setLoadError(err instanceof Error ? err.message : "Failed to load subtitle info.")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSubtitle(false)
      })

    return () => {
      cancelled = true
    }
  }, [videoId])

  // ── File selection + client-side validation ────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    setUploadError(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext !== "vtt") {
      setFileError(
        "Only WebVTT (.vtt) files are accepted. SRT and other formats are not supported.",
      )
      setSelectedFile(null)
      // Reset the input so the user can re-select
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > MAX_SUBTITLE_BYTES) {
      setFileError(
        `File is too large. Maximum allowed size is 10 MB (selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      )
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setSelectedFile(file)
  }

  // ── Upload handler ─────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      await uploadVideoSubtitle(videoId, selectedFile, (pct) =>
        setUploadProgress(pct),
      )

      toast.success("Subtitle uploaded successfully.")
      setUploadOpen(false)
      setSelectedFile(null)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""

      // Re-fetch subtitle to reflect new path
      const updated = await getVideoSubtitle(videoId)
      setSubtitle(updated)
      onSubtitleChange?.()
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return

      if (isApiError(err) && err.status === 401) {
        setUploadError("You are not authenticated. Please log in again.")
      } else if (isApiError(err) && err.status === 422) {
        const messages =
          err.data?.errors != null
            ? Object.values(err.data.errors as Record<string, string[]>)
                .flat()
                .join(", ")
            : err.message
        setUploadError(messages)
      } else {
        setUploadError(
          err instanceof Error ? err.message : "Subtitle upload failed. Please try again.",
        )
      }
    } finally {
      setIsUploading(false)
    }
  }

  // ── Delete handler ─────────────────────────────────────────────────────────

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteVideoSubtitle(videoId)
      toast.success("Subtitle deleted.")
      setDeleteOpen(false)
      setSubtitle(null)
      onSubtitleChange?.()
    } catch (err: unknown) {
      if (isApiError(err) && err.status === 422) {
        setDeleteError("This video does not have a subtitle to delete.")
      } else if (isApiError(err) && err.status === 401) {
        setDeleteError("You are not authenticated. Please log in again.")
      } else {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete subtitle.",
        )
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  function handleUploadDialogChange(open: boolean) {
    if (isUploading) return
    if (!open) {
      setSelectedFile(null)
      setFileError(null)
      setUploadError(null)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
    setUploadOpen(open)
  }

  function handleDeleteDialogChange(open: boolean) {
    if (isDeleting) return
    if (!open) setDeleteError(null)
    setDeleteOpen(open)
  }

  // ── Drag-and-drop ──────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const syntheticEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFileChange(syntheticEvent)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ─── Subtitle card ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card">
        {/* Violet left accent stripe */}
        <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-violet-500 via-violet-400 to-purple-600 rounded-l-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/8 px-5 py-4 pl-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/12">
              <FileTextIcon className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <p className="text-sm font-semibold">Subtitle / CC</p>
          </div>
          {isLoadingSubtitle ? (
            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                subtitle
                  ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-400"
                  : "border-white/10 bg-white/4 text-muted-foreground",
              )}
            >
              <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", subtitle ? "bg-emerald-400" : "bg-muted-foreground/40")} />
              {subtitle ? "Active" : "No Subtitle"}
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="p-5 pl-6 space-y-4">
          {loadError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="text-xs">{loadError}</AlertDescription>
            </Alert>
          )}

          {!isLoadingSubtitle && !subtitle && !loadError && (
            /* Empty state — click zone */
            <div
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/10 px-5 py-8 text-center transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
              onClick={() => setUploadOpen(true)}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <FileTextIcon className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60">No subtitle file</p>
                <p className="text-xs text-muted-foreground/40 mt-0.5">
                  Upload a WebVTT <span className="font-mono">.vtt</span> file to enable captions
                </p>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/20"
              >
                <UploadCloudIcon className="h-3.5 w-3.5" />
                Upload .vtt Subtitle
              </button>
            </div>
          )}

          {!isLoadingSubtitle && subtitle && (
            <div className="space-y-3">
              {/* Subtitle file path */}
              <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-3">
                <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <p className="flex-1 min-w-0 break-all font-mono text-xs text-foreground/70 leading-relaxed">
                  {subtitle.subtitle_vtt_path}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 border-white/12 text-xs hover:bg-white/8"
                  disabled={isLoadingSubtitle}
                  onClick={() => setUploadOpen(true)}
                >
                  <UploadCloudIcon className="h-3.5 w-3.5" />
                  Replace Subtitle
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(!subtitle && "cursor-not-allowed")}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:pointer-events-none"
                          disabled={isLoadingSubtitle || !subtitle}
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!subtitle && !isLoadingSubtitle && (
                      <TooltipContent side="top" className="text-xs">
                        No subtitle uploaded
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Upload dialog ─── */}
      <Dialog open={uploadOpen} onOpenChange={handleUploadDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloudIcon className="h-4 w-4 text-violet-400" />
              {subtitle ? "Replace Subtitle" : "Upload Subtitle"}
            </DialogTitle>
            <DialogDescription>
              WebVTT (.vtt) files only, up to 10 MB. SRT and other formats are not supported.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Drop zone — click or drag */}
            {!selectedFile && !fileError && (
              <div
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all",
                  isDragging
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-white/12 bg-white/3 hover:border-violet-500/30 hover:bg-violet-500/5",
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border transition-colors",
                  isDragging ? "border-violet-500/40 bg-violet-500/15" : "border-white/10 bg-white/5",
                )}>
                  <UploadCloudIcon className={cn(
                    "h-5 w-5 transition-colors",
                    isDragging ? "text-violet-400" : "text-muted-foreground/50",
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isDragging ? "Drop to upload" : "Drop .vtt file here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                  Max 10 MB
                </span>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".vtt"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileChange}
            />

            {/* Selected file info */}
            {selectedFile && !fileError && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/60 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/12">
                  <FileTextIcon className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.size < 1024
                      ? `${selectedFile.size} B`
                      : selectedFile.size < 1024 * 1024
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                    onClick={() => {
                      setSelectedFile(null)
                      setUploadError(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* File validation error */}
            {fileError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription className="text-xs">{fileError}</AlertDescription>
              </Alert>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Loader2Icon className="h-3 w-3 animate-spin" />
                    Uploading…
                  </span>
                  <span className="tabular-nums">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5 bg-white/10" />
              </div>
            )}

            {/* Upload API error */}
            {uploadError && !isUploading && (
              <Alert variant="destructive" className="py-2">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription className="text-xs">{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isUploading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              disabled={!selectedFile || !!fileError || isUploading}
              className="gap-1.5"
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloudIcon className="h-3.5 w-3.5" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete confirmation ─── */}
      <AlertDialog open={deleteOpen} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subtitle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the current subtitle file from this video. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="text-xs">{deleteError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Subtitle"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
