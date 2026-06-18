// ─── EvaluationDetailDrawer ───────────────────────────────────────────────────
// Slide-in Sheet showing full evaluation details with improved UI.

import { useEffect, useState } from "react"
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
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

function ScoreBar({ score, max }: { score: number; max?: number }) {
  if (!max || max <= 0) return null
  const pct = Math.min(100, Math.round((score / max) * 100))
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
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
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-white/10 bg-[oklch(0.18_0.02_260)] text-white sm:max-w-lg p-0"
      >
        <SheetHeader className="border-b border-white/8 px-6 py-5">
          <SheetTitle className="text-white">Evaluation Details</SheetTitle>
          <SheetDescription className="text-white/40">
            Score history and performance breakdown.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-6 pb-8 pt-5 space-y-5">
            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
                <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg bg-white/5" />
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {detail && !loading && (
              <>
                {/* ── User card ────────────────────────────────────────────── */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 ring-1 ring-indigo-500/30">
                      <UserIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-white">
                          {detail.user?.name ?? `User #${detail.user_id}`}
                        </p>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-white/10 capitalize text-white/60 text-xs"
                        >
                          {detail.course_type}
                        </Badge>
                      </div>
                      {detail.user?.email && (
                        <p className="mt-0.5 truncate text-xs text-white/40">{detail.user.email}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-white/50">
                        {detail.department?.name && <span>{detail.department.name}</span>}
                        {detail.course?.name && <span>· {detail.course.name}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Score hero ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-xs text-white/40 mb-1">Total Score</p>
                    <p className="text-4xl font-extrabold tabular-nums text-white">
                      {detail.total_score ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40 mb-2">Performance</p>
                    <PerformanceLevelBadge performance_level={detail.performance_level} />
                  </div>
                </div>

                {/* ── Score breakdown ──────────────────────────────────────── */}
                {detail.scores && detail.scores.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                      Score Breakdown
                    </p>
                    <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      {detail.scores.map((s, i) => (
                        <div key={i} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              {s.config_name && (
                                <p className="text-[10px] uppercase tracking-wider text-white/30">
                                  {s.config_name}
                                </p>
                              )}
                              <p className="truncate text-sm text-white">
                                {s.type_name ?? `Type #${s.evaluation_type_id}`}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold tabular-nums text-white">
                              {s.score_given}
                              {s.max_score !== undefined && (
                                <span className="text-white/40 font-normal"> / {s.max_score}</span>
                              )}
                            </p>
                          </div>
                          {s.max_score !== undefined && (
                            <ScoreBar score={s.score_given} max={s.max_score} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── History timeline ─────────────────────────────────────── */}
                {detail.history && detail.history.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                      Score History
                    </p>
                    <div className="relative pl-5">
                      {/* vertical line */}
                      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/10" />
                      <div className="space-y-3">
                        {detail.history.map((h) => (
                          <div key={h.id} className="relative">
                            {/* dot */}
                            <div className="absolute -left-3.5 top-2 h-2.5 w-2.5 rounded-full border border-white/20 bg-indigo-500/60" />
                            <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  {h.config_name && (
                                    <p className="text-[10px] uppercase tracking-wider text-white/30">
                                      {h.config_name}
                                    </p>
                                  )}
                                  <p className="truncate text-sm text-white">{h.type_name}</p>
                                </div>
                                <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
                                  {h.score_given}
                                </span>
                              </div>
                              {h.created_at && (
                                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-white/30">
                                  <ClockIcon className="h-3 w-3" />
                                  {formatDate(h.created_at)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="bg-white/10" />

                {/* ── Meta dates ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Created", value: detail.created_at },
                    { label: "Updated", value: detail.updated_at },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/30 mb-1">
                        <CalendarIcon className="h-3 w-3" />
                        {label}
                      </div>
                      <p className="text-xs text-white/60">{formatDate(value)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
