// ─── Department Evaluation Performance Panel ──────────────────────────────────
// Non-paginated nested structure: summary stats + dept cards.

import { AlertCircleIcon, RefreshCwIcon, TrophyIcon, AlertTriangleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeptEvalData } from "../types/online-report.types"

interface Props {
  data: DeptEvalData | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

export function DeptEvalPanel({ data, isLoading, error, onRetry }: Props) {
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
        <AlertCircleIcon className="size-4" />
        <AlertTitle>Failed to load evaluation performance</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10">
            <RefreshCwIcon className="mr-1.5 size-3.5" />Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/40">
        No evaluation data available.
      </div>
    )
  }

  const { summary, departments } = data

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Departments", value: summary.departments },
          { label: "Users Evaluated", value: summary.users_evaluated },
          { label: "Overall Avg Score", value: `${Number(summary.overall_avg_score).toFixed(1)}%` },
          { label: "Highest Dept Avg", value: `${Number(summary.highest_dept_avg).toFixed(1)}%` },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-white/8 bg-card p-4">
            <p className="text-xl font-extrabold tabular-nums text-indigo-300">{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Dept cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {departments.map((dept) => (
          <div key={dept.department_id} className="rounded-2xl border border-white/8 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{dept.department_name}</h3>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>{dept.users_evaluated} users</span>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-semibold text-indigo-300">
                  {Number(dept.avg_score).toFixed(1)}% avg
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Top performers */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  <TrophyIcon className="size-3" />Top
                </div>
                <div className="space-y-1.5">
                  {dept.top_performers.slice(0, 3).map((p) => (
                    <div key={p.user_id} className="flex items-center justify-between rounded-lg bg-emerald-500/5 px-2.5 py-1.5">
                      <div>
                        <p className="text-xs font-medium text-white">{p.user_name}</p>
                        <p className="text-[10px] text-white/35">{p.eval_count} evals</p>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-emerald-400">{Number(p.avg_score).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs support */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  <AlertTriangleIcon className="size-3" />Support
                </div>
                <div className="space-y-1.5">
                  {dept.needs_support.slice(0, 3).map((p) => (
                    <div key={p.user_id} className="flex items-center justify-between rounded-lg bg-amber-500/5 px-2.5 py-1.5">
                      <div>
                        <p className="text-xs font-medium text-white">{p.user_name}</p>
                        <p className="text-[10px] text-white/35">{p.eval_count} evals</p>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-amber-400">{Number(p.avg_score).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
