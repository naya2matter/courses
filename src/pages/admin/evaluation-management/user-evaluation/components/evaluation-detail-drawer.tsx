// ─── EvaluationDetailDrawer ───────────────────────────────────────────────────
// Slide-in Sheet showing full evaluation details including scores and history.

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { PerformanceLevelBadge } from "./performance-level-badge"
import { getEvaluationById } from "../service/evaluation.service"
import type { Evaluation, EvaluationDetail } from "../types/evaluation.types"

interface Props {
  evaluation: Evaluation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(d?: string | null): string {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return d
  }
}

export function EvaluationDetailDrawer({ evaluation, open, onOpenChange }: Props) {
  const [detail, setDetail] = useState<EvaluationDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !evaluation) {
      setDetail(null)
      setError(null)
      return
    }
    setLoading(true)
    getEvaluationById(evaluation.id)
      .then(setDetail)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Failed to load evaluation details.")
      })
      .finally(() => setLoading(false))
  }, [open, evaluation])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full flex flex-col overflow-y-auto sm:max-w-lg border-l border-white/10 bg-[oklch(0.18_0.02_260)] text-white">
        <SheetHeader>
          <SheetTitle>Evaluation Details</SheetTitle>
          <SheetDescription>Review score history and performance details.</SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">

        {loading && (
          <div className="mt-2 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg bg-white/5" />
            ))}
          </div>
        )}

        {error && (
          <p className="mt-6 text-sm text-red-400">{error}</p>
        )}

        {detail && !loading && (
          <div className="mt-2 flex flex-col gap-5">
            {/* Identity */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {detail.user?.name ?? `User #${detail.user_id}`}
                  </p>
                  {detail.user?.email && (
                    <p className="text-xs text-white/40">{detail.user.email}</p>
                  )}
                </div>
                <Badge variant="outline" className="border-white/10 text-white/60 capitalize">
                  {detail.course_type}
                </Badge>
              </div>
              <p className="text-sm text-white/50">
                {detail.department?.name && <span>{detail.department.name}</span>}
                {detail.course?.name && <span> · {detail.course.name}</span>}
              </p>
            </div>

            {/* Score + Performance */}
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-xs text-white/40">Total Score</p>
                <p className="text-3xl font-bold text-white">{detail.total_score}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Performance</p>
                <PerformanceLevelBadge performance_level={detail.performance_level} />
              </div>
            </div>

            {/* Score breakdown */}
            {detail.scores && detail.scores.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/60">Score Breakdown</p>
                <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5">
                  {detail.scores.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2">
                      <div>
                        {s.config_name && (
                          <p className="text-xs text-white/40">{s.config_name}</p>
                        )}
                        <p className="text-sm text-white">{s.type_name ?? `Type #${s.evaluation_type_id}`}</p>
                      </div>
                      <p className="text-sm font-medium text-white">
                        {s.score_given}
                        {s.max_score !== undefined && (
                          <span className="text-white/40"> / {s.max_score}</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {detail.history && detail.history.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/60">History</p>
                <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5">
                  {detail.history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-2">
                      <div>
                        <p className="text-xs text-white/40">{h.config_name}</p>
                        <p className="text-sm text-white">{h.type_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{h.score_given}</p>
                        {h.created_at && (
                          <p className="text-xs text-white/30">{formatDate(h.created_at)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2 text-sm text-white/50">
              <div>
                <p className="text-xs text-white/30">Created</p>
                <p>{formatDate(detail.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Updated</p>
                <p>{formatDate(detail.updated_at)}</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
