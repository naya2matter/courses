// ─── EvaluationNotificationsPage ─────────────────────────────────────────────
// Admin page: compose evaluation notification emails and view send history.

import {
  AlertCircleIcon,
  BellIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useEvaluationNotificationHistory } from "./hook/use-evaluation-notification-history"

import { EvaluationNotificationSummaryCards } from "./components/evaluation-notification-summary-cards"
import { EvaluationNotificationFiltersToolbar } from "./components/evaluation-notification-filters-toolbar"
import { EvaluationNotificationHistoryTable } from "./components/evaluation-notification-history-table"

// ── Component ─────────────────────────────────────────────────────────────────

export default function EvaluationNotificationsPage() {
  const {
    allItems,
    filteredItems,
    meta,
    isLoading,
    error,
    filters,
    setFilters,
    setPage,
    refetch,
    clearError,
  } = useEvaluationNotificationHistory()

  const hasActiveFilters =
    !!filters.search.trim() || (!!filters.status && filters.status !== "all")

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <BellIcon className="size-5 text-white/70" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Evaluation Notifications
            </h1>
            <p className="text-sm text-white/50">
              Send evaluation report emails to managers and view delivery history.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={refetch}
            disabled={isLoading}
            aria-label="Refresh notification history"
          >
            {isLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error alert ───────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 text-xs"
                onClick={refetch}
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 text-xs"
                onClick={clearError}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <EvaluationNotificationSummaryCards items={allItems} isLoading={isLoading} />

      {/* ── Filters toolbar ───────────────────────────────────────────────── */}
      <EvaluationNotificationFiltersToolbar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredItems.length}
      />

      {/* ── History table ─────────────────────────────────────────────────── */}
      <EvaluationNotificationHistoryTable
        items={filteredItems}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {meta && meta.last_page > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {meta.from != null && meta.to != null ? (
              <>
                Showing {meta.from.toLocaleString()}–{meta.to.toLocaleString()} of{" "}
                {meta.total.toLocaleString()} results
              </>
            ) : (
              <>
                Page {meta.current_page} of {meta.last_page} (
                {meta.total.toLocaleString()} total)
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <Select
              value={String(filters.per_page)}
              onValueChange={(v) =>
                setFilters({ ...filters, per_page: Number(v), page: 1 })
              }
            >
              <SelectTrigger className="w-20 text-xs">
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
              disabled={meta.current_page <= 1 || isLoading}
              onClick={() => setPage(meta.current_page - 1)}
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
              disabled={meta.current_page >= meta.last_page || isLoading}
              onClick={() => setPage(meta.current_page + 1)}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
