// ─── Session Fact Table ───────────────────────────────────────────────────────

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { ReportTableShell } from "./report-table-shell"
import type { SessionFactRow, PaginationMeta } from "../types/online-report.types"

const COLS = [
  { header: "User" }, { header: "Course" }, { header: "Started" }, { header: "Ended" },
  { header: "Attention", align: "right" as const }, { header: "Completed", align: "right" as const },
  { header: "Suspicious", align: "right" as const },
]

function fmt(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface Props {
  data: SessionFactRow[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  page: number
  onPageChange: (p: number) => void
  onRetry: () => void
}

export function SessionFactTable({ data, meta, isLoading, error, page, onPageChange, onRetry }: Props) {
  const rows = data.map((r) => (
    <TableRow key={r.id} className="border-white/5 hover:bg-white/3">
      <TableCell>
        <div className="font-medium text-white">{r.user_name}</div>
        {r.department_name && <div className="text-xs text-white/40">{r.department_name}</div>}
      </TableCell>
      <TableCell className="text-white/70">{r.course_name}</TableCell>
      <TableCell className="text-white/60 text-sm">{fmt(r.started_at)}</TableCell>
      <TableCell className="text-white/60 text-sm">{fmt(r.ended_at)}</TableCell>
      <TableCell className="text-right">
        <span className={`font-semibold tabular-nums ${Number(r.attention_score) >= 70 ? "text-emerald-400" : Number(r.attention_score) >= 50 ? "text-amber-400" : "text-rose-400"}`}>
          {Number(r.attention_score).toFixed(1)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        {r.content_completed
          ? <Badge variant="outline" className="rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25">Yes</Badge>
          : <Badge variant="outline" className="rounded-full text-[10px] bg-white/5 text-white/40 border-white/10">No</Badge>}
      </TableCell>
      <TableCell className="text-right">
        {r.is_suspicious
          ? <Badge variant="outline" className="rounded-full text-[10px] bg-rose-500/15 text-rose-400 border-rose-500/25">Flagged</Badge>
          : <span className="text-xs text-white/30">—</span>}
      </TableCell>
    </TableRow>
  ))

  return <ReportTableShell cols={COLS} rows={rows} isLoading={isLoading} error={error} meta={meta} page={page} onPageChange={onPageChange} onRetry={onRetry} />
}
