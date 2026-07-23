// ─── UserBlogFeedPage ─────────────────────────────────────────────────────────
// Editorial blog feed: top highlight card + card grid + pagination.

import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  SearchXIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { PageHeader } from "@/components/user/page-header"

import { getPublicBlogPosts, getBlogAuthors } from "./service/user-blog.service"
import type { PaginationMeta, PublicBlogPost, BlogAuthor } from "./types/user-blog.types"

import {
  BlogFiltersToolbar,
  type MediaTypeFilter,
} from "./components/blog-filters-toolbar"
import { BlogEditorialCard } from "./components/blog-post-card"
import { BlogMediaBadge } from "./components/blog-media-badge"
import { blogReadCta } from "./blog-cta"
import { BlogTagBadge } from "./components/blog-tag-badge"

// ── Default pagination meta ───────────────────────────────────────────────────

const DEFAULT_META: PaginationMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  per_page: 15,
  to: null,
  total: 0,
  path: "",
}

// ── Gradient palette (shared with cards) ─────────────────────────────────────

const THUMB_GRADIENTS = [
  "from-violet-600/45 via-purple-700/35 to-indigo-800/55",
  "from-rose-500/45 via-pink-600/35 to-red-700/55",
  "from-amber-500/45 via-orange-600/35 to-yellow-700/55",
  "from-emerald-500/45 via-green-600/35 to-teal-700/55",
  "from-sky-500/45 via-blue-600/35 to-cyan-700/55",
  "from-fuchsia-500/45 via-pink-600/35 to-purple-700/55",
] as const

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// ── Top highlight card ────────────────────────────────────────────────────────

