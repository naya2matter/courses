// ─── User Performance Table ───────────────────────────────────────────────────

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { ReportTableShell } from "./report-table-shell"
import type { UserPerformanceRow, PaginationMeta, PerformanceRating, RiskLevel } from "../types/online-report.types"

const COLS = [
  { header: "User" }, { header: "Department" }, { header: "Courses" },
  { header: "Completion Rate", align: "right" as const }, { header: "Perf. Score", align: "right" as const },
  { header: "Rating", align: "right" as const }, { header: "Risk", align: "right" as const },
]

const RATING_CFG: Record<PerformanceRating, string> = {
  excellent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  good: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  needs_attention: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  poor: "bg-rose-500/15 text-rose-400 border-rose-500/25",
}

const RISK_CFG: Record<RiskLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  high: "bg-rose-500/15 text-rose-400 border-rose-500/25",
}

interface Props {
  data: UserPerformanceRow[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  page: number
  onPageChange: (p: number) => void
  onRetry: () => void
}

export function UserPerformanceTable({ data, meta, isLoading, error, page, onPageChange, onRetry }: Props) {
  const rows = data.map((r, i) => (
    <TableRow key={r.user_id ?? i} className="border-white/5 hover:bg-white/3">
      <TableCell>
        <div className="font-medium text-white">{r.user_name}</div>
        {r.user_email && <div className="text-xs text-white/40">{r.user_email}</div>}
      </TableCell>
      <TableCell className="text-white/70">{r.department_name ?? "—"}</TableCell>
      <TableCell className="text-white/70">{r.completed_courses}/{r.assigned_courses}</TableCell>
      <TableCell className="text-right">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10 ml-auto">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${r.completion_rate}%` }} />
        </div>
        <span className="text-xs text-white/50 tabular-nums">{Number(r.completion_rate).toFixed(0)}%</span>
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums text-white">{Number(r.performance_score).toFixed(1)}</TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className={`rounded-full text-[10px] capitalize ${RATING_CFG[r.performance_rating] ?? ""}`}>
          {r.performance_rating.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className={`rounded-full text-[10px] capitalize ${RISK_CFG[r.risk_level] ?? ""}`}>
          {r.risk_level}
        </Badge>
      </TableCell>
    </TableRow>
  ))

  return <ReportTableShell cols={COLS} rows={rows} isLoading={isLoading} error={error} meta={meta} page={page} onPageChange={onPageChange} onRetry={onRetry} />
}
