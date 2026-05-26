// ─── BlogDetailHero ───────────────────────────────────────────────────────────
// Full-width cinematic hero for the article detail page.
// Shows the cover image (or a gradient placeholder) with layered gradient
// overlays and an overlaid metadata block at the bottom: badges, title, author.

import { CalendarIcon } from "lucide-react"

import { BlogMediaBadge } from "./blog-media-badge"
import { BlogTagBadge } from "./blog-tag-badge"
import type { PublicBlogPostDetail } from "../types/user-blog.types"

const HERO_GRADIENTS = [
  "from-violet-600/70 via-purple-800/50 to-indigo-950/80",
  "from-rose-500/70 via-pink-700/50 to-red-900/80",
  "from-amber-500/70 via-orange-700/50 to-yellow-900/80",
  "from-emerald-500/70 via-green-700/50 to-teal-900/80",
  "from-sky-500/70 via-blue-700/50 to-cyan-900/80",
  "from-fuchsia-500/70 via-pink-700/50 to-purple-950/80",
] as const

interface BlogDetailHeroProps {
  post: PublicBlogPostDetail
  formatDate: (iso: string) => string
}

export function BlogDetailHero({ post, formatDate }: BlogDetailHeroProps) {
  const gradient = HERO_GRADIENTS[post.id % HERO_GRADIENTS.length]

  return (
    <div className="group relative overflow-hidden rounded-3xl">
      {/* Cover image or gradient placeholder */}
      {post.thumbnail_url ? (
        <img
          src={post.thumbnail_url}
          alt={`Cover for "${post.title}"`}
          className="aspect-[21/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] sm:aspect-[16/7]"
          loading="eager"
        />
      ) : (
        <div
          className={`aspect-[21/9] w-full bg-gradient-to-br ${gradient} flex items-center justify-center sm:aspect-[16/7]`}
        >
          <span
            className="select-none font-black leading-none text-white/[0.07]"
            style={{ fontSize: "clamp(4rem, 15vw, 10rem)" }}
            aria-hidden="true"
          >
            {post.title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />

      {/* Metadata overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <BlogMediaBadge mediaType={post.media_type} showOE />
          {(post.tags ?? []).slice(0, 4).map((tag) => (
            <BlogTagBadge key={tag} tag={tag} />
          ))}
        </div>

        {/* Title */}
        <h1 className="mb-4 max-w-[92%] text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow-2xl sm:text-3xl lg:text-[2.15rem] xl:text-[2.5rem]">
          {post.title}
        </h1>

        {/* Author + Date */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <span
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white backdrop-blur-sm"
              aria-hidden="true"
            >
              {post.author.name.charAt(0).toUpperCase()}
            </span>
            <span className="font-medium text-white/90">{post.author.name}</span>
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
