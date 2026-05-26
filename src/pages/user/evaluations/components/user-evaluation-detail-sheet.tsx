import { useEffect, useMemo, useState } from "react"
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { getMyEvaluationById } from "../service/user-evaluations.service"
import type { UserEvaluationDetail } from "../types/user-evaluation.types"
import { UserEvaluationScoreBreakdown } from "./user-evaluation-score-breakdown"
import { UserPerformanceLevelBadge } from "./user-performance-level-badge"

function formatDateTime(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getLevelExplanation(level?: number): string {
  if (level === 1) return "Outstanding performance with consistently high scoring results."
  if (level === 2) return "Reliable performance with strong score consistency."
  if (level === 3) return "Developing performance with room for targeted improvements."
  if (level === 4) return "Underperforming result that may need coaching support."
  return "Performance level explanation is not available for this evaluation."
}

function OverviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 wrap-break-word text-foreground">{children}</span>
    </div>
  )
}

interface UserEvaluationDetailSheetProps {
  evaluationId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserEvaluationDetailSheet({
  evaluationId,
  open,
  onOpenChange,
}: UserEvaluationDetailSheetProps) {
  const [detail, setDetail] = useState<UserEvaluationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadDetail(id: number) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getMyEvaluationById(id)
      setDetail(res.data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return

      if (isApiError(err)) {
        if (err.status === 403) {
          setError("You do not have permission to view this evaluation.")
        } else if (err.status === 401) {
          setError("Your session has expired. Please log in again.")
        } else if (err.status === 422) {
          setError(err.message ?? "Invalid evaluation request.")
        } else {
          setError(err.message ?? "Failed to load evaluation details.")
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load evaluation details.")
      }
      setDetail(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!open || evaluationId == null) return
    loadDetail(evaluationId)
  }, [open, evaluationId])

  const explanation = useMemo(
    () => getLevelExplanation(detail?.performance_level?.level),
    [detail?.performance_level?.level],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-170 lg:max-w-190">
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-white/10 px-6 pt-6 pb-4">
            <SheetTitle className="pr-6 text-lg leading-snug">Evaluation Details</SheetTitle>
            <SheetDescription>
              Review your scoring details and history breakdown.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-44 w-full rounded-xl" />
              </div>
            )}

            {!isLoading && error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>{error}</span>
                  {evaluationId != null && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => loadDetail(evaluationId)}
                    >
                      <RefreshCwIcon className="mr-1.5 size-3.5" />
                      Retry
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && detail && (
              <>
                <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Overview
                  </p>
                  <div className="space-y-2.5">
                    <OverviewRow label="Course">
                      {detail.course?.name ?? `Course #${detail.course?.id ?? "-"}`}
                    </OverviewRow>
                    <OverviewRow label="Type">
                      <Badge variant="outline" className="border-white/10 bg-white/8">
                        {detail.course_type === "online" ? "Online" : "Regular"}
                      </Badge>
                    </OverviewRow>
                    {detail.department && (
                      <OverviewRow label="Department">{detail.department.name}</OverviewRow>
                    )}
                    <OverviewRow label="Total Score">
                      <span className="font-semibold tabular-nums">{detail.total_score}</span>
                    </OverviewRow>
                    <OverviewRow label="Performance">
                      <UserPerformanceLevelBadge level={detail.performance_level} />
                    </OverviewRow>
                    <OverviewRow label="Created">{formatDateTime(detail.created_at)}</OverviewRow>
                    <OverviewRow label="Updated">{formatDateTime(detail.updated_at)}</OverviewRow>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Performance Level
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <UserPerformanceLevelBadge level={detail.performance_level} />
                      {detail.performance_level?.range && (
                        <Badge variant="outline" className="border-white/10 bg-white/8 text-muted-foreground">
                          Score Range: {detail.performance_level.range.min} - {detail.performance_level.range.max}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {explanation}
                    </p>
                  </div>
                </section>

                <Separator className="opacity-20" />

                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Score Breakdown
                  </p>
                  <UserEvaluationScoreBreakdown rows={detail.history} />
                </section>

                <Separator className="opacity-20" />

                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  These scores are read-only and were submitted by your administrator or evaluator.
                </p>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
