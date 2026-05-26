// ─── UserBlogDetailPage ───────────────────────────────────────────────────────
// Route: /user/blog/:slug
//
// Redesigned as a premium editorial article experience with:
//   • Fixed reading-progress bar
//   • Full-width cinematic hero with gradient overlays + metadata overlay
//   • Two-column layout on lg+: main article | related articles sidebar
//   • Custom audio player (play/pause, seek, skip ±15 s, mute)
//   • Styled native video player
//   • Editorial typography for the article body
//   • Redesigned comments section
//
// Media streaming:
//   media.stream_url is used verbatim as the HTML5 src attribute.
//   Signed query params (expires, signature) are never parsed or modified.
//
// Expired media:
//   If the browser fires onerror on the media element the ExpiredMediaCard is
//   shown with a Refresh Media button that re-fetches the post to get a fresh
//   signed stream_url.

import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertCircleIcon, ArrowLeftIcon, RefreshCwIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth"

import {
  getPublicBlogPostBySlug,
  getPublicBlogPosts,
  likePost,
  unlikePost,
  postBlogComment,
  deleteBlogComment,
} from "./service/user-blog.service"
import type { BlogComment, PublicBlogPost, PublicBlogPostDetail } from "./types/user-blog.types"

import { BlogReadingProgress } from "./components/blog-reading-progress"
import { BlogDetailHero } from "./components/blog-detail-hero"
import { BlogArticleMeta } from "./components/blog-article-meta"
import { BlogAudioPlayer } from "./components/blog-audio-player"
import { BlogVideoPlayer } from "./components/blog-video-player"
import { BlogArticleContent } from "./components/blog-article-content"
import { BlogRelatedArticles } from "./components/blog-related-articles"
import { BlogCommentsSection } from "./components/blog-comments-section"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function wordCount(text: string | null): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading article">
      {/* Hero */}
      <Skeleton className="aspect-[21/9] w-full rounded-3xl sm:aspect-[16/7]" />

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main */}
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-white/[0.07] p-3"
            >
              <Skeleton className="size-14 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5 py-0.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function UserBlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  // ── Post fetch state ───────────────────────────────────────────────────────
  const [post, setPost] = useState<PublicBlogPostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Related articles state ─────────────────────────────────────────────────
  const [relatedPosts, setRelatedPosts] = useState<PublicBlogPost[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(true)

  // ── Like state (derived from post, updated optimistically) ─────────────────
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  // ── Comments state (local list for instant append / remove) ───────────────
  const [comments, setComments] = useState<BlogComment[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({})

  // ── Sync like + comments whenever a fresh post arrives ────────────────────
  useEffect(() => {
    if (!post) return
    setLikeCount(post.like_count ?? 0)
    setIsLiked(post.is_liked ?? false)
    setComments(post.comments ?? [])
  }, [post])

  // ── Fetch post ────────────────────────────────────────────────────────────
  const fetchPost = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getPublicBlogPostBySlug(slug)
      setPost(res.data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(
        err instanceof Error ? err.message : "Failed to load post. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void fetchPost()
  }, [fetchPost])

  // ── Fetch related posts ────────────────────────────────────────────────────
  // Fire-and-forget; never blocks the main article.
  useEffect(() => {
    let cancelled = false
    setIsLoadingRelated(true)

    getPublicBlogPosts({ per_page: 6 })
      .then((res) => {
        if (cancelled) return
        const all = Array.isArray(res.data) ? res.data : []
        setRelatedPosts(all.filter((p) => p.slug !== slug).slice(0, 5))
      })
      .catch(() => {
        // silently ignore — related articles are non-critical
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRelated(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  // ── Like / unlike ─────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isLiking || !post) return
    const wasLiked = isLiked
    const prevCount = likeCount
    // Optimistic update
    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)
    setIsLiking(true)
    try {
      const res = wasLiked ? await unlikePost(post.id) : await likePost(post.id)
      setIsLiked(res.is_liked)
      setLikeCount(res.like_count)
    } catch {
      // Revert on failure
      setIsLiked(wasLiked)
      setLikeCount(prevCount)
    } finally {
      setIsLiking(false)
    }
  }

  // ── Submit comment ────────────────────────────────────────────────────────
  const handleSubmitComment = async (body: string) => {
    if (!post) return
    const res = await postBlogComment(post.id, body)
    setComments((prev) => [...prev, res.data])
  }

  // ── Delete comment ────────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId: number) => {
    setDeletingIds((prev) => new Set(prev).add(commentId))
    setDeleteErrors((prev) => {
      const next = { ...prev }
      delete next[commentId]
      return next
    })
    try {
      await deleteBlogComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      setDeleteErrors((prev) => ({
        ...prev,
        [commentId]:
          err instanceof Error ? err.message : "Failed to delete comment.",
      }))
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const wc = wordCount(post?.description ?? null)

  return (
    <>
      {/* ── Reading progress bar ─────────────────────────────────────────── */}
      <BlogReadingProgress />

      <div className="space-y-8">
        {/* ── Back navigation ──────────────────────────────────────────── */}
        <Link
          to="/user/blog"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-white/40 transition-colors hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Back to Blog
        </Link>

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {isLoading && <DetailSkeleton />}

        {/* ── Page-level error ─────────────────────────────────────────── */}
        {!isLoading && error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" aria-hidden="true" />
            <AlertTitle>
              {error === "Post not found" ? "Post Not Found" : "Failed to Load"}
            </AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              {error !== "Post not found" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPost}
                  className="shrink-0"
                >
                  <RefreshCwIcon className="mr-1.5 size-3.5" aria-hidden="true" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Article ──────────────────────────────────────────────────── */}
        {!isLoading && post && (
          <article aria-label={post.title}>

            {/* ── Cinematic hero ─────────────────────────────────────── */}
            <BlogDetailHero post={post} formatDate={formatDate} />

            {/* ── Two-column layout ──────────────────────────────────── */}
            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">

              {/* ── Main article column ─────────────────────────────── */}
              <div className="min-w-0 space-y-8">

                {/* Article meta: reading time, like, comments, excerpt */}
                <BlogArticleMeta
                  excerpt={post.excerpt}
                  wordCount={wc}
                  likeCount={likeCount}
                  isLiked={isLiked}
                  isLiking={isLiking}
                  commentCount={comments.length}
                  onLike={handleLike}
                />

                {/* Media player */}
                {post.media && (
                  <section
                    aria-label={
                      post.media.type === "video" ? "Video player" : "Audio player"
                    }
                  >
                    {post.media.type === "video" ? (
                      <BlogVideoPlayer
                        media={post.media}
                        onRefresh={fetchPost}
                      />
                    ) : (
                      <BlogAudioPlayer
                        media={post.media}
                        onRefresh={fetchPost}
                      />
                    )}
                  </section>
                )}

                {/* Article body */}
                {post.description && (
                  <section aria-label="Article content">
                    <BlogArticleContent description={post.description} />
                  </section>
                )}

                {/* Divider before comments */}
                <div className="h-px bg-white/[0.06]" />

                {/* Comments */}
                <BlogCommentsSection
                  comments={comments}
                  user={user}
                  deletingIds={deletingIds}
                  deleteErrors={deleteErrors}
                  onSubmit={handleSubmitComment}
                  onDelete={handleDeleteComment}
                />
              </div>

              {/* ── Sidebar (desktop only) ──────────────────────────── */}
              <aside className="hidden lg:block" aria-label="Related articles">
                <div className="sticky top-6">
                  <BlogRelatedArticles
                    posts={relatedPosts}
                    isLoading={isLoadingRelated}
                  />
                </div>
              </aside>
            </div>

            {/* ── Mobile related articles (below main content) ───────── */}
            <div className="mt-10 lg:hidden">
              <BlogRelatedArticles
                posts={relatedPosts}
                isLoading={isLoadingRelated}
              />
            </div>
          </article>
        )}
      </div>
    </>
  )
}