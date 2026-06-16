// ─── Department-Course Daily Table ───────────────────────────────────────────

import { TableCell, TableRow } from "@/components/ui/table"
import { ReportTableShell } from "./report-table-shell"
import type { DeptCourseDailyRow, PaginationMeta } from "../types/online-report.types"

const COLS = [
  { header: "Date" },
  { header: "Department" },
  { header: "Course" },
  { header: "Enrolled",    align: "right" as const },
  { header: "Active",      align: "right" as const },
  { header: "Completed",   align: "right" as const },
  { header: "Avg Progress", align: "right" as const },
  { header: "Active Time", align: "right" as const },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function fmtSec(s: number) {
  if (!s) return "—"
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

interface Props {
  data: DeptCourseDailyRow[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  page: number
  onPageChange: (p: number) => void
  onRetry: () => void
}

export function DeptCourseDailyTable({ data, meta, isLoading, error, page, onPageChange, onRetry }: Props) {
  const rows = data.map((r, i) => (
    <TableRow key={r.id ?? i} className="border-white/5 hover:bg-white/3">
      <TableCell className="text-white/60 text-sm">{fmtDate(r.report_date)}</TableCell>
      <TableCell className="font-medium text-white">{r.department_name}</TableCell>
      <TableCell className="text-white/70">{r.course_name}</TableCell>
      <TableCell className="text-right text-white/70 tabular-nums">{r.enrolled_users}</TableCell>
      <TableCell className="text-right text-indigo-300 tabular-nums font-medium">{r.active_users}</TableCell>
      <TableCell className="text-right text-emerald-400 tabular-nums font-medium">{r.completed_users}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(r.avg_progress_percentage, 100)}%` }} />
          </div>
          <span className="text-[11px] tabular-nums text-white/50">{Number(r.avg_progress_percentage).toFixed(1)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-right text-white/60 text-sm tabular-nums">{fmtSec(r.total_active_seconds)}</TableCell>
    </TableRow>
  ))

  return <ReportTableShell cols={COLS} rows={rows} isLoading={isLoading} error={error} meta={meta} page={page} onPageChange={onPageChange} onRetry={onRetry} />
}
