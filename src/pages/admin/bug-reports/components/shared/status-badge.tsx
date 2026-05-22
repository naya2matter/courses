// ─── StatusBadge ─────────────────────────────────────────────────────────────

import type { BugReportStatus } from "../../types/bug-report.types"

const STATUS_CLASSES: Record<BugReportStatus, string> = {
  open: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

const STATUS_LABELS: Record<BugReportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
}

export function StatusBadge({ status }: { status: BugReportStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
