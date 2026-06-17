// ─── Create Video Panel ───────────────────────────────────────────────────────
// Reusable upload + metadata composer for creating a video record.

import { useEffect, useRef, useState } from "react"
import type { DragEvent } from "react"
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  FileTextIcon,
  FileVideoIcon,
  ImageIcon,
  Loader2Icon,
  UploadCloudIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"

import { isApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { useChunkUpload } from "../hooks/use-chunk-upload"
import { uploadVideoSubtitle } from "../service/video.service"
import type { CreateVideoPayload, VideoDetail } from "../types/video.types"
import type { VideoCategory } from "../../categories/types/category.types"

interface CreateVideoPanelProps {
  onClose: () => void
  onSuccess: () => void
  categories: VideoCategory[]
  onCreate: (payload: CreateVideoPayload) => Promise<VideoDetail>
}

interface CreateVideoSheetProps extends CreateVideoPanelProps {
  open: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function CreateVideoPanel({
  onClose,
  onSuccess,
  categories,
  onCreate,
}: CreateVideoPanelProps) {
  const {
    upload,
    abort,
    progress,
    isUploading,
    uploadError,
    currentChunk,
    totalChunks,
  } = useChunkUpload()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const metadataSectionRef = useRef<HTMLDivElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null)

  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [durationSeconds, setDurationSeconds] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("")
  const subtitleInputRef = useRef<HTMLInputElement>(null)
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null)
  const [subtitleError, setSubtitleError] = useState<string | null>(null)
  const [isUploadingSubtitle, setIsUploadingSubtitle] = useState(false)
  const [subtitleUploadProgress, setSubtitleUploadProgress] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl("")
      return
    }

    const objectUrl = URL.createObjectURL(thumbnailFile)
    setThumbnailPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [thumbnailFile])

  const uploadComplete = uploadedFilePath !== null
  const canSubmit = uploadComplete && !isSubmitting && !isUploading

  function clearSelectedFile() {
    setSelectedFile(null)
    setUploadedFilePath(null)
    setUploadedFileSize(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function clearThumbnailSelection() {
    setThumbnailFile(null)
    setThumbnailPreviewUrl("")
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  function handleClose() {
    if (isSubmitting) return
    if (isUploading) abort()
    onClose()
  }

  function handleSelectFile(file: File | null) {
    setSelectedFile(file)
    setUploadedFilePath(null)
    setUploadedFileSize(null)
    setSubmitError(null)

    if (file) {
      setName((current) => current || file.name.replace(/\.[^.]+$/, ""))
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (isUploading) return
    handleSelectFile(e.dataTransfer.files?.[0] ?? null)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setSubmitError(null)

    try {
      const result = await upload(selectedFile)
      setUploadedFilePath(result.file_path)
      setUploadedFileSize(result.file_size)
      metadataSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!name.trim()) {
      setSubmitError("Name is required.")
      return
    }
    if (!categoryId) {
      setSubmitError("Please select a category.")
      return
    }
    if (!uploadedFilePath) {
      setSubmitError("Please upload a video file first.")
      return
    }

    const payload: CreateVideoPayload = {
      name: name.trim(),
      video_category_id: Number(categoryId),
      file_path: uploadedFilePath,
      file_size: uploadedFileSize ?? undefined,
      description: description.trim() || null,
      duration_seconds: durationSeconds !== "" ? Number(durationSeconds) : null,
      thumbnail: thumbnailFile,
    }

    setIsSubmitting(true)
    try {
      const createdVideo = await onCreate(payload)

      // Upload subtitle file if one was selected
      if (subtitleFile && createdVideo?.id) {
        setIsUploadingSubtitle(true)
        setSubtitleUploadProgress(0)
        try {
          await uploadVideoSubtitle(createdVideo.id, subtitleFile, (pct) => setSubtitleUploadProgress(pct))
        } catch {
          // Non-fatal: video was created, just warn about subtitle
          setSubmitError("Video created but subtitle upload failed. Upload it from the video detail page.")
          setIsSubmitting(false)
          setIsUploadingSubtitle(false)
          onSuccess()
          return
        } finally {
          setIsUploadingSubtitle(false)
        }
      }

      onSuccess()
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const messages = Object.values(err.data.errors as Record<string, string[]>)
            .flat()
            .slice(0, 3)
          setSubmitError(messages.join(" "))
        } else if (err.status === 401) {
          setSubmitError("Your session expired. Please sign in again.")
        } else {
          setSubmitError(err.message || "Failed to create video.")
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

  return (
    <Card className="rounded-3xl border border-white/10 bg-card shadow-sm">
      <CardHeader className="border-b border-white/10 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-300">
                <VideoIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight">Upload Video</CardTitle>
                <CardDescription className="mt-1 max-w-2xl text-sm">
                  Upload the source file, add the metadata, and attach an optional thumbnail that appears throughout the admin views.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/10 bg-background/60 text-xs text-muted-foreground">
                Step 1 of 2
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  uploadComplete
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : isUploading
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                      : "border-sky-500/25 bg-sky-500/10 text-sky-300",
                )}
              >
                {uploadComplete ? "Ready to Publish" : isUploading ? "Uploading Source Video" : "Draft"}
              </Badge>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <span className="rounded-full bg-white/8 px-2 py-1">Pick file</span>
                <ChevronRightIcon className="h-3.5 w-3.5 opacity-60" />
                <span className="rounded-full bg-white/8 px-2 py-1">Upload chunks</span>
                <ChevronRightIcon className="h-3.5 w-3.5 opacity-60" />
                <span className="rounded-full bg-white/8 px-2 py-1">Add details</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-background hover:bg-accent"
            disabled={isUploading || isSubmitting}
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 px-5 py-5 lg:px-6 lg:py-6">
          {(submitError || uploadError) && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{submitError ?? uploadError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
            <section className="space-y-4 rounded-3xl border border-white/10 bg-background/40 p-4 lg:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Step 1
                  </p>
                  <p className="mt-1 text-sm font-medium">Choose and upload the source file</p>
                </div>
                {selectedFile && !isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearSelectedFile}
                  >
                    Reset File
                  </Button>
                )}
              </div>

              <div
                role="button"
                tabIndex={isUploading ? -1 : 0}
                onDragEnter={(e) => {
                  e.preventDefault()
                  if (!isUploading) setIsDragging(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (!isUploading) setIsDragging(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
                  setIsDragging(false)
                }}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-dashed p-7 text-center transition-all duration-200",
                  isDragging
                    ? "border-sky-400/60 bg-sky-500/8 shadow-[0_0_0_1px_rgba(56,189,248,0.22)]"
                    : uploadComplete
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-white/15 bg-background hover:border-sky-400/35 hover:bg-white/[0.03]",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
                  disabled={isUploading}
                  className="hidden"
                />

                <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl border",
                      uploadComplete
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/6 text-sky-300",
                    )}
                  >
                    {uploadComplete ? (
                      <CheckCircleIcon className="h-7 w-7" />
                    ) : selectedFile ? (
                      <FileVideoIcon className="h-7 w-7" />
                    ) : (
                      <UploadCloudIcon className="h-7 w-7" />
                    )}
                  </div>

                  {uploadComplete ? (
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-emerald-300">Upload complete</p>
                      <p className="text-sm text-muted-foreground">
                        The file is on the server. Finish the metadata to create the video entry.
                      </p>
                    </div>
                  ) : selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-base font-semibold">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-base font-semibold">Drop a video here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        MP4, MOV, AVI, MKV and other browser-supported formats.
                      </p>
                    </div>
                  )}

                  {!selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Chunk upload keeps large transfers smoother and cancel-safe.
                    </p>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="rounded-2xl border border-white/10 bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {uploadComplete && uploadedFileSize != null
                          ? `Uploaded size: ${formatFileSize(uploadedFileSize)}`
                          : `Local file size: ${formatFileSize(selectedFile.size)}`}
                      </p>
                      {uploadedFilePath && (
                        <p className="mt-2 break-all rounded-lg bg-black/20 px-2.5 py-2 font-mono text-[11px] text-muted-foreground">
                          {uploadedFilePath}
                        </p>
                      )}
                    </div>

                    {!uploadComplete && !isUploading && (
                      <Button type="button" onClick={handleUpload} className="shrink-0">
                        <UploadCloudIcon className="mr-2 h-4 w-4" />
                        Start Upload
                      </Button>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Uploading chunk {currentChunk} of {totalChunks}
                        </span>
                        <span className="tabular-nums font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-white/10" />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          The server finalizes the file automatically on the last chunk.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={abort}
                          className="h-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <XIcon className="mr-1.5 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section ref={metadataSectionRef} className="space-y-5 rounded-3xl border border-white/10 bg-background/40 p-4 lg:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Step 2
                </p>
                <p className="mt-1 text-sm font-medium">Complete the metadata</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cv-name-inline">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cv-name-inline"
                    placeholder="e.g. Onboarding Overview"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={255}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cv-category-inline">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                    <SelectTrigger id="cv-category-inline">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {categories.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No categories available.
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cv-description-inline">Description</Label>
                  <Textarea
                    id="cv-description-inline"
                    rows={4}
                    placeholder="What should learners know about this video?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={5000}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cv-duration-inline">Duration (seconds)</Label>
                  <Input
                    id="cv-duration-inline"
                    type="number"
                    min={1}
                    placeholder="e.g. 300"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        Thumbnail Image
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Optional. This image will appear in the list page, the details page, and the edit sheet.
                      </p>
                    </div>

                    {thumbnailFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={clearThumbnailSelection}
                        disabled={isSubmitting}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-white/10 bg-background/70 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-background">
                      {thumbnailPreviewUrl ? (
                        <img
                          src={thumbnailPreviewUrl}
                          alt="Selected thumbnail preview"
                          className="aspect-[16/10] h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[16/10] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                          No thumbnail selected
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center gap-3">
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        disabled={isSubmitting}
                        className="hidden"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit border-white/10 bg-background hover:bg-accent"
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={isSubmitting}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {thumbnailFile ? "Change Thumbnail" : "Choose Thumbnail"}
                      </Button>

                      {thumbnailFile ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{thumbnailFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(thumbnailFile.size)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Upload a JPG, PNG, or WEBP image to give the video a visual identity across the admin pages.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Subtitle (.vtt)</Label>
                  <p className="text-xs text-muted-foreground">
                    Optional WebVTT subtitle file. Can also be uploaded later from the video detail page.
                  </p>

                  {subtitleFile ? (
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/60 px-4 py-3">
                      <FileTextIcon className="h-4 w-4 shrink-0 text-violet-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{subtitleFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {subtitleFile.size < 1024 * 1024
                            ? `${(subtitleFile.size / 1024).toFixed(1)} KB`
                            : `${(subtitleFile.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSubtitleFile(null)
                          setSubtitleError(null)
                          if (subtitleInputRef.current) subtitleInputRef.current.value = ""
                        }}
                        disabled={isSubmitting}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-left text-sm transition-colors",
                        "border-white/15 bg-background/40 text-muted-foreground",
                        "hover:border-violet-400/40 hover:bg-white/[0.03]",
                        "disabled:pointer-events-none disabled:opacity-50"
                      )}
                      onClick={() => subtitleInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <FileTextIcon className="h-4 w-4 shrink-0 text-violet-400/60" />
                      Click to choose a .vtt subtitle file
                    </button>
                  )}

                  <input
                    ref={subtitleInputRef}
                    type="file"
                    accept=".vtt"
                    className="hidden"
                    disabled={isSubmitting}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setSubtitleError(null)
                      if (!file) { setSubtitleFile(null); return }
                      const ext = file.name.split(".").pop()?.toLowerCase()
                      if (ext !== "vtt") {
                        setSubtitleError("Only .vtt files are accepted.")
                        if (subtitleInputRef.current) subtitleInputRef.current.value = ""
                        return
                      }
                      setSubtitleFile(file)
                    }}
                  />

                  {subtitleError && (
                    <p className="text-xs text-destructive">{subtitleError}</p>
                  )}

                  {isUploadingSubtitle && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading subtitle…</span>
                        <span>{subtitleUploadProgress}%</span>
                      </div>
                      <Progress value={subtitleUploadProgress} className="h-1.5 bg-white/10" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", uploadComplete ? "bg-emerald-400" : "bg-amber-400")} />
            {uploadComplete
              ? "Video file uploaded. You can create the record now."
              : "Upload the file before the create action becomes available."}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-white/10 bg-background hover:bg-accent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} className="min-w-37">
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Video"
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export function CreateVideoSheet({
  open,
  onClose,
  onSuccess,
  categories,
  onCreate,
}: CreateVideoSheetProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-6xl border-white/10 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        <CreateVideoPanel
          onClose={onClose}
          onSuccess={onSuccess}
          categories={categories}
          onCreate={onCreate}
        />
      </DialogContent>
    </Dialog>
  )
}
