// ─── Online Course Form Page ──────────────────────────────────────────────────
// Shared Create / Edit page for admin online courses.
// Uses multipart/form-data for both create and update (to support file uploads).

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { pdfjs } from "react-pdf"
import {
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
  AlertCircleIcon,
  PlayCircleIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookOpenIcon,
  SaveIcon,
  XIcon,
  UploadIcon,
  VideoIcon,
  GripVerticalIcon,
  ImageIcon,
  PaperclipIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePickerField } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { apiClient, isApiError } from "@/lib/api"
import {
  getOnlineCourseById,
  createOnlineCourse,
  updateOnlineCourse,
  reorderModules,
} from "../service/online-course.service"
import type {
  OnlineCourseContent,
  OnlineCourseModule,
} from "../types/online-course.types"

// ── Local form types ──────────────────────────────────────────────────────────

interface ContentRow {
  _key: string
  id: number | null
  title: string
  content_type: "video" | "pdf"
  description: string
  duration: string
  durationAutoDetected: boolean
  is_required: boolean
  is_active: boolean
  // video
  video_id: string
  videoName: string
  attachmentFile: File | null
  existingAttachmentName: string | null
  // pdf
  pdfFile: File | null
  existingPdfPath: string | null
  existingPdfName: string | null
  pdf_page_count: string
  pdfPageCountAutoDetected: boolean
}

interface ModuleRow {
  _key: string
  id: number | null
  name: string
  description: string
  estimated_duration: string
  has_quiz: boolean
  quiz_required: boolean
  contents: ContentRow[]
  expanded: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function genKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function emptyContent(type: "video" | "pdf"): ContentRow {
  return {
    _key: genKey(),
    id: null,
    title: "",
    content_type: type,
    description: "",
    duration: "",
    durationAutoDetected: false,
    is_required: true,
    is_active: true,
    video_id: "",
    videoName: "",
    attachmentFile: null,
    existingAttachmentName: null,
    pdfFile: null,
    existingPdfPath: null,
    existingPdfName: null,
    pdf_page_count: "",
    pdfPageCountAutoDetected: false,
  }
}

function emptyModule(): ModuleRow {
  return {
    _key: genKey(),
    id: null,
    name: "",
    description: "",
    estimated_duration: "",
    has_quiz: false,
    quiz_required: false,
    contents: [],
    expanded: true,
  }
}

function contentFromApi(c: OnlineCourseContent): ContentRow {
  return {
    _key: genKey(),
    id: c.id,
    title: c.title,
    content_type: c.content_type,
    description: c.description ?? "",
    duration: c.duration != null ? String(c.duration) : "",
    durationAutoDetected: false,
    is_required: c.is_required,
    is_active: c.is_active,
    video_id: c.video?.id != null ? String(c.video.id) : "",
    videoName: c.video?.name ?? "",
    attachmentFile: null,
    existingAttachmentName: c.attachment_name ?? null,
    pdfFile: null,
    existingPdfPath: c.pdf?.file_path ?? null,
    existingPdfName: c.pdf?.file_path
      ? decodeURIComponent(c.pdf.file_path.split("/").pop() ?? "")
      : null,
    pdf_page_count:
      c.pdf?.pdf_page_count != null ? String(c.pdf.pdf_page_count) : "",
    pdfPageCountAutoDetected: false,
  }
}

function moduleFromApi(m: OnlineCourseModule): ModuleRow {
  return {
    _key: genKey(),
    id: m.id,
    name: m.name,
    description: m.description ?? "",
    estimated_duration:
      m.estimated_duration != null ? String(m.estimated_duration) : "",
    has_quiz: m.has_quiz,
    quiz_required: m.quiz_required,
    contents: m.contents
      .slice()
      .sort((a, b) => a.order_number - b.order_number)
      .map(contentFromApi),
    expanded: false,
  }
}

function buildFormData(
  name: string,
  description: string,
  status: string,
  level: string,
  estimatedDuration: string,
  deadline: string,
  isActive: boolean,
  imageFile: File | null,
  modules: ModuleRow[],
): FormData {
  const fd = new FormData()
  fd.append("name", name.trim())
  if (description.trim()) fd.append("description", description.trim())
  if (status) fd.append("status", status)
  if (level) fd.append("level", level)
  if (estimatedDuration.trim())
    fd.append("estimated_duration", estimatedDuration.trim())
  if (deadline.trim()) {
    // datetime-local gives "2026-12-31T23:59" — convert to ISO
    fd.append("deadline", new Date(deadline).toISOString())
  }
  fd.append("is_active", isActive ? "1" : "0")
  if (imageFile) fd.append("image_file", imageFile)

  modules.forEach((mod, mi) => {
    const mp = `modules[${mi}]`
    if (mod.id != null) fd.append(`${mp}[id]`, String(mod.id))
    fd.append(`${mp}[name]`, mod.name.trim())
    fd.append(`${mp}[order_number]`, String(mi + 1))
    if (mod.description.trim())
      fd.append(`${mp}[description]`, mod.description.trim())
    if (mod.estimated_duration.trim())
      fd.append(`${mp}[estimated_duration]`, mod.estimated_duration.trim())
    fd.append(`${mp}[has_quiz]`, mod.has_quiz ? "1" : "0")
    if (mod.has_quiz)
      fd.append(`${mp}[quiz_required]`, mod.quiz_required ? "1" : "0")

    mod.contents.forEach((c, ci) => {
      const cp = `${mp}[contents][${ci}]`
      if (c.id != null) fd.append(`${cp}[id]`, String(c.id))
      fd.append(`${cp}[title]`, c.title.trim())
      fd.append(`${cp}[content_type]`, c.content_type)
      fd.append(`${cp}[order_number]`, String(ci + 1))
      if (c.description.trim())
        fd.append(`${cp}[description]`, c.description.trim())
      fd.append(`${cp}[is_required]`, c.is_required ? "1" : "0")
      fd.append(`${cp}[is_active]`, c.is_active ? "1" : "0")

      if (c.content_type === "video") {
        if (c.video_id.trim()) fd.append(`${cp}[video_id]`, c.video_id.trim())
        if (c.duration.trim()) fd.append(`${cp}[duration]`, c.duration.trim())
        if (c.attachmentFile) {
          fd.append(`${cp}[attachment_file]`, c.attachmentFile)
        }
      } else {
        if (c.pdfFile) {
          fd.append(`${cp}[pdf][file_path]`, c.pdfFile)
        }
        if (c.pdf_page_count.trim()) {
          fd.append(`${cp}[pdf][pdf_page_count]`, c.pdf_page_count.trim())
        }
      }
    })
  })

  return fd
}

function extractError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") return ""
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const messages = Object.entries(
        err.data.errors as Record<string, string[]>,
      )
        .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
        .join(" · ")
      return messages
    }
    return err.message || "An error occurred. Please try again."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

