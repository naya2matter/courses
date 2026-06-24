import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CircleGaugeIcon,
  ClipboardListIcon,
  EyeIcon,
  Layers3Icon,
  MedalIcon,
  SigmaIcon,
  TvMinimalPlayIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { isApiError } from "@/lib/api"
import { PageHeader } from "@/components/user/page-header"

import { UserEvaluationDetailSheet } from "./components/user-evaluation-detail-sheet"
import { UserPerformanceLevelBadge } from "./components/user-performance-level-badge"
import { getMyEvaluations } from "./service/user-evaluations.service"
import type {
  PaginationMeta,
  UserEvaluation,
  UserEvaluationFilters,
} from "./types/user-evaluation.types"

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: UserEvaluationFilters = {
  search: "",
  course_type: "all",
  performance_level: "all",
  start_date: "",
  end_date: "",
  page: 1,
  per_page: 12,
}

const CARD_DEFS = [
  { key: "total",   label: "Total Evaluations", Icon: Layers3Icon },
  { key: "avg",     label: "Average Score",      Icon: SigmaIcon },
  { key: "best",    label: "Best Score",          Icon: MedalIcon },
  { key: "latest",  label: "Latest Evaluation",   Icon: CalendarClockIcon },
  { key: "regular", label: "Regular Courses",     Icon: CircleGaugeIcon },
  { key: "online",  label: "Online Courses",      Icon: TvMinimalPlayIcon },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeMeta(
  meta: Partial<PaginationMeta> | undefined,
  fallbackTotal: number,
  fallbackPerPage: number,
): PaginationMeta {
  const perPage = Number(meta?.per_page ?? fallbackPerPage) || fallbackPerPage
  const total = Number(meta?.total ?? fallbackTotal) || fallbackTotal
  const currentPage = Number(meta?.current_page ?? 1) || 1
  const lastPage =
    Number(meta?.last_page ?? Math.max(1, Math.ceil(total / Math.max(1, perPage)))) || 1
  return {
    current_page: currentPage,
    last_page: Math.max(1, lastPage),
    per_page: Math.max(1, perPage),
    total: Math.max(0, total),
    from: meta?.from ?? (total > 0 ? (currentPage - 1) * perPage + 1 : 0),
    to: meta?.to ?? Math.min(total, currentPage * perPage),
    path: meta?.path,
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

// ── Evaluation card ────────────────────────────────────────────────────────────

function EvaluationCard({
  item,
  onViewDetails,
}: {
  item: UserEvaluation
  onViewDetails: (id: number) => void
}) {
  const courseName = item.course?.name ?? `Course #${item.course?.id ?? "—"}`
  const courseType = item.course_type === "online" ? "Online" : "Regular"
  const previewRows = item.history.slice(0, 3)
  const extraCount = item.history.length - previewRows.length

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-xl transition-colors hover:bg-white/6">
      {/* Course info + type badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold leading-snug text-foreground">{courseName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {courseType}
        </span>
      </div>

      {/* Score + performance level */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Total Score
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white">
            {item.total_score}
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Level
          </p>
          <div className="mt-1">
            <UserPerformanceLevelBadge level={item.performance_level} />
            {item.performance_level?.range && (
              <p className="mt-1.5 text-[10px] tabular-nums text-muted-foreground">
                {item.performance_level.range.min}–{item.performance_level.range.max} pts
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Score breakdown mini bars */}
      {previewRows.length > 0 && (
        <div className="space-y-2">
          {previewRows.map((row) => {
            const pct =
              row.max_score > 0
                ? Math.round((row.score_given / row.max_score) * 100)
                : 0
            return (
              <div key={row.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] text-muted-foreground">{row.config_name}</p>
                  <span className="shrink-0 text-[11px] tabular-nums text-foreground/60">
                    {row.score_given}/{row.max_score}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-indigo-500/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {extraCount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              +{extraCount} more component{extraCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-3">
        <p className="text-[11px] text-muted-foreground">
          {item.history.length} component{item.history.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs"
          onClick={() => onViewDetails(item.id)}
          aria-label={`View details for ${courseName}`}
        >
          <EyeIcon className="size-3.5" />
          View Details
        </Button>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <ClipboardListIcon className="size-7 text-indigo-400/60" />
      </div>
      <p className="mt-4 font-semibold text-foreground">
        {hasActiveFilters ? "No matching evaluations" : "No evaluations yet"}
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {hasActiveFilters
          ? "Try adjusting or clearing your filters to find what you're looking for."
          : "Your evaluation results will appear here once your administrator submits them."}
      </p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function UserEvaluationsPage() {
  const [items, setItems] = useState<UserEvaluation[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(
    normalizeMeta(undefined, 0, DEFAULT_FILTERS.per_page),
  )
  const [filters, setFilters] = useState<UserEvaluationFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [detailId, setDetailId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchList = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getMyEvaluations({
        page: filters.page,
        per_page: filters.per_page,
      })
      const rows = Array.isArray(response.data) ? response.data : []
      setItems(rows)
      setMeta(normalizeMeta(response.meta, rows.length, filters.per_page))
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        if (err.status === 401) {
          setError("Your session has expired. Please log in again.")
        } else if (err.status === 422) {
          setError(err.message ?? "Invalid filter values were provided.")
        } else {
          setError(err.message ?? "Failed to load your evaluations.")
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load your evaluations.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters.page, filters.per_page])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const cardValues = useMemo(() => {
    const total = items.length
    const avgScore =
      total > 0 ? items.reduce((sum, i) => sum + (i.total_score ?? 0), 0) / total : 0
    const bestScore = total > 0 ? Math.max(...items.map((i) => i.total_score ?? 0)) : 0
    const sorted = [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const latestDate = formatDate(sorted[0]?.created_at)
    const regularCount = items.filter((i) => i.course_type === "regular").length
    const onlineCount = items.filter((i) => i.course_type === "online").length
    return [
      total.toLocaleString(),
      avgScore.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      bestScore.toLocaleString(),
      latestDate,
      regularCount.toLocaleString(),
      onlineCount.toLocaleString(),
    ]
  }, [items])

  function openDetails(id: number) {
    setDetailId(id)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Evaluations"
        description="Review your course evaluation scores, performance levels, and score history."
        onRefresh={fetchList}
        refreshing={isLoading}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 shrink-0 text-xs"
              onClick={fetchList}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Summary cards — vertical centered ─────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          : CARD_DEFS.map(({ key, label, Icon }, idx) => (
              <div key={key} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/6 bg-white/5">
                  <Icon className="h-6 w-6 text-indigo-400" />
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
                  {cardValues[idx]}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
      </section>

      {/* ── Evaluation cards grid ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/4 p-5"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState hasActiveFilters={false} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <EvaluationCard key={item.id} item={item} onViewDetails={openDetails} />
          ))}
        </div>
      )}

      {/* ── Pagination — only shown when there is more than one page ─────────── */}
      {!isLoading && items.length > 0 && meta.last_page > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {meta.total > 0
              ? `Showing ${(meta.from ?? 0).toLocaleString()}–${(meta.to ?? 0).toLocaleString()} of ${meta.total.toLocaleString()} evaluation${meta.total !== 1 ? "s" : ""}`
              : "No evaluations available"}
          </p>

          <div className="flex items-center gap-2">
            <Select
              value={String(filters.per_page)}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, per_page: Number(value), page: 1 }))
              }
            >
              <SelectTrigger className="w-24 text-xs" aria-label="Items per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[12, 24, 48].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={isLoading || meta.current_page <= 1}
            >
              Prev
            </Button>

            <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground">
              {meta.current_page} / {meta.last_page}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={isLoading || meta.current_page >= meta.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <UserEvaluationDetailSheet
        evaluationId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
