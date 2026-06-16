// ─── Session Fact Table ───────────────────────────────────────────────────────

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { ReportTableShell } from "./report-table-shell"
import type { SessionFactRow, PaginationMeta } from "../types/online-report.types"

const COLS = [
  { header: "Date" },
  { header: "User" },
  { header: "Course" },
  { header: "Playback",    align: "right" as const },
  { header: "Completion",  align: "right" as const },
  { header: "Attention",   align: "right" as const },
  { header: "Done",        align: "right" as const },
  { header: "Suspicious",  align: "right" as const },
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

function attentionColor(score: number) {
  return score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400"
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
      <TableCell className="text-white/60 text-sm">{fmtDate(r.session_date)}</TableCell>
      <TableCell>
        <div className="font-medium text-white">{r.user_name}</div>
        {r.department_name && <div className="text-xs text-white/40">{r.department_name}</div>}
      </TableCell>
      <TableCell className="text-white/70">{r.course_name}</TableCell>
      <TableCell className="text-right text-white/60 text-sm tabular-nums">{fmtSec(r.active_playback_time)}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(r.completion_percentage, 100)}%` }} />
          </div>
          <span className="text-[11px] tabular-nums text-white/50">{Number(r.completion_percentage).toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className={`font-semibold tabular-nums ${attentionColor(r.attention_score)}`}>
          {r.attention_score}
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
