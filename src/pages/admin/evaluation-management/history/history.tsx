// ─── Admin Evaluation History Page ───────────────────────────────────────────
// Read-only audit view of all employee evaluation records.
// Features: summary cards, analytics panel, filter toolbar, paginated table,
// detail drawer, and CSV export.  No create / update / delete actions.

import { useState } from "react"
import {
  AlertCircleIcon,
  Loader2Icon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { useEvaluationHistory } from "./hook/use-evaluation-history"
import { EvaluationHistorySummaryCards } from "./components/evaluation-history-summary-cards"
import { EvaluationHistoryFiltersToolbar } from "./components/evaluation-history-filters-toolbar"
import { EvaluationHistoryAnalyticsPanel } from "./components/evaluation-history-analytics-panel"
import { EvaluationHistoryTable } from "./components/evaluation-history-table"
import { EvaluationHistoryDetailDrawer } from "./components/evaluation-history-detail-drawer"
import { EvaluationHistoryPagination } from "./components/evaluation-history-pagination"
import { ExportCsvButtons } from "./components/export-csv-buttons"
import type { EvaluationHistoryEntry } from "./types/evaluation-history.types"

export default function EvaluationHistoryPage() {
  const {
    entries,
    meta,
    isLoading,
    error,
    analytics,
    analyticsLoading,
    analyticsError,
    filters,
    setFilters,
    setPage,
    refetch,
    refetchAnalytics,
    clearError,
  } = useEvaluationHistory()

  // ── Detail drawer ──────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null)

  function handleViewDetails(entry: EvaluationHistoryEntry) {
    setSelectedEntryId(entry.id)
    setDrawerOpen(true)
  }

  function handlePerPageChange(perPage: number) {
    setFilters({ ...filters, per_page: perPage, page: 1 })
  }

  function handleRefresh() {
    refetch()
    refetchAnalytics()
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Evaluation History
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review read-only evaluation audit snapshots, performance trends, and export reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButtons filters={filters} />

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <EvaluationHistorySummaryCards
        analytics={analytics}
        entries={entries}
        isLoading={analyticsLoading && isLoading}
      />

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load evaluation history</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={clearError}
                aria-label="Dismiss error"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Analytics section ─────────────────────────────────────────────── */}
      <EvaluationHistoryAnalyticsPanel
        analytics={analytics}
        isLoading={analyticsLoading}
        error={analyticsError}
      />

      <Separator className="opacity-30" />

      {/* ── Filters + list ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <EvaluationHistoryFiltersToolbar
          filters={filters}
          totalCount={meta?.total ?? null}
          onFiltersChange={setFilters}
        />

        <Separator className="opacity-20" />

        <EvaluationHistoryTable
          entries={entries}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
        />

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {meta && meta.last_page > 0 && (
          <EvaluationHistoryPagination
            meta={meta}
            onPageChange={setPage}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </div>

      {/* ── Detail drawer ─────────────────────────────────────────────────── */}
      <EvaluationHistoryDetailDrawer
        entryId={selectedEntryId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}
