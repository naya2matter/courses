// ─── Create Audio Page ────────────────────────────────────────────────────────
// Standalone page for uploading a new audio item.
// Sends multipart/form-data so the backend receives the binary file alongside
// the other text fields.

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeftIcon,
  Loader2Icon,
  Music2Icon,
  UploadIcon,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { isApiError } from "@/lib/api"
import { createAudio } from "../service/audio.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert an unknown error into a readable string.
 * Handles Laravel 422 validation errors, auth errors, and generic messages.
 */
function extractErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    // Laravel returns field-level validation errors under err.data.errors
    if (err.status === 422 && err.data?.errors) {
      const first = Object.values(err.data.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first.length > 0) return first[0]
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    return err.message || "An unexpected error occurred."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

/** Format bytes as a human-readable string, e.g. "1.2 MB" */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── FileInput ────────────────────────────────────────────────────────────────
// A styled wrapper around a native <input type="file"> that shows the chosen
// file name and size once a file is picked.

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
      {/* Hidden native input — triggered by the button below */}
      <input
        ref={ref}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {/* Clickable drop-zone style button */}
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

      {/* Allow removing a previously selected file */}
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
          Remove file
        </button>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateAudioPage() {
  const navigate = useNavigate()

  // ── Form field state ──────────────────────────────────────────────────────
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Client-side validation before hitting the API ─────────────────────────
  function validate(): string | null {
    if (!name.trim()) return "Name is required."
    if (!categoryId.trim()) return "Audio category ID is required."
    const catNum = parseInt(categoryId, 10)
    if (isNaN(catNum) || catNum < 1) return "Audio category ID must be a positive integer."
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

    const clientError = validate()
    if (clientError) {
      setError(clientError)
      return
    }

    // Build multipart/form-data — the apiClient sends this with the correct
    // Content-Type header including the boundary string.
    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("audio_category_id", categoryId.trim())
    if (description.trim()) formData.append("description", description.trim())
    if (duration.trim()) formData.append("duration", duration.trim())
    if (audioFile) formData.append("audio_file", audioFile)
    if (thumbnail) formData.append("thumbnail", thumbnail)

    setSubmitting(true)

    try {
      await createAudio(formData)
      toast.success("Audio item created successfully.")
      navigate("/admin/audio-management/audio")
    } catch (err) {
      // Ignore browser navigation cancellation (not a real error)
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Audio</h1>
          <p className="mt-1 text-muted-foreground">
            Upload a new audio item and fill in the details below.
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

          {/* Error banner — shown when server or client validation fails */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name (required) */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="audio-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="audio-name"
                placeholder="e.g. Introduction to React"
                maxLength={255}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Audio Category ID (required) */}
            <div className="grid gap-1.5">
              <Label htmlFor="audio-category">
                Category ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="audio-category"
                type="number"
                min={1}
                placeholder="e.g. 3"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                The numeric ID of the audio category.
              </p>
            </div>

            {/* Duration (optional, in seconds) */}
            <div className="grid gap-1.5">
              <Label htmlFor="audio-duration">Duration (seconds)</Label>
              <Input
                id="audio-duration"
                type="number"
                min={1}
                placeholder="e.g. 240"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Total duration in seconds. Leave blank to let the server detect it.
              </p>
            </div>

            {/* Description (optional) */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="audio-description">Description</Label>
              <textarea
                id="audio-description"
                rows={3}
                placeholder="Optional description of this audio item…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Audio File (optional binary upload) */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5">
                <Music2Icon className="h-4 w-4 text-muted-foreground" />
                Audio File
              </Label>
              <FileInput
                id="audio-file-input"
                accept="audio/*"
                disabled={submitting}
                file={audioFile}
                onChange={setAudioFile}
                placeholder="Click to choose an audio file (mp3, wav, …)"
              />
            </div>

            {/* Thumbnail (optional binary upload) */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Thumbnail Image
              </Label>
              <FileInput
                id="thumbnail-input"
                accept="image/*"
                disabled={submitting}
                file={thumbnail}
                onChange={setThumbnail}
                placeholder="Click to choose a thumbnail image"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Audio"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
