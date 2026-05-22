// ─── UserEvaluationPage ───────────────────────────────────────────────────────
// Admin CRUD page for user evaluations.

import { useState, useMemo, useCallback, useEffect } from "react"
import { RefreshCwIcon, PlusIcon, LayersIcon, AlertCircleIcon, BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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

const DEFAULT_FILTERS: EvaluationFilters = {
  search: "",
  course_type: "",
  department_id: "",
  user_id: "",
  performance_level: "",
  start_date: "",
  end_date: "",
}

export default function UserEvaluationPage() {
  const [filters, setFilters] = useState<EvaluationFilters>(DEFAULT_FILTERS)

  // Server-side filters (exclude search — handled client-side)
  const serverFilters = useMemo(
    () => ({
      course_type: filters.course_type,
      department_id: filters.department_id,
      user_id: filters.user_id,
      performance_level: filters.performance_level,
      start_date: filters.start_date,
      end_date: filters.end_date,
    }),
    [
      filters.course_type,
      filters.department_id,
      filters.user_id,
      filters.performance_level,
      filters.start_date,
      filters.end_date,
    ],
  )

  const { evaluations, isLoading, error, refetch, clearError } = useEvaluations(serverFilters)

  // Client-side search filter
  const displayedEvaluations = useMemo(() => {
    const term = filters.search.toLowerCase().trim()
    if (!term) return evaluations
    return evaluations.filter((ev) => {
      const userName = (ev.user?.name ?? "").toLowerCase()
      const courseName = (ev.course?.name ?? "").toLowerCase()
      return userName.includes(term) || courseName.includes(term)
    })
  }, [evaluations, filters.search])

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

  function handleFilterChange(patch: Partial<EvaluationFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
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
      <EvaluationSummaryCards evaluations={displayedEvaluations} />

      {/* Filters */}
      <EvaluationFiltersToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Table */}
      <EvaluationTable
        evaluations={displayedEvaluations}
        isLoading={isLoading}
        onView={(ev) => setDetailTarget(ev)}
        onRescore={(ev) => setRescoreTarget(ev)}
        onDelete={(ev) => setDeleteTarget(ev)}
      />

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
