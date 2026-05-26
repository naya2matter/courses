// ─── UserFeedbackMobileCard ───────────────────────────────────────────────────
// Single card for the mobile layout in the user feedback list.

import { MessageSquareTextIcon } from "lucide-react"
import { UserFeedbackStatusBadge } from "./shared/user-feedback-status-badge"
import { UserFeedbackTypeBadge } from "./shared/user-feedback-type-badge"
import type { UserFeedback } from "../types/user-feedback.types"

interface UserFeedbackMobileCardProps {
  feedback: UserFeedback
  onView: () => void
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className="text-xs text-foreground truncate">{value}</span>
    </div>
  )
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function UserFeedbackMobileCard({ feedback, onView }: UserFeedbackMobileCardProps) {
  const hasResponse = !!feedback.admin_response

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full text-left rounded-xl border border-white/10 bg-white/2 p-4 space-y-3 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-1">{feedback.title}</p>
          {feedback.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {feedback.description}
            </p>
          )}
        </div>
        {hasResponse && (
          <MessageSquareTextIcon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
      </div>

      {/* ── Badges ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        <UserFeedbackTypeBadge type={feedback.type} />
        <UserFeedbackStatusBadge status={feedback.status} />
      </div>

      {/* ── Meta ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetaItem label="Submitted" value={formatShortDate(feedback.created_at)} />
        <MetaItem label="Admin Response" value={hasResponse ? "Received" : "Awaiting"} />
      </div>
    </button>
  )
}
