// ─── BlogCommentsSection ──────────────────────────────────────────────────────
// Redesigned comments area with:
//   • Editorial-style header
//   • Comment form (for authenticated users)
//   • Soft glass comment cards
//   • Premium empty state
//   • Delete support for own comments

import { useState } from "react"
import {
  AlertCircleIcon,
  Loader2Icon,
  MessageSquareIcon,
  SendIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { BlogComment } from "../types/user-blog.types"

// ── Avatar palette ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-300",
  "bg-sky-500/20 text-sky-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"
}

// ── Comment card ──────────────────────────────────────────────────────────────

interface CommentCardProps {
  comment: BlogComment
  isOwn: boolean
  isDeleting: boolean
  deleteError: string | null
  onDelete: (id: number) => void
}

function CommentCard({
  comment,
  isOwn,
  isDeleting,
  deleteError,
  onDelete,
}: CommentCardProps) {
  const authorName = comment.author?.name ?? "Unknown user"
  const colorClass = AVATAR_COLORS[(comment.author?.id ?? 0) % AVATAR_COLORS.length]

  return (
    <article
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-colors hover:border-white/[0.1]"
      aria-label={`Comment by ${authorName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}
            aria-hidden="true"
          >
            {initials(authorName)}
          </div>

          {/* Name + date */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-white">
                {authorName}
              </span>
              {isOwn && (
                <Badge className="border-sky-500/30 bg-sky-500/10 px-1.5 py-0 text-[10px] text-sky-400">
                  You
                </Badge>
              )}
            </div>
            <time className="text-xs text-white/30" dateTime={comment.created_at}>
              {fmtDate(comment.created_at)}
            </time>
          </div>
        </div>

        {/* Delete button */}
        {isOwn && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-white/20 hover:bg-rose-500/10 hover:text-rose-400"
            onClick={() => onDelete(comment.id)}
            disabled={isDeleting}
            aria-label="Delete comment"
          >
            {isDeleting ? (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2Icon className="size-3.5" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      {/* Body */}
      <p className="mt-3 pl-11 text-sm leading-relaxed text-white/60 whitespace-pre-wrap">
        {comment.body}
      </p>

      {deleteError && (
        <p className="mt-1 pl-11 text-xs text-rose-400">{deleteError}</p>
      )}
    </article>
  )
}

// ── Comment form ──────────────────────────────────────────────────────────────

interface CommentFormProps {
  currentUserName: string
  currentUserId: number
  onSubmit: (body: string) => Promise<void>
}

function CommentForm({ currentUserName, currentUserId, onSubmit }: CommentFormProps) {
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colorClass = AVATAR_COLORS[currentUserId % AVATAR_COLORS.length]
  const remaining = 2000 - body.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(trimmed)
      setBody("")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to post comment. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}
          aria-hidden="true"
        >
          {initials(currentUserName)}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts…"
            maxLength={2000}
            rows={3}
            disabled={isSubmitting}
            className="resize-none border-white/[0.08] bg-white/[0.04] placeholder:text-white/25 focus-visible:border-white/20 focus-visible:ring-0"
            aria-label="Comment body"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`text-xs ${remaining < 100 ? "text-amber-400" : "text-white/25"}`}
            >
              {remaining.toLocaleString()} remaining
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim() || isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <SendIcon className="size-3.5" aria-hidden="true" />
              )}
              {isSubmitting ? "Posting…" : "Post Comment"}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2">
              <AlertCircleIcon
                className="size-3.5 shrink-0 text-rose-400"
                aria-hidden="true"
              />
              <p className="flex-1 text-xs text-rose-300">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400/60 transition-colors hover:text-rose-400"
                aria-label="Dismiss error"
              >
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export interface BlogCommentsSectionProps {
  comments: BlogComment[]
  /** Pass the AuthUser from useAuth(), or null if unauthenticated. */
  user: { id: string; name: string } | null
  deletingIds: Set<number>
  deleteErrors: Record<number, string>
  onSubmit: (body: string) => Promise<void>
  onDelete: (id: number) => void
}

export function BlogCommentsSection({
  comments,
  user,
  deletingIds,
  deleteErrors,
  onSubmit,
  onDelete,
}: BlogCommentsSectionProps) {
  const currentUserId = user ? Number(user.id) : -1

  return (
    <section aria-label="Comments" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquareIcon className="size-4 text-white/35" aria-hidden="true" />
        <h2 className="font-semibold text-white">
          Comments{" "}
          <span className="text-sm font-normal text-white/30">
            ({comments.length})
          </span>
        </h2>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      {/* Form — only for authenticated users */}
      {user && (
        <CommentForm
          currentUserName={user.name}
          currentUserId={currentUserId}
          onSubmit={onSubmit}
        />
      )}

      {/* Empty state */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
            <MessageSquareIcon
              className="size-5 text-white/20"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/45">No comments yet</p>
            <p className="text-xs text-white/25">
              {user
                ? "Be the first to share your thoughts!"
                : "Sign in to leave a comment."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isOwn={comment.author.id === currentUserId}
              isDeleting={deletingIds.has(comment.id)}
              deleteError={deleteErrors[comment.id] ?? null}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
