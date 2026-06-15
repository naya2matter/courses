// ─── User-Course Daily Table ──────────────────────────────────────────────────

import { TableCell, TableRow } from "@/components/ui/table"
import { ReportTableShell } from "./report-table-shell"
import type { UserCourseDailyRow, PaginationMeta } from "../types/online-report.types"

const COLS = [
  { header: "Date" }, { header: "User" }, { header: "Department" }, { header: "Course" },
  { header: "Sessions", align: "right" as const }, { header: "Completions", align: "right" as const },
  { header: "Watch Time", align: "right" as const }, { header: "Avg Attention", align: "right" as const },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

interface Props {
  data: UserCourseDailyRow[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  page: number
  onPageChange: (p: number) => void
  onRetry: () => void
}

export function UserCourseDailyTable({ data, meta, isLoading, error, page, onPageChange, onRetry }: Props) {
  const rows = data.map((r, i) => (
    <TableRow key={r.id ?? i} className="border-white/5 hover:bg-white/3">
      <TableCell className="text-white/60 text-sm">{fmtDate(r.date)}</TableCell>
      <TableCell className="font-medium text-white">{r.user_name}</TableCell>
      <TableCell className="text-white/70">{r.department_name ?? "—"}</TableCell>
      <TableCell className="text-white/70">{r.course_name}</TableCell>
      <TableCell className="text-right text-white/70">{r.sessions_count}</TableCell>
      <TableCell className="text-right text-white/70">{r.completions_count}</TableCell>
      <TableCell className="text-right text-white/60 text-sm">{r.total_watch_time_minutes} min</TableCell>
      <TableCell className="text-right">
        <span className={`font-semibold tabular-nums ${Number(r.avg_attention_score) >= 70 ? "text-emerald-400" : Number(r.avg_attention_score) >= 50 ? "text-amber-400" : "text-rose-400"}`}>
          {Number(r.avg_attention_score).toFixed(1)}
        </span>
      </TableCell>
    </TableRow>
  ))

  return <ReportTableShell cols={COLS} rows={rows} isLoading={isLoading} error={error} meta={meta} page={page} onPageChange={onPageChange} onRetry={onRetry} />
}
