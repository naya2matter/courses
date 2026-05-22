// ─── PriorityBadge ────────────────────────────────────────────────────────────

import type { BugReportPriority } from "../../types/bug-report.types"

const PRIORITY_CLASSES: Record<BugReportPriority, string> = {
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
}

const PRIORITY_LABELS: Record<BugReportPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export function PriorityBadge({ priority }: { priority: BugReportPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
