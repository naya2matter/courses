// ─── BlogEditorialCard ────────────────────────────────────────────────────────
// Magazine-style editorial grid card for the blog feed.
// Hover: lift + glow border + image scale + depth shadow.

import { Link } from "react-router-dom"
import {
  ArrowRightIcon,
  CalendarIcon,
  HeartIcon,
  MessageSquareIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PublicBlogPost } from "../types/user-blog.types"
import { BlogMediaBadge } from "./blog-media-badge"
import { BlogTagBadge } from "./blog-tag-badge"

// ── Constants ─────────────────────────────────────────────────────────────────

const THUMB_GRADIENTS = [
  "from-violet-600/45 via-purple-700/35 to-indigo-800/55",
  "from-rose-500/45 via-pink-600/35 to-red-700/55",
  "from-amber-500/45 via-orange-600/35 to-yellow-700/55",
  "from-emerald-500/45 via-green-600/35 to-teal-700/55",
  "from-sky-500/45 via-blue-600/35 to-cyan-700/55",
  "from-fuchsia-500/45 via-pink-600/35 to-purple-700/55",
] as const

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
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

interface BlogEditorialCardProps {
  post: PublicBlogPost
}

export function BlogEditorialCard({ post }: BlogEditorialCardProps) {
  const gradient = THUMB_GRADIENTS[post.id % THUMB_GRADIENTS.length]
  const avatarColor = AVATAR_COLORS[post.author.id % AVATAR_COLORS.length]
  const tags = Array.isArray(post.tags) ? post.tags : []
  const visibleTags = tags.slice(0, 3)
  const extraTags = tags.length - 3

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.02] shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/[0.14] hover:shadow-2xl hover:shadow-black/30"
      aria-label={post.title}
    >
      {/* ── Thumbnail ──────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden">
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <span className="select-none text-6xl font-black text-white/15">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Bottom fade for readability */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Media badge — top-left */}
        <div className="absolute left-3 top-3">
          <BlogMediaBadge mediaType={post.media_type} size="sm" />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4 lg:p-5">
        {/* Title — also a link */}
        <Link
          to={`/user/blog/${post.slug}`}
          className="group/title block focus-visible:outline-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-white transition-colors group-hover/title:text-white/80 sm:text-base">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="line-clamp-2 text-xs leading-relaxed text-white/45">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {visibleTags.map((tag) => (
              <BlogTagBadge key={tag} tag={tag} />
            ))}
            {extraTags > 0 && (
              <span className="text-[10px] text-white/30">+{extraTags}</span>
            )}
          </div>
        )}

        {/* Footer — pushed to bottom */}
        <div className="mt-auto space-y-3 pt-1">
          {/* Author + date */}
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <span
              className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-[10px] font-bold text-white`}
              aria-hidden="true"
            >
              {post.author.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate font-medium text-white/55">
              {post.author.name}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <CalendarIcon className="size-3" />
              {formatDate(post.published_at)}
            </span>
          </div>

          {/* Engagement + CTA */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-rose-400/65">
                <HeartIcon className="size-3" />
                {post.like_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-sky-400/65">
                <MessageSquareIcon className="size-3" />
                {post.comment_count.toLocaleString()}
              </span>
            </div>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 rounded-lg px-2.5 text-[11px] text-white/50 hover:bg-white/10 hover:text-white"
            >
              <Link
                to={`/user/blog/${post.slug}`}
                aria-label={`Read: ${post.title}`}
              >
                Read
                <ArrowRightIcon className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
