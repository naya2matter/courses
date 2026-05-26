// ─── BlogPostFormDialog ───────────────────────────────────────────────────────
// Shared Dialog for creating and editing a blog post.
// Fields: title (required on create), slug, excerpt, description, status,
//         tags (chip input), mediable_type + mediable_id, thumbnail (with preview).

import { useEffect, useRef, useState } from "react"
import { Loader2Icon, UploadIcon, XIcon, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  BlogPost,
  BlogPostPayload,
  BlogPostStatus,
} from "../types/blog.types"
import { TagsInput } from "./shared/tags-input"

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogPostFormDialogProps {
  /** Pass a post to edit; omit (or null) for create mode. */
  post?: BlogPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

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

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogPostFormDialog({
  post,
  open,
  onOpenChange,
  onSaved,
}: BlogPostFormDialogProps) {
  const isEdit = Boolean(post)

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null)
  const [videos, setVideos] = useState<AvailableVideo[]>([])
  const [audios, setAudios] = useState<AvailableAudio[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [slugError, setSlugError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Revoke preview URL on unmount / change ────────────────────────────────
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [thumbnailPreview])

  // ── Populate form when editing ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return

    setError(null)
    setFieldErrors({})
    setSlugError(null)

    if (post) {
      setExistingThumbnailUrl(post.thumbnail_url ?? null)
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        description: "",        // loaded below via getBlogPostById
        status: post.status,
        tags: post.tags ?? [],
        mediableType:
          post.media_type === "Video" ? "video" :
          post.media_type === "Audio" ? "audio" : "",
        mediableId: "",          // loaded below via getBlogPostById
        thumbnail: null,
      })

      // Fetch full detail to get description + mediable_id
      getBlogPostById(post.id)
        .then((detail) => {
          setForm((prev) => ({
            ...prev,
            description: detail.description ?? "",
            mediableId: detail.media ? String(detail.media.id) : "",
          }))
        })
        .catch(() => {
          /* non-critical — form still usable without description + id */
        })
    } else {
      setForm(INITIAL_FORM)
      setExistingThumbnailUrl(null)
    }

    // reset file input
    if (fileInputRef.current) fileInputRef.current.value = ""
    setThumbnailPreview(null)
  }, [open, post])

  // ── Load available media on open ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return

    setLoadingMedia(true)
    Promise.all([getAvailableVideos(), getAvailableAudios()])
      .then(([v, a]) => {
        setVideos(v)
        setAudios(a)
      })
      .catch(() => {
        /* non-critical */
      })
      .finally(() => setLoadingMedia(false))
  }, [open])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(INITIAL_FORM)
      setError(null)
      setFieldErrors({})
      setSlugError(null)
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview)
        setThumbnailPreview(null)
      }
      setExistingThumbnailUrl(null)
    }
    onOpenChange(next)
  }

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

  // ── Determine available media options based on selected type ───────────────
  const mediaOptions: Array<{ id: number; title: string }> =
    form.mediableType === "video" ? videos
    : form.mediableType === "audio" ? audios
    : []

  // ── Validate slug + media ──────────────────────────────────────────────────
  function isFormValid() {
    if (!isEdit && !form.title.trim()) return false
    if (slugError) return false
    // Cannot submit with a media type selected but no media item chosen
    if (form.mediableType && !form.mediableId) return false
    return true
  }

  // ── Submit ────────────────────────────────────────────────────────────────
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
      if (isEdit && post) {
        await updateBlogPost(post.id, payload)
        toast.success("Blog post updated.")
      } else {
        await createBlogPost({ ...payload, title: form.title.trim() })
        toast.success("Blog post created.")
      }
      handleOpenChange(false)
      onSaved()
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const mapped: Record<string, string> = {}
          for (const [f, msgs] of Object.entries(
            err.data.errors as Record<string, string[]>,
          )) {
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

  // ── Render ────────────────────────────────────────────────────────────────
  const previewSrc = thumbnailPreview ?? existingThumbnailUrl ?? null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Blog Post" : "New Blog Post"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the fields you want to change."
              : "Fill in the details for the new post."}
          </DialogDescription>
        </DialogHeader>

        <form id="blog-post-form" onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* ── Title ─────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="bp-title">
              Title {!isEdit && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="bp-title"
              value={form.title}
              onChange={field("title")}
              placeholder="Post title"
              maxLength={255}
              required={!isEdit}
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          {/* ── Slug ──────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="bp-slug">Slug</Label>
            <Input
              id="bp-slug"
              value={form.slug}
              onChange={field("slug")}
              placeholder="auto-generated-if-empty"
            />
            {(slugError ?? fieldErrors.slug) && (
              <p className="text-xs text-destructive">
                {slugError ?? fieldErrors.slug}
              </p>
            )}
            {!slugError && !fieldErrors.slug && (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            )}
          </div>

          {/* ── Excerpt ───────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bp-excerpt">Excerpt</Label>
              <span className={`text-xs ${form.excerpt.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                {form.excerpt.length}/500
              </span>
            </div>
            <Input
              id="bp-excerpt"
              value={form.excerpt}
              onChange={field("excerpt")}
              placeholder="Short summary shown in feed cards"
              maxLength={500}
            />
            {fieldErrors.excerpt && (
              <p className="text-xs text-destructive">{fieldErrors.excerpt}</p>
            )}
          </div>

          {/* ── Description ───────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="bp-description">Description</Label>
            <Textarea
              id="bp-description"
              value={form.description}
              onChange={field("description")}
              placeholder="Full post body…"
              rows={5}
              className="resize-y"
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* ── Status ────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  status: v as BlogPostStatus,
                }))
              }
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

          {/* ── Tags ──────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagsInput
              value={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
              placeholder="Add a tag (press Enter or comma)"
            />
            {fieldErrors.tags && (
              <p className="text-xs text-destructive">{fieldErrors.tags}</p>
            )}
          </div>

          <Separator />

          {/* ── Thumbnail ─────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>

            {/* Preview */}
            {previewSrc && (
              <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted aspect-video max-h-48">
                <img
                  src={previewSrc}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
                {form.thumbnail && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove thumbnail"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* File info row OR choose button */}
            {form.thumbnail ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-foreground">
                  {form.thumbnail.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {(form.thumbnail.size / 1024).toFixed(0)} KB
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="h-4 w-4" />
                {existingThumbnailUrl ? "Replace image" : "Choose image"}
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {fieldErrors.thumbnail && (
              <p className="text-xs text-destructive">
                {fieldErrors.thumbnail}
              </p>
            )}
          </div>

          <Separator />

          {/* ── Media attachment ──────────────────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Media Attachment</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Optionally attach a video or audio to this post.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
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
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.mediable_type && (
                <p className="text-xs text-destructive">
                  {fieldErrors.mediable_type}
                </p>
              )}
            </div>

            {/* Media ID selector — only shown once a type is selected */}
            {form.mediableType && (
              <div className="space-y-1.5">
                <Label>
                  {form.mediableType === "video" ? "Video" : "Audio"}
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                {loadingMedia ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Loading available {form.mediableType === "video" ? "videos" : "audios"}…
                  </div>
                ) : mediaOptions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
                    No {form.mediableType === "video" ? "videos" : "audios"} available.
                    Upload one first to attach it here.
                  </div>
                ) : (
                  <Select
                    value={form.mediableId || "none"}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        mediableId: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (remove attachment)</SelectItem>
                      {mediaOptions.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldErrors.mediable_id && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.mediable_id}
                  </p>
                )}
              </div>
            )}
          </div>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="blog-post-form"
            disabled={isSubmitting || !isFormValid()}
          >
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
