// ─── UserFeedbackStatusBadge ──────────────────────────────────────────────────

import type { FeedbackStatus } from "../../types/user-feedback.types"

const STATUS_CLASSES: Record<FeedbackStatus, string> = {
  pending:      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  under_review: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  approved:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected:     "bg-red-500/15 text-red-400 border-red-500/30",
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending:      "Pending",
  under_review: "Under Review",
  approved:     "Approved",
  rejected:     "Rejected",
}

export function UserFeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