// ── PDF page-count auto-detect ────────────────────────────────────────────────
// Reads the page count from a PDF File locally (no upload). Uses pdfjs bundled
// with react-pdf (already a project dependency). The worker is configured the
// exact same way as the user-side PDF viewer (version-matched, avoids the
// "API/Worker version mismatch" error). Fails silently → admin types it.

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

async function readPdfPageCount(file: File): Promise<number | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    const count = pdf.numPages
    await pdf.destroy()
    return count > 0 ? count : null
  } catch (err) {
    console.warn("[online-course] PDF page-count detection failed:", err)
    return null // password-protected / corrupt / unsupported — let admin type it
  }
}

// ── VideoSearchSelect ─────────────────────────────────────────────────────────

interface VideoOption {
  id: number
  name: string
  duration_seconds?: number | null
}

function VideoSearchSelect({
  videoId,
  videoName,
  onChange,
}: {
  videoId: string
  videoName: string
  onChange: (id: string, name: string, durationSeconds?: number | null) => void
}) {
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<VideoOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  // Fetch categories once when picker first opens
  useEffect(() => {
    if (!open || categories.length > 0) return
    apiClient
      .get<{ data: { id: number; name: string }[] }>("/admin/video-categories/getAll")
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {})
  }, [open, categories.length])

  // Fetch videos — includes category filter; resets category when picker closes
  useEffect(() => {
    if (!open) {
      if (selectedCategoryId !== null) setSelectedCategoryId(null)
      return
    }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ per_page: "50" })
        if (query.trim()) qs.set("search", query.trim())
        if (selectedCategoryId != null)
          qs.set("video_category_id", String(selectedCategoryId))
        const res = await apiClient.get<{ data: VideoOption[] }>(
          `/admin/videos/getAll?${qs}`,
        )
        if (!cancelled) setOptions(res.data ?? [])
      } catch {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query, open, selectedCategoryId])

  const displayValue = open
    ? query
    : videoId
      ? videoName
        ? `${videoName}`
        : `Video #${videoId}`
      : ""

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <VideoIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search and select a video…"
            value={displayValue}
            className="pl-9"
            onFocus={() => {
              setOpen(true)
              setQuery("")
            }}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
        </div>
        {videoId && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => onChange("", "")}
            aria-label="Clear video"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full rounded-xl border border-white/10 bg-popover shadow-2xl overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Category filter — shown once categories have loaded */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/3 px-3.5 py-2">
              <span className="shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground/50">
                Category
              </span>
              <select
                value={selectedCategoryId ?? ""}
                onChange={(e) =>
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)
                }
                className="flex-1 bg-transparent text-xs text-muted-foreground outline-none cursor-pointer"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {selectedCategoryId != null && (
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSelectedCategoryId(null)
                  }}
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Video results */}
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-5">
                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : options.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-5">
                No videos found
              </p>
            ) : (
              options.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                  onMouseDown={() => {
                    onChange(String(v.id), v.name, v.duration_seconds ?? null)
                    setOpen(false)
                  }}
                >
                  <PlayCircleIcon className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="flex-1 truncate">{v.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    #{v.id}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ContentEditor ─────────────────────────────────────────────────────────────

function ContentEditor({
  content,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  content: ContentRow
  isFirst: boolean
  isLast: boolean
  onChange: (patch: Partial<ContentRow>) => void
  onRemove: () => void
  onMove: (dir: "up" | "down") => void
}) {
  const isExisting = content.id != null
  const isVideo = content.content_type === "video"

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
      {/* Content header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-white/3">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isVideo
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
              : "bg-rose-500/20 text-rose-400 border border-rose-500/20"
          }`}
        >
          {isVideo ? (
            <PlayCircleIcon className="h-3.5 w-3.5" />
          ) : (
            <FileTextIcon className="h-3.5 w-3.5" />
          )}
        </div>
        <span className="flex-1 text-sm font-medium truncate">
          {content.title || (isVideo ? "Video Content" : "PDF Content")}
        </span>
        <div className="flex items-center gap-1">
          {/* Type badge */}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0.5 ${
              isVideo
                ? "border-indigo-500/30 text-indigo-400"
                : "border-rose-500/30 text-rose-400"
            }`}
          >
            {isVideo ? "Video" : "PDF"}
          </Badge>
          {/* Reorder */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isFirst}
            onClick={() => onMove("up")}
          >
            <ChevronUpIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isLast}
            onClick={() => onMove("down")}
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </Button>
          {/* Remove */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content body */}
      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={content.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={isVideo ? "e.g. Introduction to HTML" : "e.g. HTML Reference Sheet"}
            />
          </div>

          {/* Content type — disabled for existing items */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Type{isExisting && <span className="ml-1 text-muted-foreground">(immutable)</span>}
            </Label>
            <Select
              value={content.content_type}
              onValueChange={(v) =>
                !isExisting && onChange({ content_type: v as "video" | "pdf" })
              }
              disabled={isExisting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Video-specific fields */}
        {isVideo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">
                Video <span className="text-destructive">*</span>
              </Label>
              <VideoSearchSelect
                videoId={content.video_id}
                videoName={content.videoName}
                onChange={(id, name, durationSeconds) =>
                  onChange({
                    video_id: id,
                    videoName: name,
                    // Auto-fill duration from the selected video's metadata
                    ...(durationSeconds != null && durationSeconds > 0
                      ? { duration: String(durationSeconds), durationAutoDetected: true }
                      : {}),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Duration (seconds)</Label>
                {content.durationAutoDetected && (
                  <span className="text-xs font-medium text-emerald-400">
                    Auto-detected
                  </span>
                )}
              </div>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 1800"
                value={content.duration}
                onChange={(e) =>
                  onChange({ duration: e.target.value, durationAutoDetected: false })
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Attachment (optional)</Label>

              {content.existingAttachmentName && !content.attachmentFile && (
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-sm">
                  <PaperclipIcon className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground">
                    {content.existingAttachmentName}
                  </span>
                  <label className="cursor-pointer">
                    <span className="text-xs text-primary underline-offset-2 hover:underline">
                      Replace
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        onChange({ attachmentFile: file })
                        e.target.value = ""
                      }}
                    />
                  </label>
                </div>
              )}

              {content.attachmentFile && (
                <div className="flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm">
                  <PaperclipIcon className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="flex-1 truncate text-sky-300">
                    {content.attachmentFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onChange({ attachmentFile: null })}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {!content.existingAttachmentName && !content.attachmentFile && (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/3 px-4 py-4 text-sm text-muted-foreground hover:border-white/30 hover:bg-white/5 transition-colors">
                  <PaperclipIcon className="h-4 w-4" />
                  <span>Upload an optional downloadable attachment</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      onChange({ attachmentFile: file })
                      e.target.value = ""
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* PDF-specific fields */}
        {!isVideo && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                PDF File <span className="text-destructive">*</span>
              </Label>

              {/* Existing PDF */}
              {content.existingPdfPath && !content.pdfFile && (
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-sm">
                  <FileTextIcon className="h-4 w-4 text-rose-400 shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground">
                    {content.existingPdfName ?? "Existing PDF"}
                  </span>
                  <label className="cursor-pointer">
                    <span className="text-xs text-primary underline-offset-2 hover:underline">
                      Replace
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        onChange({ pdfFile: file, pdf_page_count: "", pdfPageCountAutoDetected: false })
                        e.target.value = ""
                        if (file) {
                          readPdfPageCount(file).then((count) => {
                            if (count !== null)
                              onChange({ pdf_page_count: String(count), pdfPageCountAutoDetected: true })
                          })
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              {/* New file chosen */}
              {content.pdfFile && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm">
                  <FileTextIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="flex-1 truncate text-emerald-300">
                    {content.pdfFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() =>
                      onChange({ pdfFile: null, pdf_page_count: "", pdfPageCountAutoDetected: false })
                    }
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* No file yet */}
              {!content.existingPdfPath && !content.pdfFile && (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/3 px-4 py-6 text-sm text-muted-foreground hover:border-white/30 hover:bg-white/5 transition-colors">
                  <UploadIcon className="h-5 w-5" />
                  <span>Click to select a PDF (max 50 MB)</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      onChange({ pdfFile: file, pdf_page_count: "", pdfPageCountAutoDetected: false })
                      e.target.value = ""
                      if (file) {
                        readPdfPageCount(file).then((count) => {
                          if (count !== null)
                            onChange({ pdf_page_count: String(count), pdfPageCountAutoDetected: true })
                        })
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="w-52">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">Page Count</Label>
                {content.pdfPageCountAutoDetected && (
                  <span className="text-xs font-medium text-emerald-400">
                    Auto-detected
                  </span>
                )}
              </div>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 12"
                value={content.pdf_page_count}
                onChange={(e) =>
                  onChange({ pdf_page_count: e.target.value, pdfPageCountAutoDetected: false })
                }
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs">Description (optional)</Label>
          <Textarea
            rows={2}
            placeholder="Brief description of this content item…"
            value={content.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="resize-none text-sm"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-5">
          <div className="flex items-center gap-2">
            <Switch
              checked={content.is_required}
              onCheckedChange={(v: boolean) => onChange({ is_required: v })}
              id={`req-${content._key}`}
            />
            <Label htmlFor={`req-${content._key}`} className="text-xs cursor-pointer">
              Required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={content.is_active}
              onCheckedChange={(v: boolean) => onChange({ is_active: v })}
              id={`act-${content._key}`}
            />
            <Label htmlFor={`act-${content._key}`} className="text-xs cursor-pointer">
              Active
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ModuleEditor ──────────────────────────────────────────────────────────────

function ModuleEditor({
  module: mod,
  moduleIndex,
  dragHandle,
  onChange,
  onRemove,
}: {
  module: ModuleRow
  moduleIndex: number
  dragHandle: React.ReactNode
  onChange: (patch: Partial<ModuleRow> | ((prev: ModuleRow) => ModuleRow)) => void
  onRemove: () => void
}) {
  function updateContent(key: string, patch: Partial<ContentRow>) {
    onChange((m) => ({
      ...m,
      contents: m.contents.map((c) =>
        c._key === key ? { ...c, ...patch } : c,
      ),
    }))
  }

  function removeContent(key: string) {
    onChange((m) => ({ ...m, contents: m.contents.filter((c) => c._key !== key) }))
  }

  function moveContent(key: string, dir: "up" | "down") {
    onChange((m) => {
      const arr = [...m.contents]
      const idx = arr.findIndex((c) => c._key === key)
      if (idx < 0) return m
      const target = dir === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= arr.length) return m
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...m, contents: arr }
    })
  }

  function addContent(type: "video" | "pdf") {
    onChange((m) => ({
      ...m,
      contents: [...m.contents, emptyContent(type)],
    }))
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden shadow-sm">
      {/* Module header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
        {/* Order badge */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-sm font-bold tabular-nums">
          {moduleIndex + 1}
        </div>

        {/* Name input */}
        <Input
          value={mod.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Module name…"
          className="flex-1 border-transparent bg-transparent shadow-none pl-2 pr-0 text-sm font-medium focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />

        <div className="flex items-center gap-1 shrink-0">
          {dragHandle}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange({ expanded: !mod.expanded })}
          >
            {mod.expanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Module body */}
      {mod.expanded && (
        <div className="px-5 py-5 space-y-5">
          {/* Module meta fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Describe this module…"
                value={mod.description}
                onChange={(e) => onChange({ description: e.target.value })}
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Estimated Duration (minutes, optional)
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 60"
                  value={mod.estimated_duration}
                  onChange={(e) => onChange({ estimated_duration: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-5">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={mod.has_quiz}
                    onCheckedChange={(v: boolean) =>
                      onChange({ has_quiz: v, quiz_required: v ? mod.quiz_required : false })
                    }
                    id={`quiz-${mod._key}`}
                  />
                  <Label htmlFor={`quiz-${mod._key}`} className="text-xs cursor-pointer">
                    Has Quiz
                  </Label>
                </div>
                {mod.has_quiz && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={mod.quiz_required}
                      onCheckedChange={(v: boolean) => onChange({ quiz_required: v })}
                      id={`qreq-${mod._key}`}
                    />
                    <Label htmlFor={`qreq-${mod._key}`} className="text-xs cursor-pointer">
                      Quiz Required
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contents */}
          {mod.contents.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Contents ({mod.contents.length})
              </p>
              {mod.contents.map((c, ci) => (
                <ContentEditor
                  key={c._key}
                  content={c}
                  isFirst={ci === 0}
                  isLast={ci === mod.contents.length - 1}
                  onChange={(patch) => updateContent(c._key, patch)}
                  onRemove={() => removeContent(c._key)}
                  onMove={(dir) => moveContent(c._key, dir)}
                />
              ))}
            </div>
          )}

          {/* Add content buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addContent("video")}
              className="gap-2 text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/10"
            >
              <PlayCircleIcon className="h-3.5 w-3.5" />
              Add Video Content
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addContent("pdf")}
              className="gap-2 text-rose-400 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10"
            >
              <FileTextIcon className="h-3.5 w-3.5" />
              Add PDF Content
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed preview */}
      {!mod.expanded && mod.contents.length > 0 && (
        <div className="px-5 py-2.5 flex flex-wrap gap-1.5">
          {mod.contents.map((c) => (
            <Badge
              key={c._key}
              variant="outline"
              className={`text-[10px] gap-1 ${
                c.content_type === "video"
                  ? "border-indigo-500/30 text-indigo-400"
                  : "border-rose-500/30 text-rose-400"
              }`}
            >
              {c.content_type === "video" ? (
                <PlayCircleIcon className="h-2.5 w-2.5" />
              ) : (
                <FileTextIcon className="h-2.5 w-2.5" />
              )}
              {c.title || (c.content_type === "video" ? "Video" : "PDF")}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function SortableModuleEditor({
  module: mod,
  moduleIndex,
  onChange,
  onRemove,
}: {
  module: ModuleRow
  moduleIndex: number
  onChange: (patch: Partial<ModuleRow> | ((prev: ModuleRow) => ModuleRow)) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod._key,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "z-10 opacity-80" : undefined}
    >
      <ModuleEditor
        module={mod}
        moduleIndex={moduleIndex}
        dragHandle={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-grab active:cursor-grabbing text-muted-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="h-4 w-4" />
            <span className="sr-only">Drag to reorder module</span>
          </Button>
        }
        onChange={onChange}
        onRemove={onRemove}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnlineCourseFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  // ── Course basic fields ───────────────────────────────────────────────────
  const [courseName, setCourseName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<string>("draft")
  const [level, setLevel] = useState<string>("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [deadline, setDeadline] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null)
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null)

  // ── Modules ───────────────────────────────────────────────────────────────
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [originalModuleOrderIds, setOriginalModuleOrderIds] = useState<number[]>([])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loadingCourse, setLoadingCourse] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const moduleSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  )

  // ── Load existing course for edit ─────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return
    let cancelled = false
    setLoadingCourse(true)
    setLoadError(null)
    getOnlineCourseById(Number(id))
      .then((course) => {
        if (cancelled) return
        setCourseName(course.name ?? "")
        setDescription(course.description ?? "")
        setStatus(course.status ?? "draft")
        setLevel(course.level ?? "")
        setCourseImageFile(null)
        setExistingImagePath(course.image_path ?? null)
        setEstimatedDuration(
          course.estimated_duration != null
            ? String(course.estimated_duration)
            : "",
        )
        if (course.deadline) {
          // Convert ISO → datetime-local format (YYYY-MM-DDTHH:MM)
          const d = new Date(course.deadline)
          const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
          setDeadline(local)
        }
        setIsActive(course.is_active ?? true)
        setModules(
          (course.modules ?? [])
            .slice()
            .sort((a, b) => a.order_number - b.order_number)
            .map(moduleFromApi),
        )
        setOriginalModuleOrderIds(
          (course.modules ?? [])
            .slice()
            .sort((a, b) => a.order_number - b.order_number)
            .map((m) => m.id),
        )
        setLoadingCourse(false)
      })
      .catch((err) => {
        if (cancelled) return
        const msg = extractError(err)
        if (msg) setLoadError(msg)
        setLoadingCourse(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, id])

  // ── Module helpers ────────────────────────────────────────────────────────

  function updateModule(
    key: string,
    patch: Partial<ModuleRow> | ((prev: ModuleRow) => ModuleRow),
  ) {
    setModules((prev) =>
      prev.map((m) => {
        if (m._key !== key) return m
        return typeof patch === "function" ? patch(m) : { ...m, ...patch }
      }),
    )
  }

  function removeModule(key: string) {
    setModules((prev) => prev.filter((m) => m._key !== key))
  }

  function handleModuleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setModules((prev) => {
      const oldIndex = prev.findIndex((m) => m._key === String(active.id))
      const newIndex = prev.findIndex((m) => m._key === String(over.id))
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  function persistedModuleIdsInCurrentOrder(): number[] {
    return modules
      .filter((m) => m.id != null)
      .map((m) => Number(m.id))
  }

  function requiresSeparateModuleReorder(): boolean {
    if (!isEdit) return false

    const currentSequence = modules.map((m) =>
      m.id != null ? `existing:${m.id}` : `new:${m._key}`,
    )
    const safeSequence = [
      ...originalModuleOrderIds.map((moduleId) => `existing:${moduleId}`),
      ...modules
        .filter((m) => m.id == null)
        .map((m) => `new:${m._key}`),
    ]

    if (currentSequence.length !== safeSequence.length) return false
    return currentSequence.some((item, idx) => item !== safeSequence[idx])
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!courseName.trim()) return "Course name is required."
    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi]
      if (!mod.name.trim())
        return `Module ${mi + 1} is missing a name.`
      for (let ci = 0; ci < mod.contents.length; ci++) {
        const c = mod.contents[ci]
        if (!c.title.trim())
          return `Module ${mi + 1}, content ${ci + 1} is missing a title.`
        if (c.content_type === "video" && !c.video_id.trim())
          return `Module ${mi + 1}, content ${ci + 1} (video) requires a video.`
        if (c.content_type === "pdf" && !c.pdfFile && !c.existingPdfPath)
          return `Module ${mi + 1}, content ${ci + 1} (PDF) requires a file.`
      }
    }
    return null
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const clientErr = validate()
    if (clientErr) {
      setSubmitError(clientErr)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const hasNewModules = modules.some((m) => m.id == null)
    const moduleOrderChanged = isEdit && requiresSeparateModuleReorder()
    let modulesForSubmit = modules

    setSubmitting(true)
    try {
      // If edit-mode order changed and all modules already exist, persist order first
      // so the update endpoint does not receive a conflicting order mutation.
      if (moduleOrderChanged && !hasNewModules) {
        await reorderModules({
          order: persistedModuleIdsInCurrentOrder().map((moduleId, index) => ({
            module_id: moduleId,
            order_number: index + 1,
          })),
        })
        setOriginalModuleOrderIds(persistedModuleIdsInCurrentOrder())
      }

      // If there are new modules (no IDs yet), submit existing modules in their
      // original order, then apply the full desired order after update succeeds.
      if (moduleOrderChanged && hasNewModules) {
        const existingById = new Map(
          modules
            .filter((m) => m.id != null)
            .map((m) => [Number(m.id), m] as const),
        )
        const orderedExisting = originalModuleOrderIds
          .map((moduleId) => existingById.get(moduleId))
          .filter((m): m is ModuleRow => Boolean(m))
        const newOnly = modules.filter((m) => m.id == null)
        modulesForSubmit = [...orderedExisting, ...newOnly]
      }

      const fd = buildFormData(
        courseName,
        description,
        status,
        level,
        estimatedDuration,
        deadline,
        isActive,
        courseImageFile,
        modulesForSubmit,
      )

      const result = isEdit
        ? await updateOnlineCourse(Number(id), fd)
        : await createOnlineCourse(fd)

      // Finalize desired order after update when new modules were created.
      if (isEdit && moduleOrderChanged && hasNewModules) {
        const updatedModules = (result.modules ?? [])
          .slice()
          .sort((a, b) => a.order_number - b.order_number)

        const newlyCreatedIds = updatedModules
          .map((m) => m.id)
          .filter((moduleId) => !originalModuleOrderIds.includes(moduleId))

        const desiredOrderIds: number[] = []
        let newIdx = 0
        for (const mod of modules) {
          if (mod.id != null) {
            desiredOrderIds.push(Number(mod.id))
          } else {
            const createdId = newlyCreatedIds[newIdx]
            if (createdId != null) desiredOrderIds.push(createdId)
            newIdx += 1
          }
        }

        const currentOrderIds = updatedModules.map((m) => m.id)
        const canReorder = desiredOrderIds.length === currentOrderIds.length
        const orderDiffers = canReorder
          ? desiredOrderIds.some((moduleId, idx) => moduleId !== currentOrderIds[idx])
          : false

        if (orderDiffers) {
          await reorderModules({
            order: desiredOrderIds.map((moduleId, index) => ({
              module_id: moduleId,
              order_number: index + 1,
            })),
          })
        }

        if (canReorder) setOriginalModuleOrderIds(desiredOrderIds)
      }

      toast.success(
        isEdit ? "Course updated successfully." : "Course created successfully.",
      )
      navigate(`/admin/course-management/online-courses/${result.id}`)
    } catch (err) {
      let msg = extractError(err)
      if (isApiError(err) && err.status === 500 && isEdit) {
        msg =
          "Server error while updating. Please try again; module order is now saved automatically during Update."
      }
      if (msg) {
        setSubmitError(msg)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading state (edit mode only) ────────────────────────────────────────

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/course-management/online-courses")}
            className="rounded-full border bg-background"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Online Course</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/course-management/online-courses")}
          className="rounded-full border bg-background hover:bg-muted shrink-0"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">
            Online Courses
          </p>
          <h1 className="text-xl font-semibold tracking-tight truncate">
            {isEdit ? `Edit: ${courseName || "…"}` : "Create Online Course"}
          </h1>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <AlertDescription className="leading-relaxed">{submitError}</AlertDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setSubmitError(null)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Left: Modules ─────────────────────────────────────────────── */}
        <div className="order-2 lg:order-1 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Modules{" "}
              {modules.length > 0 && (
                <span className="ml-1 normal-case tracking-normal text-foreground">
                  ({modules.length})
                </span>
              )}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModules((p) => [...p, emptyModule()])}
              className="gap-2"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Module
            </Button>
          </div>

          {isEdit && modules.length > 1 && (
            <Alert>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Drag and drop modules into the order you want. Module order is
                saved automatically when you click Update.
              </AlertDescription>
            </Alert>
          )}

          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-white/15 bg-white/3 text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <BookOpenIcon className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">No modules yet</p>
                <p className="text-sm text-muted-foreground/60 mt-0.5">
                  Add modules to structure the course content.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModules([emptyModule()])}
                className="gap-2 mt-1"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add First Module
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={moduleSensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleModuleDragEnd}
            >
              <SortableContext
                items={modules.map((mod) => mod._key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {modules.map((mod, mi) => (
                    <SortableModuleEditor
                      key={mod._key}
                      module={mod}
                      moduleIndex={mi}
                      onChange={(patch) => updateModule(mod._key, patch)}
                      onRemove={() => removeModule(mod._key)}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModules((p) => [...p, emptyModule()])}
                    className="gap-2 w-full"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add Another Module
                  </Button>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* ── Right: Course settings (sticky) ───────────────────────────── */}
        <div className="order-1 lg:order-2 space-y-4 lg:sticky lg:top-6">
          <Card className="border-white/10 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Course Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Course Image (optional)</Label>

                {existingImagePath && !courseImageFile && (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
                    <div className="aspect-video bg-black/20">
                      <img
                        src={existingImagePath}
                        alt={courseName || "Course image"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                      <span className="truncate text-muted-foreground">Current course image</span>
                      <label className="cursor-pointer shrink-0">
                        <span className="text-xs text-primary underline-offset-2 hover:underline">
                          Replace
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setCourseImageFile(file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {courseImageFile && (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm">
                    <ImageIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="flex-1 truncate text-emerald-300">
                      {courseImageFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setCourseImageFile(null)}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {!existingImagePath && !courseImageFile && (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/3 px-4 py-6 text-sm text-muted-foreground hover:border-white/30 hover:bg-white/5 transition-colors">
                    <ImageIcon className="h-5 w-5" />
                    <span>Upload a course cover image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        setCourseImageFile(file)
                        e.target.value = ""
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="course-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="course-name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Complete Web Development Course"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="course-desc">Description</Label>
                <Textarea
                  id="course-desc"
                  rows={3}
                  placeholder="What will learners gain from this course?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                />
              </div>

              <Separator className="opacity-15" />

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label>Level (optional)</Label>
                <Select
                  value={level || "__none__"}
                  onValueChange={(v) => setLevel(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No level —</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estimated Duration */}
              <div className="space-y-1.5">
                <Label htmlFor="course-duration">
                  Estimated Duration (minutes)
                </Label>
                <Input
                  id="course-duration"
                  type="number"
                  min={1}
                  placeholder="e.g. 120"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <Label>Deadline (optional)</Label>
                <DateTimePickerField
                  value={deadline}
                  onChange={setDeadline}
                  placeholder="Pick deadline"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive courses are hidden from the system.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  id="is-active"
                />
              </div>

              <Separator className="opacity-15" />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate("/admin/course-management/online-courses")
                  }
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="h-4 w-4" />
                  )}
                  {isEdit ? "Update" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status indicator */}
          <div className="flex items-center gap-2 px-1">
            <div
              className={`h-2 w-2 rounded-full ${
                status === "published"
                  ? "bg-emerald-400"
                  : status === "draft"
                    ? "bg-amber-400"
                    : "bg-zinc-400"
              }`}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {status}
            </span>
            {modules.length > 0 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">
                  {modules.length} module{modules.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
