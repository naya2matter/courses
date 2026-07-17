// ─── UserEvaluationPage ───────────────────────────────────────────────────────
// Admin CRUD page for user evaluations.

import { useState, useMemo, useCallback, useEffect } from "react"
import { RefreshCwIcon, PlusIcon, LayersIcon, AlertCircleIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { nextSort, PerPageSelect } from "@/components/ui/table-controls"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getEvaluationConfigs } from "@/pages/admin/evaluation-management/configurations/service/evaluation-config.service"
import type { EvaluationConfig } from "@/pages/admin/evaluation-management/configurations/types/evaluation-config.types"

import { useEvaluations } from "./hook/use-evaluations"
import { EvaluationSummaryCards } from "./components/evaluation-summary-cards"
import { EvaluationFiltersToolbar } from "./components/evaluation-filters-toolbar"
import { EvaluationTable } from "./components/evaluation-table"
import { EvaluationFormDialog } from "./components/evaluation-form-dialog"
import { EvaluationRescoreDialog } from "./components/evaluation-rescore-dialog"
import { EvaluationDetailDrawer } from "./components/evaluation-detail-drawer"
import { DeleteEvaluationDialog } from "./components/delete-evaluation-dialog"
import { BulkEvaluationDialog } from "./components/bulk-evaluation-dialog"
import { EvaluationNotificationComposeDialog } from "@/pages/admin/evaluation-management/notifications/components/evaluation-notification-compose-dialog"
import type { Evaluation, EvaluationFilters } from "./types/evaluation.types"
import type { EvaluationType } from "./components/score-rows-editor"

const DEFAULT_PER_PAGE = 20

const DEFAULT_FILTERS: EvaluationFilters = {
  search: "",
  course_type: "",
  department_id: "",
  user_id: "",
  performance_level: "",
  start_date: "",
  end_date: "",
  sort: undefined,
  direction: undefined,
  per_page: DEFAULT_PER_PAGE,
  page: 1,
}

export default function UserEvaluationPage() {
  const [filters, setFilters] = useState<EvaluationFilters>(DEFAULT_FILTERS)

  // All filters (including search, sort, pagination) are sent to the server.
  const serverFilters = useMemo(
    () => ({
      search: filters.search,
      course_type: filters.course_type,
      department_id: filters.department_id,
      user_id: filters.user_id,
      performance_level: filters.performance_level,
      sort: filters.sort,
      direction: filters.direction,
      start_date: filters.start_date,
      end_date: filters.end_date,
      per_page: filters.per_page,
      page: filters.page,
    }),
    [
      filters.search,
      filters.course_type,
      filters.department_id,
      filters.user_id,
      filters.performance_level,
      filters.sort,
      filters.direction,
      filters.start_date,
      filters.end_date,
      filters.per_page,
      filters.page,
    ],
  )

  const { evaluations, meta, isLoading, error, refetch, clearError } = useEvaluations(serverFilters)
  const currentPage = meta?.current_page ?? filters.page ?? 1
  const lastPage = meta?.last_page ?? 1

  // Load evaluation types from configs — used in score rows editor
  const [availableTypes, setAvailableTypes] = useState<EvaluationType[]>([])
  useEffect(() => {
    getEvaluationConfigs()
      .then((configs: EvaluationConfig[]) => {
        const types: EvaluationType[] = []
        for (const config of configs) {
          for (const t of config.types ?? []) {
            types.push({
              id: t.id,
              type_name: t.type_name,
              score_value: t.score_value,
              config_id: config.id,
              config_name: config.name,
            })
          }
        }
        setAvailableTypes(types)
      })
      .catch(() => {}) // Non-critical — silently ignore
  }, [])

  // Dialog / drawer state
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [rescoreTarget, setRescoreTarget] = useState<Evaluation | null>(null)
  const [detailTarget, setDetailTarget] = useState<Evaluation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null)

  // Merge the patch into current filters and reset to page 1 unless the caller
  // passes an explicit page (mirrors the Users store's setFilters behavior).
  function handleFilterChange(patch: Partial<EvaluationFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  function handleSort(column: string) {
    handleFilterChange({ ...nextSort(filters, column) })
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  const handleRefresh = useCallback(() => {
    clearError()
    refetch()
  }, [clearError, refetch])

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 pb-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">User Evaluations</h1>
          <p className="text-sm text-white/50">
            Manage user course evaluations, scores, performance levels, and evaluation history.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkOpen(true)}
            className="gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <LayersIcon className="h-4 w-4" />
            Bulk Create
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotifyOpen(true)}
            className="gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <BellIcon className="h-4 w-4" />
            Notify Managers
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New Evaluation
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Failed to load evaluations</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary cards */}
      <EvaluationSummaryCards evaluations={evaluations} isLoading={isLoading} />

      {/* Filters */}
      <EvaluationFiltersToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Table */}
      <EvaluationTable
        evaluations={evaluations}
        isLoading={isLoading}
        sort={filters.sort}
        direction={filters.direction}
        onSort={handleSort}
        onView={(ev) => setDetailTarget(ev)}
        onRescore={(ev) => setRescoreTarget(ev)}
        onDelete={(ev) => setDeleteTarget(ev)}
      />

      {/* Pagination */}
      {!isLoading && meta && (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <PerPageSelect
              value={filters.per_page ?? DEFAULT_PER_PAGE}
              onChange={(n) => handleFilterChange({ per_page: n })}
              options={[10, 20, 50, 100]}
            />
            <span>
              {meta.from != null && meta.to != null
                ? `Showing ${meta.from}–${meta.to} of ${meta.total}`
                : `${meta.total} evaluations`}
            </span>
          </div>
          {lastPage > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/10 bg-white/5"
                onClick={() => handleFilterChange({ page: currentPage - 1 })}
                disabled={currentPage <= 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <span className="tabular-nums">
                Page {currentPage} of {lastPage}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/10 bg-white/5"
                onClick={() => handleFilterChange({ page: currentPage + 1 })}
                disabled={currentPage >= lastPage}
              >
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs + Drawers */}
      <EvaluationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        availableTypes={availableTypes}
        onSuccess={refetch}
      />

      <EvaluationRescoreDialog
        evaluation={rescoreTarget}
        open={!!rescoreTarget}
        onOpenChange={(v) => { if (!v) setRescoreTarget(null) }}
        availableTypes={availableTypes}
        onSuccess={refetch}
      />

      <EvaluationDetailDrawer
        evaluation={detailTarget}
        open={!!detailTarget}
        onOpenChange={(v) => { if (!v) setDetailTarget(null) }}
      />

      <DeleteEvaluationDialog
        evaluation={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        onSuccess={refetch}
      />

      <BulkEvaluationDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        availableTypes={availableTypes}
        onSuccess={refetch}
      />

      <EvaluationNotificationComposeDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        onSent={() => {}}
      />
    </div>
  )
}
