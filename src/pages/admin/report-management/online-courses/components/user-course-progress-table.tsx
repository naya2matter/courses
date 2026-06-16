// ─── User-Course Progress Table ───────────────────────────────────────────────

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { ReportTableShell } from "./report-table-shell"
import type { UserCourseProgressRow, PaginationMeta, ComplianceStatus, ScoreBand } from "../types/online-report.types"

const COLS = [
  { header: "User" },
  { header: "Course" },
  { header: "Progress",  align: "right" as const },
  { header: "Items",     align: "right" as const },
  { header: "Status" },
  { header: "Deadline" },
  { header: "Compliance" },
  { header: "Last Access" },
]

const STATUS_CFG = {
  completed:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  in_progress: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  not_started: "bg-white/5 text-white/40 border-white/10",
} as const

const COMPLIANCE_CFG: Record<ComplianceStatus, string> = {
  compliant:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  on_track:      "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  at_risk:       "bg-amber-500/15 text-amber-400 border-amber-500/25",
  non_compliant: "bg-rose-500/15 text-rose-400 border-rose-500/25",
}

const SCORE_CFG: Record<ScoreBand, string> = {
  excellent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  good:      "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  average:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  poor:      "bg-rose-500/15 text-rose-400 border-rose-500/25",
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

interface Props {
  data: UserCourseProgressRow[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  page: number
  onPageChange: (p: number) => void
  onRetry: () => void
}

export function UserCourseProgressTable({ data, meta, isLoading, error, page, onPageChange, onRetry }: Props) {
  const rows = data.map((r, i) => (
    <TableRow key={r.id ?? `${r.user_id}-${r.course_online_id}-${i}`} className="border-white/5 hover:bg-white/3">
      <TableCell>
        <div className="font-medium text-white">{r.user_name}</div>
        {r.department_name && <div className="text-xs text-white/40">{r.department_name}</div>}
      </TableCell>
      <TableCell className="text-white/70">{r.course_name}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${r.status === "completed" ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${Math.min(r.progress_percentage, 100)}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-white/50">{Number(r.progress_percentage).toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-right text-white/60 tabular-nums text-sm">
        {r.completed_content_items}/{r.total_content_items}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={`w-fit rounded-full text-[10px] capitalize ${STATUS_CFG[r.status] ?? ""}`}>
            {r.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className={`w-fit rounded-full text-[10px] capitalize ${SCORE_CFG[r.score_band] ?? ""}`}>
            {r.score_band}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {r.course_deadline ? (
          <div>
            <div className="text-white/70">{fmtDate(r.course_deadline)}</div>
            {r.days_overdue > 0 && (
              <div className="text-[11px] font-semibold text-rose-400">{r.days_overdue}d overdue</div>
            )}
          </div>
        ) : (
          <span className="text-white/30">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`rounded-full text-[10px] capitalize ${COMPLIANCE_CFG[r.compliance_status] ?? ""}`}>
          {r.compliance_status.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell className="text-white/50 text-sm">{fmtDate(r.last_accessed_at)}</TableCell>
    </TableRow>
  ))

  return <ReportTableShell cols={COLS} rows={rows} isLoading={isLoading} error={error} meta={meta} page={page} onPageChange={onPageChange} onRetry={onRetry} />
}
