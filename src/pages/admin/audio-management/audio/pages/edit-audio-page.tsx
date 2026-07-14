// ─── Edit Audio Page ──────────────────────────────────────────────────────────
// Standalone page for updating an existing audio item.
// Receives the current audio data via React Router location.state (populated
// when navigating from the table's Edit button).
// File fields are optional — leave them empty to keep the existing files.

import { useState, useRef, useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  Loader2Icon,
  Music2Icon,
  SparklesIcon,
  UploadIcon,
  ImageIcon,
  XIcon,
  AlertCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DurationPickerField } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { isApiError } from "@/lib/api"
import { getAudioById, updateAudio } from "../service/audio.service"
import { extractAudioMetadata } from "../service/audio-metadata"
import { getAllCategories } from "../../categories/service/category.service"
import type { AudioCategoryResource } from "../../categories/types/category.types"
import type { AudioResource } from "../types/audio.types"

// ── ThumbnailPicker ────────────────────────────────────────────────────────────
// File picker with a live preview; falls back to the existing thumbnail URL.

function ThumbnailPicker({
  id,
  file,
  existingUrl,
  disabled,
  onChange,
}: {
  id: string
  file: File | null
  existingUrl?: string | null
  disabled?: boolean
  onChange: (file: File | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shownUrl = previewUrl ?? (existingUrl?.trim() ? existingUrl : null)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-dashed border-input bg-background">
        {shownUrl ? (
          <img src={shownUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px]">No image</span>
          </div>
        )}
        {file && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(null)
              if (ref.current) ref.current.value = ""
            }}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove new thumbnail"
          >
            <XIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <input
          ref={ref}
          id={id}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => ref.current?.click()}
          className="flex items-center gap-3 rounded-md border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {file ? file.name : (existingUrl ? "Replace thumbnail (keeps current if blank)" : "Click to choose a thumbnail image")}
          </span>
        </button>
        <p className="text-xs text-muted-foreground">Leave blank to keep the current thumbnail.</p>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert an unknown error into a readable string. */
function extractErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const first = Object.values(err.data.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first.length > 0) return first[0]
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    if (err.status === 404) return "Audio item not found."
    return err.message || "An unexpected error occurred."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

/** Format bytes as a human-readable string */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── FileInput ────────────────────────────────────────────────────────────────
// Same reusable styled file picker as on the create page.

interface FileInputProps {
  id: string
  accept?: string
  disabled?: boolean
  file: File | null
  onChange: (file: File | null) => void
  placeholder?: string
}

function FileInput({ id, accept, disabled, file, onChange, placeholder }: FileInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={ref}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className="flex items-center gap-3 rounded-md border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UploadIcon className="h-4 w-4 shrink-0" />
        {file ? (
          <span className="truncate font-medium text-foreground">
            {file.name}
            <span className="ml-2 font-normal text-muted-foreground">
              ({formatBytes(file.size)})
            </span>
          </span>
        ) : (
          <span>{placeholder ?? "Click to choose a file"}</span>
        )}
      </button>

      {file && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(null)
            if (ref.current) ref.current.value = ""
          }}
          className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Remove new file (keep existing)
        </button>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditAudioPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  // The audio row passed via router state when clicking Edit in the table.
  // This lets the form render immediately without waiting for an API call.
  const audioFromState = location.state?.audio as AudioResource | undefined

  const audioId = Number(id)

  // ── Fetch full detail if router state is not present ──────────────────────
  // This handles the case where the user navigates directly to the URL.
  const [isFetching, setIsFetching] = useState(!audioFromState)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ── Form field state ──────────────────────────────────────────────────────
  const [name, setName] = useState(audioFromState?.title ?? "")
  const [categoryId, setCategoryId] = useState(
    audioFromState?.audio_category_id != null ? String(audioFromState.audio_category_id) : "",
  )
  const [description, setDescription] = useState(audioFromState?.description ?? "")
  const [duration, setDuration] = useState(
    audioFromState?.duration != null ? String(audioFromState.duration) : "",
  )
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(
    audioFromState?.thumbnail_path ?? null,
  )

  const [categories, setCategories] = useState<AudioCategoryResource[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const [nameAutoDetected, setNameAutoDetected] = useState(false)
  const [durationAutoDetected, setDurationAutoDetected] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load categories for the name-based picker
  useEffect(() => {
    setLoadingCategories(true)
    getAllCategories()
      .then(({ items }) => setCategories(items))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [])

  // Fetch full detail from the API to populate fields the list response omits
  useEffect(() => {
    if (!Number.isInteger(audioId) || audioId <= 0) return

    async function fetchDetail() {
      try {
        const detail = await getAudioById(audioId)
        // Pre-fill form with the full detail data
        setName(detail.title ?? detail.name ?? "")
        setDescription(detail.description ?? "")
        setDuration(detail.duration != null ? String(detail.duration) : "")
        if (detail.audio_category_id != null) setCategoryId(String(detail.audio_category_id))
        if (detail.thumbnail_path) setExistingThumbnail(detail.thumbnail_path)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setFetchError(extractErrorMessage(err))
      } finally {
        setIsFetching(false)
      }
    }

    fetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioId])

  function handleAudioFileChange(file: File | null) {
    setAudioFile(file)
    if (file) {
      extractAudioMetadata(file).then((meta) => {
        setName(file.name.replace(/\.[^.]+$/, ""))
        setNameAutoDetected(true)
        if (meta.duration) {
          setDuration(String(Math.round(meta.duration)))
          setDurationAutoDetected(true)
        }
      }).catch(() => {})
    } else {
      setNameAutoDetected(false)
      setDurationAutoDetected(false)
    }
  }

  // ── Client-side validation ────────────────────────────────────────────────
  function validate(): string | null {
    if (!name.trim()) return "Name is required."
    if (duration.trim()) {
      const dur = parseInt(duration, 10)
      if (isNaN(dur) || dur < 1) return "Duration must be a positive integer (seconds)."
    }
    return null
  }

  // ── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!Number.isInteger(audioId) || audioId <= 0) {
      setError("Invalid audio ID.")
      return
    }

    const clientError = validate()
    if (clientError) {
      setError(clientError)
      return
    }

    // Build multipart/form-data — only include fields that have values.
    // The API treats missing fields as "no change" on the update endpoint.
    const formData = new FormData()
    if (name.trim()) formData.append("name", name.trim())
    if (categoryId.trim()) formData.append("audio_category_id", categoryId.trim())
    if (description.trim()) formData.append("description", description.trim())
    if (duration.trim()) formData.append("duration", duration.trim())
    if (audioFile) formData.append("audio_file", audioFile)
    if (thumbnail) formData.append("thumbnail", thumbnail)

    setSubmitting(true)

    try {
      const updated = await updateAudio(audioId, formData)
      toast.success(`"${updated.title ?? "Audio item"}" updated successfully.`)
      navigate("/admin/audio-management/audio")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render: loading skeleton while fetching detail ────────────────────────
  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: error if fetching the detail failed ───────────────────────────
  if (fetchError) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-fit">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to audio
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // ── Render: edit form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Audio</h1>
          <p className="mt-1 text-muted-foreground">
            Update the audio item details. Leave file fields empty to keep existing files.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-fit"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to audio
        </Button>
      </div>

      {/* ── Form card ────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Error banner */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="edit-audio-name" className="flex items-center gap-2">
                Name <span className="text-destructive">*</span>
                {nameAutoDetected && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-normal text-indigo-400">
                    <SparklesIcon className="size-3" />Auto-detected
                  </span>
                )}
              </Label>
              <Input
                id="edit-audio-name"
                placeholder="e.g. Introduction to React"
                maxLength={255}
                value={name}
                onChange={(e) => { setName(e.target.value); setNameAutoDetected(false) }}
                disabled={submitting}
                required
              />
            </div>

            {/* Category (picked by name) */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-audio-category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={submitting || loadingCategories}
              >
                <SelectTrigger id="edit-audio-category" className="w-full">
                  {loadingCategories ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> Loading categories…
                    </span>
                  ) : (
                    <SelectValue placeholder="Select a category…" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select to change the audio's category.
              </p>
            </div>

            {/* Duration (optional) */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-audio-duration" className="flex items-center gap-2">
                Duration
                {durationAutoDetected && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-normal text-indigo-400">
                    <SparklesIcon className="size-3" />Auto-detected
                  </span>
                )}
              </Label>
              <DurationPickerField
                value={duration}
                onChange={(v) => { setDuration(v); setDurationAutoDetected(false) }}
                mode="ms"
                placeholder="Set duration"
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="edit-audio-description">Description</Label>
              <textarea
                id="edit-audio-description"
                rows={3}
                placeholder="Optional description…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Audio File — leave empty to keep the existing file */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5">
                <Music2Icon className="h-4 w-4 text-muted-foreground" />
                Replace Audio File
              </Label>
              <FileInput
                id="edit-audio-file-input"
                accept="audio/*"
                disabled={submitting}
                file={audioFile}
                onChange={handleAudioFileChange}
                placeholder="Click to choose a new audio file (leave blank to keep existing)"
              />
            </div>

            {/* Thumbnail — live preview; leave empty to keep the existing image */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Thumbnail Image
              </Label>
              <ThumbnailPicker
                id="edit-thumbnail-input"
                disabled={submitting}
                file={thumbnail}
                existingUrl={existingThumbnail}
                onChange={setThumbnail}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
