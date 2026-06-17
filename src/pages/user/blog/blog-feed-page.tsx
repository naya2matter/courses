// ─── UserBlogFeedPage ─────────────────────────────────────────────────────────
// Premium editorial blog feed.
// Layout: summary cards → filter bar → hero + trending sidebar → editorial grid → pagination.
// Hero takes filteredItems[0], trending takes [1..3], grid takes [4+].

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircleIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  SearchXIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { PageHeader } from "@/components/user/page-header"

import { getPublicBlogPosts } from "./service/user-blog.service"
import type { PaginationMeta, PublicBlogPost } from "./types/user-blog.types"

import {
  BlogFiltersToolbar,
  type MediaTypeFilter,
} from "./components/blog-filters-toolbar"
import { BlogHeroFeature } from "./components/blog-featured-card"
import { BlogTrendingSidebar } from "./components/blog-trending-sidebar"
import { BlogEditorialCard } from "./components/blog-post-card"

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

// ── Skeleton components ───────────────────────────────────────────────────────

function SkeletonHero() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03]">
      <div className="flex flex-col lg:flex-row lg:min-h-[420px]">
        <Skeleton className="aspect-video w-full rounded-none lg:aspect-auto lg:w-[55%]" />
        <div className="flex-1 space-y-4 p-6 lg:p-9">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonTrendingCard() {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
      <Skeleton className="size-16 shrink-0 rounded-xl sm:size-20" />
      <div className="flex flex-1 flex-col gap-2 py-0.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-16" />
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
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
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
  const [perPage, setPerPage] = useState(15)

  // ── Client-side filter state ─────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [mediaType, setMediaType] = useState<MediaTypeFilter>("all")
  const [authorId, setAuthorId] = useState("all")

  // ── Hero selection for "Also This Week" switching ────────────────────────────
  const [featuredSlug, setFeaturedSlug] = useState<string | null>(null)

  // ── Derived: unique authors from current page ────────────────────────────────
  const authors = useMemo(() => {
    const map = new Map<number, string>()
    items.forEach((p) => map.set(p.author.id, p.author.name))
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getPublicBlogPosts({ page, per_page: perPage })
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
  }, [page, perPage])

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
      if (authorId !== "all" && String(p.author.id) !== authorId) return false
      return true
    })
  }, [items, search, mediaType, authorId])

  const featuredPost =
    featuredSlug != null
      ? (filteredItems.find((p) => p.slug === featuredSlug) ?? filteredItems[0] ?? null)
      : (filteredItems[0] ?? null)
  const trendingPosts = filteredItems.filter((p) => p.slug !== featuredPost?.slug).slice(0, 3)
  const gridPosts = filteredItems.filter((p) => p.slug !== featuredPost?.slug).slice(3)
  const hasActiveFilters =
    search.trim().length > 0 || mediaType !== "all" || authorId !== "all"

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleClearFilters() {
    setSearch("")
    setMediaType("all")
    setAuthorId("all")
    setFeaturedSlug(null)
  }

  function handlePerPageChange(v: number) {
    setPerPage(v)
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
          perPage={perPage}
          authors={authors}
          onSearchChange={setSearch}
          onMediaTypeChange={setMediaType}
          onAuthorChange={setAuthorId}
          onPerPageChange={handlePerPageChange}
          onClear={handleClearFilters}
          resultCount={filteredItems.length}
          totalCount={items.length}
        />
      )}

      {/* ── Loading skeletons ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,360px)]">
            <SkeletonHero />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonTrendingCard key={i} />
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
            <>
              {/* ── Hero + Trending ──────────────────────────────────────── */}
              {featuredPost && (
                <section aria-label="Featured and trending articles">
                  <div
                    className={
                      trendingPosts.length > 0
                        ? "grid gap-5 lg:grid-cols-[1fr_minmax(0,360px)]"
                        : ""
                    }
                  >
                    <BlogHeroFeature post={featuredPost} />
                    {trendingPosts.length > 0 && (
                      <BlogTrendingSidebar
                        posts={trendingPosts}
                        onSelect={(p) => setFeaturedSlug(p.slug)}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* ── Editorial grid ───────────────────────────────────────── */}
              {gridPosts.length > 0 && (
                <section aria-label="More articles">
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-sm font-semibold tracking-tight text-white/60">
                      More Articles
                    </h2>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {gridPosts.map((post) => (
                      <BlogEditorialCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}
            </>
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


