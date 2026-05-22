// ─── Video Subtitle Card ───────────────────────────────────────────────────────
// Self-contained card for managing a video's WebVTT subtitle.
// Handles fetch, upload (with XHR progress), and delete with confirmation.

import { useEffect, useRef, useState } from "react"
import {
  AlertCircleIcon,
  FileTextIcon,
  Loader2Icon,
  Trash2Icon,
  UploadIcon,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ─── Subtitle card ─── */}
      <Card className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 border border-violet-500/20">
                <FileTextIcon className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <CardTitle className="text-sm font-semibold">Subtitle</CardTitle>
            </div>

            {/* Status badge */}
            {isLoadingSubtitle ? (
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  subtitle
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15"
                    : "bg-muted/30 text-muted-foreground border-white/10",
                )}
              >
                {subtitle ? "Subtitle Available" : "No Subtitle"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Load error */}
          {loadError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="text-xs">{loadError}</AlertDescription>
            </Alert>
          )}

          {/* Subtitle path */}
          {!isLoadingSubtitle && subtitle && (
            <div className="rounded-lg bg-white/5 border border-white/8 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">Path</p>
              <p className="text-xs font-mono text-foreground break-all">
                {subtitle.subtitle_vtt_path}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-white/15 hover:bg-white/8 flex-1 sm:flex-none"
              disabled={isLoadingSubtitle}
              onClick={() => setUploadOpen(true)}
            >
              <UploadIcon className="mr-1.5 h-3.5 w-3.5" />
              {subtitle ? "Replace Subtitle" : "Upload Subtitle"}
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Span wrapper required — disabled buttons swallow mouse events */}
                  <span className={cn(!subtitle && "cursor-not-allowed")}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:pointer-events-none"
                      disabled={isLoadingSubtitle || !subtitle}
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
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
        </CardContent>
      </Card>

      {/* ─── Upload dialog ─── */}
      <Dialog open={uploadOpen} onOpenChange={handleUploadDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Subtitle</DialogTitle>
            <DialogDescription>
              Only WebVTT (.vtt) files up to 10 MB are allowed. SRT and other
              formats will be rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* File picker */}
            <div className="space-y-1.5">
              <Label htmlFor="subtitle-file-input">Subtitle file</Label>
              <Input
                id="subtitle-file-input"
                ref={fileInputRef}
                type="file"
                accept=".vtt"
                disabled={isUploading}
                onChange={handleFileChange}
                className="cursor-pointer file:cursor-pointer file:text-xs"
              />
            </div>

            {/* Selected file info */}
            {selectedFile && !fileError && (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <FileTextIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.size < 1024
                      ? `${selectedFile.size} B`
                      : selectedFile.size < 1024 * 1024
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
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
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
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
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadIcon className="mr-1.5 h-3.5 w-3.5" />
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
              This will remove the current subtitle file from this video. This
              action cannot be undone.
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
