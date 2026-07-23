// ─── BlogDetailHero ───────────────────────────────────────────────────────────
// Compact article header: thumbnail image + metadata block below.

import { CalendarIcon } from "lucide-react"

import { BlogMediaBadge } from "./blog-media-badge"
import { BlogTagBadge } from "./blog-tag-badge"
import type { PublicBlogPostDetail } from "../types/user-blog.types"

const HERO_GRADIENTS = [
  "from-violet-600/45 via-purple-700/35 to-indigo-800/55",
  "from-rose-500/45 via-pink-600/35 to-red-700/55",
  "from-amber-500/45 via-orange-600/35 to-yellow-700/55",
  "from-emerald-500/45 via-green-600/35 to-teal-700/55",
  "from-sky-500/45 via-blue-600/35 to-cyan-700/55",
  "from-fuchsia-500/45 via-pink-600/35 to-purple-700/55",
] as const

interface BlogDetailHeroProps {
  post: PublicBlogPostDetail
  formatDate: (iso: string) => string
}

export function BlogDetailHero({ post, formatDate }: BlogDetailHeroProps) {
  const gradient = HERO_GRADIENTS[post.id % HERO_GRADIENTS.length]
  const tags = Array.isArray(post.tags) ? post.tags : []

  return (
    <div className="space-y-5">
      {/* Thumbnail */}
      <div className="overflow-hidden rounded-2xl">
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={`Cover for "${post.title}"`}
            className="aspect-video w-full max-h-64 object-cover"
            loading="eager"
          />
        ) : (
          <div
            className={`aspect-video w-full max-h-64 bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <span
              className="select-none font-black leading-none text-white/[0.07]"
              style={{ fontSize: "clamp(3rem, 12vw, 7rem)" }}
              aria-hidden="true"
            >
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <BlogMediaBadge mediaType={post.media_type} showOE />
          {tags.slice(0, 4).map((tag) => (
            <BlogTagBadge key={tag} tag={tag} />
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2rem]">
          {post.title}
        </h1>

        {/* Author + Date */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/50">
          <span className="flex items-center gap-2">
            <span
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white"
              aria-hidden="true"
            >
              {(post.author?.name ?? "?").charAt(0).toUpperCase()}
            </span>
            <span className="font-medium text-white/70">{post.author?.name ?? "Unknown author"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          </span>
        </div>
      </div>
    </div>
  )
}
