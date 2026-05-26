// ─── BlogPostDetailSheet ──────────────────────────────────────────────────────
// Sheet showing full details of a single blog post loaded from the API.

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"
import { getBlogPostById } from "../service/blog.service"
import type { BlogPost, BlogPostDetail } from "../types/blog.types"
import { BlogStatusBadge } from "./shared/blog-status-badge"
import { BlogMediaBadge } from "./shared/blog-media-badge"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground wrap-break-word min-w-0 flex-1">{children}</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface BlogPostDetailSheetProps {
  post: BlogPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogPostDetailSheet({
  post,
  open,
  onOpenChange,
}: BlogPostDetailSheetProps) {
  const [detail, setDetail] = useState<BlogPostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !post) return

    setDetail(null)
    setError(null)
    setIsLoading(true)

    getBlogPostById(post.id)
      .then(setDetail)
      .catch((err) => {
        let msg = "Failed to load post details."
        if (isApiError(err)) msg = err.message || msg
        setError(msg)
      })
      .finally(() => setIsLoading(false))
  }, [open, post])

  if (!post) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-170 lg:max-w-190 p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <SheetTitle className="text-lg leading-snug pr-6">
              {post.title}
            </SheetTitle>
            <SheetDescription>Blog post details</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* ── Loading ───────────────────────────────────────────────────── */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            )}

            {/* ── Error ─────────────────────────────────────────────────────── */}
            {error && !isLoading && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* ── Detail content ────────────────────────────────────────────── */}
            {detail && !isLoading && (
              <>
                {/** Defensive fallbacks for partially shaped API responses. */}
                {(() => {
                  const tags = Array.isArray(detail.tags) ? detail.tags : []
                  const comments = Array.isArray(detail.comments)
                    ? detail.comments
                    : []

                  return (
                    <>
                {/* Thumbnail */}
                {detail.thumbnail_url && (
                  <img
                    src={detail.thumbnail_url}
                    alt={detail.title}
                    className="w-full max-h-52 rounded-xl object-cover border border-white/10"
                  />
                )}

                {/* Overview */}
                <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Overview
                  </p>
                  <div className="space-y-2.5">
                    <Row label="Status">
                      <BlogStatusBadge status={detail.status} />
                    </Row>
                    <Row label="Media">
                      <BlogMediaBadge mediaType={detail.media_type} />
                    </Row>
                    <Row label="Author">{detail.author.name}</Row>
                    <Row label="Slug">
                      <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">
                        {detail.slug}
                      </code>
                    </Row>
                    <Row label="Published">{formatDate(detail.published_at)}</Row>
                    <Row label="Likes">{detail.like_count}</Row>
                    <Row label="Comments">{detail.comment_count}</Row>
                  </div>
                </section>

                {/* Tags */}
                {tags.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Excerpt */}
                {detail.excerpt && (
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Excerpt
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {detail.excerpt}
                    </p>
                  </section>
                )}

                {/* Description */}
                {detail.description && (
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Description
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {detail.description}
                    </p>
                  </section>
                )}

                {/* Media streaming */}
                {detail.media?.stream_url && (
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Media Stream
                    </p>
                    {detail.media.type === "video" ? (
                      <video
                        src={detail.media.stream_url}
                        controls
                        className="w-full rounded-xl border border-white/10 bg-black"
                      />
                    ) : (
                      <audio
                        src={detail.media.stream_url}
                        controls
                        className="w-full"
                      />
                    )}
                  </section>
                )}

                {/* Comments */}
                {comments.length > 0 && (
                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Comments ({comments.length})
                    </p>
                    <div className="space-y-2">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm space-y-1"
                        >
                          <p className="font-medium text-foreground">
                            {c.author.name}
                          </p>
                          <p className="text-foreground/70">{c.body}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(c.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <Separator className="opacity-20" />

                {/* Timestamps */}
                <section className="space-y-2.5">
                  <Row label="Published">{formatDate(detail.published_at)}</Row>
                  <Row label="Created">{formatDate(detail.created_at)}</Row>
                  <Row label="Updated">{formatDate(detail.updated_at)}</Row>
                </section>
                    </>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
