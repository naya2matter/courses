import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import { UserEvaluationFiltersToolbar } from "./components/user-evaluation-filters-toolbar"
import { UserEvaluationSummaryCards } from "./components/user-evaluation-summary-cards"
import { UserEvaluationTable } from "./components/user-evaluation-table"
import { getMyEvaluations } from "./service/user-evaluations.service"
import type {
  PaginationMeta,
  UserEvaluation,
  UserEvaluationFilters,
} from "./types/user-evaluation.types"

const DEFAULT_FILTERS: UserEvaluationFilters = {
  search: "",
  course_type: "all",
  performance_level: "all",
  start_date: "",
  end_date: "",
  page: 1,
  per_page: 10,
}

function normalizeMeta(meta: Partial<PaginationMeta> | undefined, fallbackTotal: number, fallbackPerPage: number): PaginationMeta {
  const perPage = Number(meta?.per_page ?? fallbackPerPage) || fallbackPerPage
  const total = Number(meta?.total ?? fallbackTotal) || fallbackTotal
  const currentPage = Number(meta?.current_page ?? 1) || 1
  const lastPage = Number(meta?.last_page ?? Math.max(1, Math.ceil(total / Math.max(1, perPage)))) || 1

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

function inDateRange(iso: string, startDate: string, endDate: string): boolean {
  const timestamp = new Date(iso).getTime()
  if (!Number.isFinite(timestamp)) return false

  if (startDate) {
    const start = new Date(startDate).getTime()
    if (Number.isFinite(start) && timestamp < start) return false
  }

  if (endDate) {
    const end = new Date(endDate).getTime()
    if (Number.isFinite(end) && timestamp > end + 24 * 60 * 60 * 1000 - 1) return false
  }

  return true
}

export function UserEvaluationsPage() {
  const [items, setItems] = useState<UserEvaluation[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(normalizeMeta(undefined, 0, DEFAULT_FILTERS.per_page))
  const [filters, setFilters] = useState<UserEvaluationFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [detailId, setDetailId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.course_type !== "all" ||
    filters.performance_level !== "all" ||
    !!filters.start_date ||
    !!filters.end_date

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

  const filteredItems = useMemo(() => {
    const needle = filters.search.trim().toLowerCase()

    return items.filter((item) => {
      const courseName = item.course?.name?.toLowerCase() ?? ""

      if (needle && !courseName.includes(needle)) return false
      if (filters.course_type !== "all" && item.course_type !== filters.course_type) {
        return false
      }

      const level = String(item.performance_level?.level ?? "")
      if (filters.performance_level !== "all" && level !== filters.performance_level) {
        return false
      }

      if ((filters.start_date || filters.end_date) && !inDateRange(item.created_at, filters.start_date, filters.end_date)) {
        return false
      }

      return true
    })
  }, [items, filters])

  const levelOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => {
      if (item.performance_level?.level != null) {
        set.add(String(item.performance_level.level))
      }
    })

    return [...set].sort((a, b) => Number(a) - Number(b))
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

      <UserEvaluationSummaryCards items={items} isLoading={isLoading} />

      <UserEvaluationFiltersToolbar
        filters={filters}
        onFiltersChange={setFilters}
        levelOptions={levelOptions}
        resultCount={filteredItems.length}
        totalCount={items.length}
      />

      <UserEvaluationTable
        items={filteredItems}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onViewDetails={openDetails}
      />

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {meta.total > 0
            ? `Showing ${(meta.from ?? 0).toLocaleString()}-${(meta.to ?? 0).toLocaleString()} of ${meta.total.toLocaleString()} evaluations`
            : "No evaluations available"}
        </p>

        <div className="flex items-center gap-2">
          <Select
            value={String(filters.per_page)}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, per_page: Number(value), page: 1 }))
            }
          >
            <SelectTrigger className="w-24 text-xs" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={isLoading || meta.current_page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>

          <span className="min-w-16 text-center text-xs tabular-nums text-muted-foreground">
            {meta.current_page} / {meta.last_page}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={isLoading || meta.current_page >= meta.last_page}
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <UserEvaluationDetailSheet
        evaluationId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
