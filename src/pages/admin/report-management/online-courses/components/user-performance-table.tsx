// ─── User Performance Table ───────────────────────────────────────────────────

import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { isApiError } from "@/lib/api"
import { ReportTableShell } from "./report-table-shell"
import { ReportDetailSheet, DetailField, ReportDetailHeader, ReportDetailSection, ReportMetricChips } from "./report-detail-sheet"
import { getUserPerformanceById } from "../service/online-report.service"
import type { UserPerformanceRow, PaginationMeta, PerformanceRating, RiskLevel } from "../types/online-report.types"

const COLS = [
  { header: "User" },
  { header: "Department" },
  { header: "Courses" },
  { header: "Completion",  align: "right" as const },
  { header: "Progress",    align: "right" as const },
  { header: "Learning",    align: "right" as const },
  { header: "Attention",   align: "right" as const },
  { header: "Quiz",        align: "right" as const },
  { header: "Perf. Score", align: "right" as const },
  { header: "Rating",      align: "right" as const },
  { header: "Risk",        align: "right" as const },
]

const RATING_CFG: Record<PerformanceRating, string> = {
  excellent:        "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  good:             "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  average:          "bg-amber-500/15 text-amber-400 border-amber-500/25",
  needs_improvement:"bg-rose-500/15 text-rose-400 border-rose-500/25",
}

const RISK_CFG: Record<RiskLevel, string> = {
  low:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  high:   "bg-rose-500/15 text-rose-400 border-rose-500/25",
}

function attentionColor(score: number) {
  return score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400"
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
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<UserPerformanceRow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  async function openDetail(userId: number) {
    setOpen(true)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const rec = await getUserPerformanceById(userId)
      setDetail(rec)
    } catch (err) {
      let msg = "Failed to load user performance."
      if (isApiError(err)) msg = err.status === 404 ? "Record not found." : (err.message ?? msg)
      else if (err instanceof Error) msg = err.message
      setDetailError(msg)
      if (!isApiError(err) || err.status !== 404) toast.error(msg)
    } finally {
      setDetailLoading(false)
    }
  }

  const rows = data.map((r, i) => (
    <TableRow
      key={r.user_id ?? i}
      className="cursor-pointer border-white/5 hover:bg-white/3"
      onClick={() => openDetail(r.user_id)}
    >
      <TableCell>
        <div className="font-medium text-white">{r.user_name}</div>
        {r.user_email && <div className="text-xs text-white/40">{r.user_email}</div>}
      </TableCell>
      <TableCell className="text-white/70">{r.department_name ?? "—"}</TableCell>
      <TableCell>
        <div className="text-white/70 tabular-nums">{r.completed_courses}/{r.total_assignments}</div>
        {r.in_progress_courses > 0 && (
          <div className="text-xs text-indigo-400">{r.in_progress_courses} in progress</div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${r.completion_rate}%` }} />
          </div>
          <span className="text-xs tabular-nums text-white/50">{Number(r.completion_rate).toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, Number(r.progress ?? 0))}%` }} />
          </div>
          <span className="text-xs tabular-nums text-white/50">{Number(r.progress ?? 0).toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-right text-white/60 text-sm tabular-nums">
        {r.learning_time || "—"}
      </TableCell>
      <TableCell className="text-right">
        <span className={`font-semibold tabular-nums ${attentionColor(r.avg_attention)}`}>
          {Number(r.avg_attention).toFixed(1)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        {r.quiz_attempts_count > 0 ? (
          <div>
            <span className="text-white/70 tabular-nums">{r.quiz_passed_count}/{r.quiz_attempts_count}</span>
            <div className="text-xs text-white/40 tabular-nums">{Number(r.avg_quiz_pct).toFixed(0)}% avg</div>
          </div>
        ) : (
          <span className="text-xs text-white/25">—</span>
        )}
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums text-white">
        {Number(r.performance_score).toFixed(1)}
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className={`rounded-full text-xs capitalize ${RATING_CFG[r.performance_rating] ?? ""}`}>
          {r.performance_rating.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className={`rounded-full text-xs capitalize ${RISK_CFG[r.risk_level] ?? ""}`}>
          {r.risk_level}
        </Badge>
      </TableCell>
    </TableRow>
  ))

  return (
    <>
      <ReportTableShell cols={COLS} rows={rows} isLoading={isLoading} error={error} meta={meta} page={page} onPageChange={onPageChange} onRetry={onRetry} />

      <ReportDetailSheet
        open={open}
        onOpenChange={setOpen}
        title={detail ? detail.user_name : "User Performance"}
        description={detail?.user_email ?? undefined}
        isLoading={detailLoading}
        error={detailError}
      >
        {detail && (
          <>
            <ReportDetailHeader
              initial={detail.user_name}
              name={detail.user_name}
              subtitle={[detail.user_email, detail.department_name].filter(Boolean).join(" · ")}
              color="indigo"
            />
            <ReportMetricChips chips={[
              {
                label: "Completion",
                value: `${Number(detail.completion_rate).toFixed(0)}%`,
                color: Number(detail.completion_rate) >= 70 ? "emerald" : Number(detail.completion_rate) >= 40 ? "amber" : "rose",
              },
              {
                label: "Attention",
                value: Number(detail.avg_attention).toFixed(1),
                color: Number(detail.avg_attention) >= 70 ? "emerald" : Number(detail.avg_attention) >= 50 ? "amber" : "rose",
              },
              {
                label: "Progress",
                value: `${Number(detail.progress ?? 0).toFixed(0)}%`,
                color: "sky",
              },
              {
                label: "Score",
                value: Number(detail.performance_score).toFixed(1),
                color: "indigo",
              },
            ]} />

            <ReportDetailSection label="Activity">
              <DetailField label="Assignments" value={detail.total_assignments} />
              <DetailField label="Completed" value={detail.completed_courses} />
              <DetailField label="In progress" value={detail.in_progress_courses} />
              <DetailField label="Sessions" value={detail.sessions_count} />
              <DetailField label="Learning time" value={detail.learning_time || "—"} />
              <DetailField label="Suspicious" value={detail.suspicious_sessions} />
            </ReportDetailSection>

            <ReportDetailSection label="Quiz Performance">
              <DetailField label="Attempts" value={detail.quiz_attempts_count} />
              <DetailField label="Passed" value={detail.quiz_passed_count} />
              <DetailField label="Avg quiz" value={`${Number(detail.avg_quiz_pct).toFixed(0)}%`} />
            </ReportDetailSection>

            <ReportDetailSection label="Assessment">
              <DetailField label="Rating" value={<span className="capitalize">{detail.performance_rating.replace("_", " ")}</span>} />
              <DetailField label="Risk level" value={<span className="capitalize">{detail.risk_level}</span>} />
            </ReportDetailSection>
          </>
        )}
      </ReportDetailSheet>
    </>
  )
}