function TopHighlightCard({ post }: { post: PublicBlogPost }) {
  const gradient = THUMB_GRADIENTS[post.id % THUMB_GRADIENTS.length]
  const tags = Array.isArray(post.tags) ? post.tags : []

  return (
    <article
      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]"
      aria-label={post.title}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="relative shrink-0 overflow-hidden sm:w-[42%]">
          {post.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="h-52 w-full object-cover sm:h-full"
              loading="eager"
            />
          ) : (
            <div
              className={`flex h-52 w-full items-center justify-center bg-gradient-to-br ${gradient} sm:h-full`}
            >
              <span className="select-none text-7xl font-black text-white/10">
                {post.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute left-3 top-3">
            <BlogMediaBadge mediaType={post.media_type} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:p-7">
          <div className="space-y-3">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 3).map((tag) => (
                  <BlogTagBadge key={tag} tag={tag} />
                ))}
              </div>
            )}
            <Link to={`/user/blog/${post.slug}`}>
              <h2 className="text-lg font-bold leading-snug tracking-tight text-white transition-colors hover:text-white/80 sm:text-xl lg:text-2xl">
                {post.title}
              </h2>
            </Link>
            {post.excerpt && (
              <p className="line-clamp-3 text-sm leading-relaxed text-white/45">
                {post.excerpt}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/40">
              <span className="font-medium text-white/55">{post.author?.name ?? "Unknown author"}</span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {formatDate(post.published_at)}
              </span>
              <span className="flex items-center gap-1 text-rose-400/60">
                <HeartIcon className="size-3" />
                {post.like_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-sky-400/60">
                <MessageSquareIcon className="size-3" />
                {post.comment_count.toLocaleString()}
              </span>
            </div>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="shrink-0 gap-1.5 rounded-lg px-3 text-xs text-white/50 hover:bg-white/8 hover:text-white"
            >
              <Link to={`/user/blog/${post.slug}`} aria-label={`${blogReadCta(post.media_type)}: ${post.title}`}>
                {blogReadCta(post.media_type)}
                <ArrowRightIcon className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Skeleton components ───────────────────────────────────────────────────────

function SkeletonHighlight() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="h-52 w-full rounded-none sm:h-auto sm:w-[42%]" />
        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-7">
          <div className="space-y-3">
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-7 w-3/5" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonEditorialCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4 lg:p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function UserBlogFeedPage() {
  // ── Server-side pagination ───────────────────────────────────────────────────
  const [items, setItems] = useState<PublicBlogPost[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 15

  // ── Client-side filter state ─────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [mediaType, setMediaType] = useState<MediaTypeFilter>("all")
  const [authorId, setAuthorId] = useState("all")

  // ── Authors (all published-post authors, for the filter dropdown) ─────────────
  const [authors, setAuthors] = useState<BlogAuthor[]>([])

  useEffect(() => {
    let active = true
    getBlogAuthors().then((list) => {
      if (active) setAuthors(list)
    })
    return () => { active = false }
  }, [])

  // ── Data fetching (author filter is applied server-side) ──────────────────────
  const fetchFeed = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getPublicBlogPosts({
        page,
        per_page: perPage,
        author_id: authorId === "all" ? null : Number(authorId),
      })
      setItems(Array.isArray(res.data) ? res.data : [])
      setMeta({
        current_page: res.meta?.current_page ?? page,
        last_page: Math.max(1, res.meta?.last_page ?? 1),
        per_page: res.meta?.per_page ?? perPage,
        total: Math.max(0, res.meta?.total ?? 0),
        from: res.meta?.from ?? null,
        to: res.meta?.to ?? null,
        path: res.meta?.path ?? "",
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message ?? "Failed to load blog posts.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load blog posts.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, authorId])

  useEffect(() => {
    void fetchFeed()
  }, [fetchFeed])

  // ── Client-side filtering ────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return items.filter((p) => {
      if (needle) {
        const haystack = [p.title, p.excerpt ?? "", ...(Array.isArray(p.tags) ? p.tags : [])]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      if (mediaType !== "all") {
        if (mediaType === "Text" && p.media_type !== null) return false
        if (mediaType === "Video" && p.media_type !== "Video") return false
        if (mediaType === "Audio" && p.media_type !== "Audio") return false
      }
      // Author is filtered server-side (see fetchFeed).
      return true
    })
  }, [items, search, mediaType])

  const highlightPost = filteredItems[0] ?? null
  const gridPosts = filteredItems.slice(1)
  const hasActiveFilters = search.trim().length > 0 || mediaType !== "all" || authorId !== "all"

  // ── Handlers ─────────────────────────────────────────────────────────────────
  // Author filtering is server-side, so changing it must reset to page 1.
  function handleAuthorChange(v: string) {
    setAuthorId(v)
    setPage(1)
  }

  function handleClearFilters() {
    setSearch("")
    setMediaType("all")
    setAuthorId("all")
    setPage(1)
  }

  function handlePrevPage() {
    setPage((p) => Math.max(1, p - 1))
  }

  function handleNextPage() {
    setPage((p) => Math.min(meta.last_page, p + 1))
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="The Blog"
        description="Articles, videos, and audio from our team."
        badge={
          !isLoading && meta.total > 0 ? (
            <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-px text-[11px] font-medium tabular-nums text-white/40">
              {meta.total}
            </span>
          ) : undefined
        }
        onRefresh={fetchFeed}
        refreshing={isLoading}
      />

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <Alert className="border-red-500/20 bg-red-500/[0.08] text-red-400">
          <AlertCircleIcon className="size-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFeed}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCwIcon className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      {!error && (
        <BlogFiltersToolbar
          search={search}
          mediaType={mediaType}
          authorId={authorId}
          authors={authors}
          onSearchChange={setSearch}
          onMediaTypeChange={setMediaType}
          onAuthorChange={handleAuthorChange}
          onClear={handleClearFilters}
          resultCount={filteredItems.length}
          totalCount={items.length}
        />
      )}

      {/* ── Loading skeletons ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-5">
          <SkeletonHighlight />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonEditorialCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Feed content ──────────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <>
          {filteredItems.length === 0 ? (
            /* ── Empty states ─────────────────────────────────────────────── */
            hasActiveFilters ? (
              <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <SearchXIcon className="size-8 text-white/20" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-white">
                    No posts match your filters
                  </p>
                  <p className="text-sm text-white/40">
                    Try adjusting your search or clearing the active filters.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="border-white/10 hover:border-white/20"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <BookOpenIcon className="size-8 text-white/20" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-white">
                    No published posts yet
                  </p>
                  <p className="text-sm text-white/40">
                    Check back later for articles, videos, and podcasts.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-5">
              {/* ── Top highlight ────────────────────────────────────────── */}
              {highlightPost && <TopHighlightCard post={highlightPost} />}

              {/* ── Card grid ────────────────────────────────────────────── */}
              {gridPosts.length > 0 && (
                <section aria-label="More articles">
                  {highlightPost && (
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-sm font-semibold tracking-tight text-white/50">
                        More Articles
                      </h2>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                  )}
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {gridPosts.map((post) => (
                      <BlogEditorialCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── Pagination bar ────────────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-3.5">
              <p className="text-xs text-white/35">
                Page {meta.current_page} of {meta.last_page}
                {meta.total > 0 && (
                  <span className="ml-1 text-white/25">
                    —&nbsp;{meta.total.toLocaleString()} total post
                    {meta.total !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={handlePrevPage}
                  className="gap-1.5 border-white/10 hover:border-white/20"
                >
                  <ChevronLeftIcon className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page || isLoading}
                  onClick={handleNextPage}
                  className="gap-1.5 border-white/10 hover:border-white/20"
                >
                  Next
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
