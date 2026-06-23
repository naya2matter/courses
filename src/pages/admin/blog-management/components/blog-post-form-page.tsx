import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2Icon, UploadIcon, ImageIcon, VideoIcon, Music2Icon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import {
  createBlogPost,
  getAvailableAudios,
  getAvailableVideos,
  getBlogPostById,
  updateBlogPost,
} from "../service/blog.service"
import type {
  AvailableAudio,
  AvailableVideo,
  BlogPostPayload,
  BlogPostStatus,
} from "../types/blog.types"
import { TagsInput } from "./shared/tags-input"

interface FormState {
  title: string
  slug: string
  excerpt: string
  description: string
  status: BlogPostStatus
  tags: string[]
  mediableType: "video" | "audio" | ""
  mediableId: string
  thumbnail: File | null
}

interface BlogPostFormPageProps {
  postId?: number
  onSaved: () => void
  onCancel: () => void
}

const INITIAL_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  description: "",
  status: "draft",
  tags: [],
  mediableType: "",
  mediableId: "",
  thumbnail: null,
}

const SLUG_RE = /^[a-z0-9-]+$/

export function BlogPostFormPage({ postId, onSaved, onCancel }: BlogPostFormPageProps) {
  const isEdit = postId != null

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null)
  const [existingMedia, setExistingMedia] = useState<{ type: "video" | "audio"; id: number } | null>(null)
  const [videos, setVideos] = useState<AvailableVideo[]>([])
  const [audios, setAudios] = useState<AvailableAudio[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [slugError, setSlugError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [thumbnailPreview])

  useEffect(() => {
    let active = true
    setLoadingMedia(true)
    Promise.all([getAvailableVideos(), getAvailableAudios()])
      .then(([v, a]) => {
        if (!active) return
        setVideos(v)
        setAudios(a)
      })
      .catch(() => {})
      .finally(() => { if (active) setLoadingMedia(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setError(null)
    setFieldErrors({})
    setSlugError(null)

    if (!isEdit) {
      setForm(INITIAL_FORM)
      setExistingThumbnailUrl(null)
      setExistingMedia(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview)
        setThumbnailPreview(null)
      }
      return
    }

    setLoadingPost(true)
    getBlogPostById(postId)
      .then((detail) => {
        if (!active) return
        setExistingThumbnailUrl(detail.thumbnail_url ?? null)
        // Keep existing media so we can add a fallback option
        const mediaObj = detail.media
          ? { type: detail.media.type, id: detail.media.id }
          : null
        setExistingMedia(mediaObj)
        setForm({
          title: detail.title,
          slug: detail.slug,
          excerpt: detail.excerpt ?? "",
          description: detail.description ?? "",
          status: detail.status,
          // Defensive: API may return null/string instead of array
          tags: Array.isArray(detail.tags) ? detail.tags : [],
          mediableType:
            detail.media?.type === "video" ? "video" :
            detail.media?.type === "audio" ? "audio" : "",
          mediableId: detail.media ? String(detail.media.id) : "",
          thumbnail: null,
        })
      })
      .catch((err) => {
        if (!active) return
        let msg = "Failed to load blog post."
        if (isApiError(err)) msg = err.message || msg
        else if (err instanceof Error) msg = err.message
        setError(msg)
      })
      .finally(() => { if (active) setLoadingPost(false) })

    return () => { active = false }
  }, [isEdit, postId])

  // Build media options; if the current attached item isn't in the list, add a fallback entry
  const mediaOptions = useMemo<Array<{ id: number; title: string }>>(() => {
    const base = form.mediableType === "video" ? videos
      : form.mediableType === "audio" ? audios
      : []

    if (existingMedia && existingMedia.type === form.mediableType && form.mediableId) {
      const id = Number(form.mediableId)
      if (!base.find((m) => m.id === id)) {
        const label = form.mediableType === "video" ? `Video #${id}` : `Audio #${id}`
        return [{ id, title: `${label} (current)` }, ...base]
      }
    }
    return base
  }, [form.mediableType, form.mediableId, videos, audios, existingMedia])

  function field(key: keyof Pick<FormState, "title" | "slug" | "excerpt" | "description">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value
      setForm((prev) => ({ ...prev, [key]: val }))
      if (key === "slug") {
        if (val && !SLUG_RE.test(val)) {
          setSlugError("Only lowercase letters, numbers, and hyphens are allowed.")
        } else {
          setSlugError(null)
        }
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file))
      setForm((prev) => ({ ...prev, thumbnail: file }))
    } else {
      setThumbnailPreview(null)
      setForm((prev) => ({ ...prev, thumbnail: null }))
    }
  }

  function clearFile() {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    setThumbnailPreview(null)
    setForm((prev) => ({ ...prev, thumbnail: null }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function isFormValid() {
    if (!isEdit && !form.title.trim()) return false
    if (slugError) return false
    if (form.mediableType && !form.mediableId) return false
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (slugError) return

    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    const payload: BlogPostPayload = {
      title: form.title.trim() || undefined,
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      description: form.description.trim() || undefined,
      status: form.status,
      tags: form.tags.length ? form.tags : undefined,
      mediable_type:
        form.mediableType === "video" ? "App\\Models\\Video"
        : form.mediableType === "audio" ? "App\\Models\\Audio"
        : null,
      mediable_id: form.mediableId ? Number(form.mediableId) : null,
      thumbnail: form.thumbnail ?? undefined,
    }

    try {
      if (isEdit && postId != null) {
        await updateBlogPost(postId, payload)
        toast.success("Blog post updated.")
      } else {
        await createBlogPost({ ...payload, title: form.title.trim() })
        toast.success("Blog post created.")
      }
      onSaved()
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const mapped: Record<string, string> = {}
          for (const [f, msgs] of Object.entries(err.data.errors as Record<string, string[]>)) {
            mapped[f] = Array.isArray(msgs) ? msgs[0] : String(msgs)
          }
          setFieldErrors(mapped)
        } else {
          setError(err.message || "Request failed.")
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const previewSrc = thumbnailPreview ?? existingThumbnailUrl ?? null

  if (loadingPost) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-6 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2Icon className="h-4 w-4 animate-spin" /> Loading blog post…
        </span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0 rounded-2xl border border-white/10 bg-card overflow-hidden shadow-sm">

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="border-b border-white/6 px-6 py-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">

        {/* Left: text fields */}
        <div className="space-y-5 border-b border-white/6 px-6 py-6 lg:border-b-0 lg:border-r">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Content
            </p>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="bp-title" className="text-sm font-medium">
                  Title {!isEdit && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="bp-title"
                  value={form.title}
                  onChange={field("title")}
                  placeholder="Post title"
                  maxLength={255}
                  required={!isEdit}
                  autoFocus
                />
                {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
              </div>

              {/* Slug + Excerpt */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bp-slug" className="text-sm font-medium">Slug</Label>
                  <Input
                    id="bp-slug"
                    value={form.slug}
                    onChange={field("slug")}
                    placeholder="auto-generated-if-empty"
                  />
                  {(slugError ?? fieldErrors.slug) ? (
                    <p className="text-xs text-destructive">{slugError ?? fieldErrors.slug}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Lowercase, numbers and hyphens only.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bp-excerpt" className="text-sm font-medium">Excerpt</Label>
                    <span className={cn("text-xs", form.excerpt.length > 500 ? "text-destructive" : "text-muted-foreground")}>
                      {form.excerpt.length}/500
                    </span>
                  </div>
                  <Input
                    id="bp-excerpt"
                    value={form.excerpt}
                    onChange={field("excerpt")}
                    placeholder="Short summary for feed cards"
                    maxLength={500}
                  />
                  {fieldErrors.excerpt && <p className="text-xs text-destructive">{fieldErrors.excerpt}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="bp-description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="bp-description"
                  value={form.description}
                  onChange={field("description")}
                  placeholder="Full post body…"
                  rows={6}
                  className="resize-y"
                />
                {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
              </div>
            </div>
          </div>

          {/* Status + Tags */}
          <div className="border-t border-white/6 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Settings
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as BlogPostStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <TagsInput
                  value={form.tags}
                  onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                  placeholder="Add a tag (Enter or comma)"
                />
                {fieldErrors.tags && <p className="text-xs text-destructive">{fieldErrors.tags}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right: thumbnail + media */}
        <div className="space-y-0 divide-y divide-white/6">

          {/* Thumbnail */}
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Thumbnail
              </p>
              {form.thumbnail && (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={clearFile}>
                  Revert
                </Button>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              {previewSrc ? (
                <img src={previewSrc} alt="Thumbnail preview" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center gap-2 text-muted-foreground/40">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-sm">No thumbnail</span>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="border-white/10 bg-background hover:bg-accent gap-2" onClick={() => fileInputRef.current?.click()}>
                <UploadIcon className="h-3.5 w-3.5" />
                {existingThumbnailUrl ? "Replace" : "Choose image"}
              </Button>
              {form.thumbnail && (
                <span className="truncate text-xs text-muted-foreground">{form.thumbnail.name}</span>
              )}
            </div>
            {fieldErrors.thumbnail && <p className="text-xs text-destructive">{fieldErrors.thumbnail}</p>}
          </div>

          {/* Media attachment */}
          <div className="px-5 py-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Media Attachment
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Select
                value={form.mediableType || "none"}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    mediableType: v === "none" ? "" : (v as "video" | "audio"),
                    mediableId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No media" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No media</SelectItem>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2">
                      <VideoIcon className="h-3.5 w-3.5 text-sky-400" /> Video
                    </span>
                  </SelectItem>
                  <SelectItem value="audio">
                    <span className="flex items-center gap-2">
                      <Music2Icon className="h-3.5 w-3.5 text-violet-400" /> Audio
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.mediable_type && <p className="text-xs text-destructive">{fieldErrors.mediable_type}</p>}
            </div>

            {form.mediableType && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {form.mediableType === "video" ? "Video" : "Audio"}
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                {loadingMedia ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                ) : mediaOptions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/15 p-3 text-center text-sm text-muted-foreground">
                    No {form.mediableType === "video" ? "videos" : "audios"} available.
                  </div>
                ) : (
                  <SearchableSelect
                    value={form.mediableId || "none"}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, mediableId: v === "none" ? "" : v }))}
                    placeholder="Select item"
                    searchPlaceholder="Search…"
                    pinnedOptions={[{ value: "none", label: "None (remove attachment)" }]}
                    options={mediaOptions.map((m) => ({ value: String(m.id), label: m.title }))}
                  />
                )}
                {fieldErrors.mediable_id && <p className="text-xs text-destructive">{fieldErrors.mediable_id}</p>}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Optionally attach a video or audio clip to this post.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer actions ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-white/6 px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !isFormValid()} className="min-w-[120px]">
          {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create post"}
        </Button>
      </div>
    </form>
  )
}
