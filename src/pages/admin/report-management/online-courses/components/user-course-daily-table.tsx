// ─── User-Course Daily Table ──────────────────────────────────────────────────

import { TableCell, TableRow } from "@/components/ui/table"
import { ReportTableShell } from "./report-table-shell"
import type { UserCourseDailyRow, PaginationMeta } from "../types/online-report.types"

const COLS = [
  { header: "Date" },
  { header: "User" },
  { header: "Department" },
  { header: "Course" },
  { header: "Sessions",  align: "right" as const },
  { header: "Items Done", align: "right" as const },
  { header: "Playback",  align: "right" as const },
  { header: "Progress",  align: "right" as const },
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
      <TableCell className="text-white/60 text-sm">{fmtDate(r.report_date)}</TableCell>
      <TableCell className="font-medium text-white">{r.user_name}</TableCell>
      <TableCell className="text-white/70">{r.department_name ?? "—"}</TableCell>
      <TableCell className="text-white/70">{r.course_name}</TableCell>
      <TableCell className="text-right text-white/70 tabular-nums">{r.sessions_count}</TableCell>
      <TableCell className="text-right text-white/70 tabular-nums">{r.content_items_completed}</TableCell>
      <TableCell className="text-right text-white/60 text-sm tabular-nums">{fmtSec(r.active_playback_time)}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(r.course_progress_pct, 100)}%` }} />
          </div>
          <span className={`text-[11px] tabular-nums font-medium ${r.course_progress_pct >= 80 ? "text-emerald-400" : r.course_progress_pct >= 40 ? "text-indigo-400" : "text-white/50"}`}>
            {Number(r.course_progress_pct).toFixed(0)}%
          </span>
        </div>
      </TableCell>
    </TableRow>
  ))

  return <ReportTableShell cols={COLS} rows={rows} isLoading={isLoading} error={error} meta={meta} page={page} onPageChange={onPageChange} onRetry={onRetry} />
}
