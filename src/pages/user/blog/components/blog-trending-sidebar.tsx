// ─── BlogTrendingSidebar ──────────────────────────────────────────────────────
// Vertical stack of compact trending/related posts shown beside the hero.
// Renders nothing when the posts array is empty.

import { Link } from "react-router-dom"
import { CalendarIcon, TrendingUpIcon } from "lucide-react"

import type { PublicBlogPost } from "../types/user-blog.types"
import { BlogMediaBadge } from "./blog-media-badge"

// ── Constants ─────────────────────────────────────────────────────────────────

const THUMB_GRADIENTS = [
  "from-violet-600/50 to-indigo-800/70",
  "from-rose-500/50 to-red-800/70",
  "from-amber-500/50 to-orange-700/70",
  "from-emerald-500/50 to-teal-800/70",
  "from-sky-500/50 to-blue-800/70",
  "from-fuchsia-500/50 to-purple-800/70",
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BlogTrendingSidebarProps {
  posts: PublicBlogPost[]
  /**
   * When provided, clicking a card calls onSelect instead of navigating to
   * the detail page. Use this on the feed page for in-place hero switching.
   */
  onSelect?: (post: PublicBlogPost) => void
}

export function BlogTrendingSidebar({ posts, onSelect }: BlogTrendingSidebarProps) {
  if (posts.length === 0) return null

  const cardCls =
    "group flex gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"

  return (
    <aside
      className="flex flex-col gap-3"
      aria-label="Trending articles"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <TrendingUpIcon className="size-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight text-white/75">
          Also This Week
        </h3>
      </div>

      {/* Trending cards */}
      {posts.map((post, idx) => {
        const gradient = THUMB_GRADIENTS[post.id % THUMB_GRADIENTS.length]

        const inner = (
          <>
            {/* Thumbnail */}
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl sm:size-20">
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
                >
                  <span className="select-none text-xl font-black text-white/20">
                    {post.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 py-0.5">
              {/* Rank + media badge */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold tabular-nums text-primary/60">
                  {String(idx + 2).padStart(2, "0")}
                </span>
                <BlogMediaBadge mediaType={post.media_type} size="sm" />
              </div>

              {/* Title */}
              <p className="line-clamp-2 text-xs font-semibold leading-snug text-white/70 transition-colors group-hover:text-white">
                {post.title}
              </p>

              {/* Date */}
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <CalendarIcon className="size-2.5" />
                {formatDate(post.published_at)}
              </span>
            </div>
          </>
        )

        return onSelect ? (
          <button
            key={post.id}
            type="button"
            onClick={() => onSelect(post)}
            aria-label={`Switch to: ${post.title}`}
            className={`w-full text-left ${cardCls}`}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={post.id}
            to={`/user/blog/${post.slug}`}
            aria-label={`Article ${idx + 2}: ${post.title}`}
            className={cardCls}
          >
            {inner}
          </Link>
        )
      })}
    </aside>
  )
}
