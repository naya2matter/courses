// ─── BlogRelatedArticles ──────────────────────────────────────────────────────
// Sidebar list of related / recent blog posts.
// Shows up to 5 compact editorial cards with thumbnail, media badge, title,
// and date. Renders skeleton cards while loading.

import { CalendarIcon, TrendingUpIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { BlogMediaBadge } from "./blog-media-badge"
import type { PublicBlogPost } from "../types/user-blog.types"

const THUMB_GRADIENTS = [
  "from-violet-500/50 to-purple-600/50",
  "from-sky-500/50 to-blue-600/50",
  "from-emerald-500/50 to-teal-600/50",
  "from-amber-500/50 to-orange-600/50",
  "from-rose-500/50 to-pink-600/50",
  "from-fuchsia-500/50 to-purple-600/50",
] as const

function shortDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface BlogRelatedArticlesProps {
  posts: PublicBlogPost[]
  isLoading: boolean
}

export function BlogRelatedArticles({ posts, isLoading }: BlogRelatedArticlesProps) {
  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="mb-4 flex items-center gap-2">
        <TrendingUpIcon className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-white/60">More From The Blog</h2>
      </div>

      {/* Skeletons */}
      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"
          >
            <Skeleton className="size-14 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5 py-0.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="mt-1 h-2.5 w-24" />
            </div>
          </div>
        ))}

      {/* Empty */}
      {!isLoading && posts.length === 0 && (
        <p className="py-4 text-center text-xs text-white/25">No related articles</p>
      )}

      {/* Article cards */}
      {!isLoading &&
        posts.map((post) => {
          const thumbGradient =
            THUMB_GRADIENTS[post.author.id % THUMB_GRADIENTS.length]
          return (
            <Link
              key={post.id}
              to={`/user/blog/${post.slug}`}
              className="group flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
            >
              {/* Thumbnail */}
              <div className="size-14 shrink-0 overflow-hidden rounded-lg">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`size-full bg-gradient-to-br ${thumbGradient} flex items-center justify-center`}
                  >
                    <span
                      className="text-sm font-bold text-white/60"
                      aria-hidden="true"
                    >
                      {post.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <BlogMediaBadge mediaType={post.media_type} size="sm" />
                <p className="line-clamp-2 text-xs font-semibold leading-snug text-white/65 transition-colors group-hover:text-white">
                  {post.title}
                </p>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-white/25">
                  <CalendarIcon className="size-2.5" aria-hidden="true" />
                  {shortDate(post.published_at)}
                </span>
              </div>
            </Link>
          )
        })}
    </div>
  )
}
