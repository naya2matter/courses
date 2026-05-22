// ─── Evaluation Configurations Page ──────────────────────────────────────────
// Admin CRUD page for evaluation scoring categories.
// Fetches configs once on mount, applies client-side filters, and wires up
// the create / edit / delete dialogs for both configs and their sub-types.

import { useMemo, useState } from "react"
import {
  AlertCircleIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { useEvaluationConfigs } from "./hook/use-evaluation-configs"
import { EvaluationConfigSummaryCards } from "./components/evaluation-config-summary-cards"
// import { EvaluationTypeSummaryCards } from "./components/evaluation-type-summary-cards"
import { EvaluationConfigToolbar } from "./components/evaluation-config-toolbar"
import { EvaluationConfigTable } from "./components/evaluation-config-table"
import { EvaluationConfigFormDialog } from "./components/evaluation-config-form-dialog"
import { DeleteEvaluationConfigDialog } from "./components/delete-evaluation-config-dialog"
import type {
  EvaluationConfig,
  EvaluationConfigFilters,
} from "./types/evaluation-config.types"

export default function EvaluationConfigurationsPage() {
  const { configs, isLoading, error, refetch, clearError } =
    useEvaluationConfigs()

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EvaluationConfig | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EvaluationConfig | null>(null)

  // ── Client-side filters ────────────────────────────────────────────────────
  const [filters, setFilters] = useState<EvaluationConfigFilters>({
    search: "",
    applies_to: "",
  })

  const filteredConfigs = useMemo(() => {
    let result = configs
    const term = filters.search.trim().toLowerCase()
    if (term) {
      result = result.filter((c) => {
        const configMatches = c.name.toLowerCase().includes(term)
        const typeMatches = (c.types ?? []).some((t) =>
          t.type_name.toLowerCase().includes(term),
        )
        return configMatches || typeMatches
      })
    }
    if (filters.applies_to) {
      result = result.filter((c) => c.applies_to === filters.applies_to)
    }
    return result
  }, [configs, filters])

  // ── Action handlers ────────────────────────────────────────────────────────

  function handleOpenCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function handleOpenEdit(config: EvaluationConfig) {
    setEditTarget(config)
    setFormOpen(true)
  }

  function handleOpenDelete(config: EvaluationConfig) {
    setDeleteTarget(config)
    setDeleteOpen(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Evaluation Configs
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage scoring categories used in regular and online evaluations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>

          <Button onClick={handleOpenCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Config
          </Button>
        </div>
      </div>

      {/* ── Config summary cards ───────────────────────────────────────────── */}
      <EvaluationConfigSummaryCards configs={configs} isLoading={isLoading} />

      {/* ── Type summary cards ────────────────────────────────────────────── */}
      {/* <EvaluationTypeSummaryCards configs={configs} isLoading={isLoading} /> */}

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load configs</AlertTitle>
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

      {/* ── Filters + card list ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <EvaluationConfigToolbar
          filters={filters}
          resultCount={filteredConfigs.length}
          onFiltersChange={setFilters}
        />

        <Separator className="opacity-30" />

        <EvaluationConfigTable
          configs={filteredConfigs}
          isLoading={isLoading}
          search={filters.search}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onTypeMutated={refetch}
        />
      </div>

      {/* ── Create / Edit config dialog ───────────────────────────────────── */}
      <EvaluationConfigFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={editTarget}
        onSuccess={refetch}
      />

      {/* ── Delete config confirmation dialog ─────────────────────────────── */}
      <DeleteEvaluationConfigDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        config={deleteTarget}
        onSuccess={refetch}
      />
    </div>
  )
}

