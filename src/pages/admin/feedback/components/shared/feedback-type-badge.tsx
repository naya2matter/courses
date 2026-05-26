// ─── FeedbackTypeBadge ────────────────────────────────────────────────────────

import type { FeedbackType } from "../../types/feedback.types"

const TYPE_CLASSES: Record<FeedbackType, string> = {
  suggestion:      "bg-violet-500/15 text-violet-400 border-violet-500/30",
  improvement:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
  feature_request: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  general:         "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

const TYPE_LABELS: Record<FeedbackType, string> = {
  suggestion:      "Suggestion",
  improvement:     "Improvement",
  feature_request: "Feature Request",
  general:         "General",
}

export function FeedbackTypeBadge({ type }: { type: FeedbackType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_CLASSES[type]}`}
    >
      {TYPE_LABELS[type]}
    </span>
  )
}
