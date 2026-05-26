// ─── BlogArticleMeta ──────────────────────────────────────────────────────────
// Reading time estimate, like toggle pill, comment count pill, and styled excerpt.

import { ClockIcon, HeartIcon, Loader2Icon, MessageSquareIcon } from "lucide-react"

interface BlogArticleMetaProps {
  excerpt: string | null
  wordCount: number
  likeCount: number
  isLiked: boolean
  isLiking: boolean
  commentCount: number
  onLike: () => void
}

function estimateReadingTime(wordCount: number): string {
  const min = Math.ceil(wordCount / 200)
  return min <= 1 ? "1 min read" : `${min} min read`
}

export function BlogArticleMeta({
  excerpt,
  wordCount,
  likeCount,
  isLiked,
  isLiking,
  commentCount,
  onLike,
}: BlogArticleMetaProps) {
  return (
    <div className="space-y-5">
      {/* Pill row */}
      <div className="flex flex-wrap items-center gap-2">
        {wordCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/45">
            <ClockIcon className="size-3.5" aria-hidden="true" />
            {estimateReadingTime(wordCount)}
          </span>
        )}

        {/* Like toggle */}
        <button
          onClick={onLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 disabled:opacity-60 ${
            isLiked
              ? "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
              : "border-white/[0.08] bg-white/[0.04] text-white/45 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
          }`}
          aria-label={isLiked ? "Unlike this post" : "Like this post"}
          aria-pressed={isLiked}
        >
          {isLiking ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <HeartIcon
              className="size-3.5 transition-transform duration-150"
              fill={isLiked ? "currentColor" : "none"}
              aria-hidden="true"
            />
          )}
          <span>{likeCount.toLocaleString()}</span>
        </button>

        {/* Comment count */}
        <span
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/45"
          aria-label={`${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
        >
          <MessageSquareIcon className="size-3.5" aria-hidden="true" />
          {commentCount.toLocaleString()}
        </span>
      </div>

      {/* Excerpt / pull quote */}
      {excerpt && (
        <blockquote className="border-l-[3px] border-primary/50 pl-5">
          <p className="text-base italic leading-relaxed text-white/55">{excerpt}</p>
        </blockquote>
      )}
    </div>
  )
}
