import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { HeartIcon, MessageSquareIcon, CalendarIcon, UserIcon, Music2Icon, VideoIcon } from "lucide-react"
import { isApiError } from "@/lib/api"
import { getBlogPostById } from "../service/blog.service"
import type { BlogPostDetail } from "../types/blog.types"
import { BlogStatusBadge } from "./shared/blog-status-badge"
import { BlogMediaBadge } from "./shared/blog-media-badge"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface BlogPostDetailPageContentProps {
  postId: number
}

export function BlogPostDetailPageContent({ postId }: BlogPostDetailPageContentProps) {
  const [detail, setDetail] = useState<BlogPostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setDetail(null)
    setError(null)
    setIsLoading(true)

    getBlogPostById(postId)
      .then((data) => { if (active) setDetail(data) })
      .catch((err) => {
        if (!active) return
        let msg = "Failed to load post details."
        if (isApiError(err)) msg = err.message || msg
        else if (err instanceof Error) msg = err.message
        setError(msg)
      })
      .finally(() => { if (active) setIsLoading(false) })

    return () => { active = false }
  }, [postId])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-0 rounded-2xl border border-white/10 bg-card overflow-hidden shadow-sm">
        <Skeleton className="h-56 w-full rounded-none" />
        <div className="px-6 py-5 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="px-6 pb-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
  }

  if (!detail) return null

  const tags = Array.isArray(detail.tags) ? detail.tags : []
  const comments = Array.isArray(detail.comments) ? detail.comments : []

  return (
    <div className="space-y-0 rounded-2xl border border-white/10 bg-card overflow-hidden shadow-sm">

      {/* ── Hero thumbnail (compact height) ─────────────────────────────────── */}
      {detail.thumbnail_url ? (
        <div className="relative">
          <img
            src={detail.thumbnail_url}
            alt={detail.title}
            className="h-56 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-5">
            <BlogStatusBadge status={detail.status} />
          </div>
        </div>
      ) : (
        <div className="border-b border-white/6 px-6 py-4">
          <BlogStatusBadge status={detail.status} />
        </div>
      )}

      {/* ── Title + meta ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/6 px-6 py-5 space-y-3">
        <h2 className="text-2xl font-bold leading-tight tracking-tight">{detail.title}</h2>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {detail.author?.name && (
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 opacity-60" />
              {detail.author.name}
            </span>
          )}
          {detail.published_at && (
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
              {formatDate(detail.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-rose-400">
            <HeartIcon className="h-3.5 w-3.5" />
            {detail.like_count}
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <MessageSquareIcon className="h-3.5 w-3.5" />
            {detail.comment_count}
          </span>
          <code className="ml-auto rounded bg-white/5 px-2 py-0.5 text-xs text-muted-foreground/60">
            /{detail.slug}
          </code>
        </div>

        {/* Media type badge — always shown when post has media */}
        {detail.media_type && (
          <div className="flex items-center gap-2 pt-0.5">
            <BlogMediaBadge mediaType={detail.media_type} />
          </div>
        )}
      </div>

      {/* ── Attached media (player) — shown right after meta ────────────────── */}
      {detail.media && (
        <div className="border-b border-white/6 px-6 py-5 space-y-3">
          <div className="flex items-center gap-2">
            {detail.media.type === "video" ? (
              <VideoIcon className="h-4 w-4 text-sky-400" />
            ) : (
              <Music2Icon className="h-4 w-4 text-violet-400" />
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Attached {detail.media.type === "video" ? "Video" : "Audio"}
            </p>
          </div>
          {detail.media.stream_url ? (
            detail.media.type === "video" ? (
              <video
                src={detail.media.stream_url}
                controls
                className="w-full rounded-xl border border-white/10 bg-black"
              />
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
                  <Music2Icon className="h-4 w-4 text-violet-400" />
                </div>
                <audio src={detail.media.stream_url} controls className="flex-1 min-w-0" />
              </div>
            )
          ) : (
            <p className="text-xs text-muted-foreground italic">Stream URL not available.</p>
          )}
        </div>
      )}

      {/* ── Tags ─────────────────────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="border-b border-white/6 px-6 py-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Content: excerpt + description ───────────────────────────────────── */}
      {(detail.excerpt || detail.description) && (
        <div className="border-b border-white/6 px-6 py-5 space-y-5">
          {detail.excerpt && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Excerpt</p>
              <p className="text-sm leading-relaxed text-foreground/80 italic">{detail.excerpt}</p>
            </div>
          )}
          {detail.description && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Description</p>
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{detail.description}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Comments ─────────────────────────────────────────────────────────── */}
      {comments.length > 0 && (
        <div className="border-b border-white/6 px-6 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Comments ({comments.length})
          </p>
          <div className="space-y-2">
            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-1"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{c.author.name}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(c.created_at)}</p>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Timeline ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 px-6 py-4 text-xs text-muted-foreground/60">
        <span>Created: {formatDateTime(detail.created_at)}</span>
        <span>Updated: {formatDateTime(detail.updated_at)}</span>
        {detail.published_at && <span>Published: {formatDateTime(detail.published_at)}</span>}
      </div>
    </div>
  )
}
