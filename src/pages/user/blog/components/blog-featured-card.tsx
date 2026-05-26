// ─── BlogHeroFeature ──────────────────────────────────────────────────────────
// Cinematic full-width hero card for the featured/latest article.
// Desktop: image-left (55%) | content-right split with editorial typography.
// Mobile: image stacked on top, content below.

import { Link } from "react-router-dom"
import {
  ArrowRightIcon,
  CalendarIcon,
  HeartIcon,
  MessageSquareIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PublicBlogPost } from "../types/user-blog.types"
import { BlogMediaBadge } from "./blog-media-badge"
import { BlogTagBadge } from "./blog-tag-badge"

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_GRADIENTS = [
  "from-violet-600/60 via-purple-700/50 to-indigo-900/80",
  "from-rose-500/60 via-pink-700/50 to-red-900/80",
  "from-amber-500/60 via-orange-600/50 to-yellow-800/80",
  "from-emerald-500/60 via-teal-600/50 to-green-900/80",
  "from-sky-500/60 via-blue-600/50 to-indigo-900/80",
  "from-fuchsia-500/60 via-pink-700/50 to-purple-900/80",
] as const

const AVATAR_COLORS = [
  "from-violet-500 to-purple-700",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-purple-700",
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLongDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BlogHeroFeatureProps {
  post: PublicBlogPost
}

export function BlogHeroFeature({ post }: BlogHeroFeatureProps) {
  const gradient = HERO_GRADIENTS[post.id % HERO_GRADIENTS.length]
  const avatarColor = AVATAR_COLORS[post.author.id % AVATAR_COLORS.length]
  const visibleTags = post.tags.slice(0, 4)
  const extraTags = post.tags.length - 4

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] shadow-2xl shadow-black/20 transition-all duration-500 hover:border-white/[0.14] hover:shadow-black/40"
      aria-label={`Featured: ${post.title}`}
    >
      <div className="flex flex-col lg:flex-row lg:min-h-[420px]">
        {/* ── Thumbnail ──────────────────────────────────────────────────── */}
        <div className="relative aspect-video shrink-0 overflow-hidden lg:aspect-auto lg:w-[55%]">
          {post.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="eager"
            />
          ) : (
            <div
              className={`flex h-full min-h-[260px] w-full items-center justify-center bg-gradient-to-br ${gradient}`}
            >
              <span
                className="select-none font-black text-white/10"
                style={{ fontSize: "clamp(5rem,12vw,10rem)" }}
              >
                {post.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Mobile: bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent lg:hidden" />
          {/* Desktop: right-edge blend */}
          <div className="absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-r from-transparent to-black/50 lg:block" />
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-between gap-6 px-6 py-7 lg:px-8 lg:py-9">
          {/* Top block */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/30 bg-primary/10 text-primary text-[11px] font-semibold">
                Featured Story
              </Badge>
              <BlogMediaBadge mediaType={post.media_type} size="md" />
            </div>

            <h2 className="line-clamp-3 text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl lg:text-[1.65rem] lg:leading-snug">
              {post.title}
            </h2>

            {post.excerpt && (
              <p className="line-clamp-3 text-sm leading-relaxed text-white/50 lg:text-[0.9375rem]">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTags.map((tag) => (
                <BlogTagBadge key={tag} tag={tag} />
              ))}
              {extraTags > 0 && (
                <span className="text-[10px] text-white/30">
                  +{extraTags} more
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Author + meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/45">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-[10px] font-bold text-white shadow-sm`}
                  aria-hidden="true"
                >
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium text-white/65">
                  {post.author.name}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {formatLongDate(post.published_at)}
              </span>
              <span className="flex items-center gap-1 text-rose-400/75">
                <HeartIcon className="size-3" />
                {post.like_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-sky-400/75">
                <MessageSquareIcon className="size-3" />
                {post.comment_count.toLocaleString()}
              </span>
            </div>

            {/* CTA */}
            <Button
              asChild
              size="sm"
              className="shrink-0 gap-2 self-start sm:self-auto"
            >
              <Link
                to={`/user/blog/${post.slug}`}
                aria-label={`Read full article: ${post.title}`}
              >
                Read Article
                <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

