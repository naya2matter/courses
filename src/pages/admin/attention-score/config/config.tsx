// ─── Attention Score Settings Page ─────────────────────────────────────────────
// Lets the client edit every weight/band/threshold in the Attention Score
// formula, preview the effect against known worked examples, save (which
// triggers a background recalculation of all historical sessions), and
// browse/restore past versions.
//
// Two tabs: Edit (the form + preview + save bar) and History (the audit trail).

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  HistoryIcon,
  Loader2Icon,
  PencilRulerIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SaveIcon,
  TagIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { ConfigEditorForm } from "./components/config-editor-form"
import { HistoryPanel } from "./components/history-panel"
import { PreviewPanel } from "./components/preview-panel"
import { RecalculationProgress } from "./components/recalculation-progress"
import { SaveConfirmDialog } from "./components/save-confirm-dialog"
import { useAttentionScoreConfig } from "./hook/use-attention-score-config"

export default function AttentionScoreConfigPage() {
  const {
    activeConfig,
    draftConfig,
    draftName,
    history,
    previewResults,
    recalculationJob,

    isLoading,
    isLoadingHistory,
    isPreviewing,
    isSaving,
    restoringId,
    isBusy,

    loadError,
    historyError,
    previewError,
    saveError,
    fieldErrors,

    validation,
    isDirty,

    fetchActiveConfig,
    fetchHistory,
    setDraftConfig,
    setDraftName,
    resetDraftToActive,
    preview,
    save,
    restore,
    dismissJob,
  } = useAttentionScoreConfig()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tab, setTab] = useState("edit")

  const nameError = draftName.trim() === "" ? "Give this version a name so it can be identified in history." : undefined
  const errorCount = validation?.errors.length ?? 0
  const warningCount = validation?.warnings.length ?? 0
  const canSave = Boolean(draftConfig) && isDirty && errorCount === 0 && !nameError && !isBusy

  // Warn before a hard navigation away with unsaved edits.
  useEffect(() => {
    if (!isDirty) return
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // Up to five errors, deduplicated by message, for the pre-save summary.
  const errorSummary = useMemo(() => {
    if (!validation) return []
    const seen = new Set<string>()
    return validation.errors
      .filter((issue) => {
        if (seen.has(issue.message)) return false
        seen.add(issue.message)
        return true
      })
      .slice(0, 5)
  }, [validation])

  async function handleConfirmSave() {
    try {
      await save()
      setConfirmOpen(false)
      toast.success("Config saved", { description: "Recalculating historical sessions…" })
    } catch {
      // Surfaced inside the dialog via `saveError` — keep it open so the client
      // can read the failure and retry without losing their edits.
    }
  }

  async function handleRestore(id: number) {
    try {
      await restore(id)
      setTab("edit")
      toast.success("Version restored", { description: "Recalculating historical sessions…" })
    } catch {
      // Surfaced by the saveError alert on the page.
    }
  }

  function handleDiscard() {
    resetDraftToActive()
    toast.success("Changes discarded", { description: "The form is back to the active config." })
  }

  return (
    <div className="space-y-5 pb-2">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Attention Score Settings</h1>
          <p className="mt-0.5 text-sm text-white/40">
            Every number the Attention Score formula uses. Saving recalculates all historical
            sessions, reports, and counts automatically.
          </p>
        </div>

        {activeConfig && (
          <div className="shrink-0 rounded-xl border border-white/10 bg-card/40 px-3.5 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Active version</p>
            <p className="mt-0.5 max-w-[16rem] truncate text-sm font-medium text-white" title={activeConfig.name}>
              {activeConfig.name}
            </p>
          </div>
        )}
      </div>

      {/* ── Background job banner ── */}
      <RecalculationProgress job={recalculationJob} onDismiss={dismissJob} />

      {/* ── Save / restore failure ── */}
      {saveError && (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3.5">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-red-400" />
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-red-300">{saveError}</p>
        </div>
      )}

      {/* ── Load failure ── */}
      {loadError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.05] px-6 py-14 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertCircleIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-white/80">Couldn't load the attention score config</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-white/40">{loadError}</p>
          </div>
          <Button
            size="sm" variant="outline" onClick={fetchActiveConfig}
            className="mt-1 gap-1.5 border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RefreshCwIcon className="size-3.5" />Try again
          </Button>
        </div>
      ) : isLoading || !draftConfig || !validation ? (
        <EditorSkeleton />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="h-auto w-max gap-0 rounded-none border-b border-white/10 bg-transparent p-0">
              <TabsTrigger
                value="edit"
                className="group relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-white/45
                  hover:text-white/70
                  data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent data-[state=active]:text-white
                  data-[state=active]:shadow-none"
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <PencilRulerIcon className="size-3.5 shrink-0" />
                  <span className="text-xs font-medium">Edit</span>
                  {errorCount > 0 && (
                    <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-red-400">
                      {errorCount}
                    </span>
                  )}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="history"
                className="group relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-white/45
                  hover:text-white/70
                  data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent data-[state=active]:text-white
                  data-[state=active]:shadow-none"
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <HistoryIcon className="size-3.5 shrink-0" />
                  <span className="text-xs font-medium">History</span>
                  {history.length > 0 && (
                    <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white/40">
                      {history.length}
                    </span>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Edit tab ── */}
          <TabsContent value="edit" className="mt-4 space-y-4">
            {/* Version name */}
            <section className="rounded-xl border border-white/10 bg-card/40 px-5 py-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <TagIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Label htmlFor="config-name" className="text-sm font-semibold text-white">
                    Version name
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-white/40">
                    Saved alongside your changes so this version is identifiable in history later.
                  </p>
                  <Input
                    id="config-name"
                    value={draftName}
                    disabled={isBusy}
                    aria-invalid={nameError ? true : undefined}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="e.g. August 2026 adjustment"
                    className={cn(
                      "mt-3 h-9 max-w-md border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25",
                      "focus-visible:border-indigo-400/60 focus-visible:ring-indigo-500/20",
                      nameError && "border-red-500/50 bg-red-500/5",
                    )}
                  />
                  {nameError && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
                      <AlertCircleIcon className="size-3 shrink-0" />
                      {nameError}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <ConfigEditorForm
              config={draftConfig}
              onChange={setDraftConfig}
              validation={validation}
              fieldErrors={fieldErrors}
              disabled={isBusy}
            />

            <PreviewPanel
              results={previewResults}
              isPreviewing={isPreviewing}
              error={previewError}
              canPreview={errorCount === 0 && !isBusy}
              onPreview={preview}
            />

            {/* Blocking-error summary */}
            {errorCount > 0 && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/[0.05] px-4 py-3.5">
                <p className="flex items-center gap-2 text-sm font-medium text-red-300">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  {errorCount === 1 ? "1 problem blocks saving" : `${errorCount} problems block saving`}
                </p>
                <ul className="mt-2 space-y-1 pl-6">
                  {errorSummary.map((issue) => (
                    <li key={issue.path + issue.message} className="list-disc text-xs leading-relaxed text-white/50">
                      {issue.message}
                    </li>
                  ))}
                  {validation.errors.length > errorSummary.length && (
                    <li className="list-disc text-xs text-white/35">
                      …and {validation.errors.length - errorSummary.length} more.
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* ── Sticky action bar ── */}
            <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-background/95 px-1 py-3 backdrop-blur">
              <StatusLine
                isDirty={isDirty}
                errorCount={errorCount}
                warningCount={warningCount}
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={handleDiscard}
                  disabled={!isDirty || isBusy}
                  className="h-9 gap-1.5 border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <RotateCcwIcon className="size-3.5" />Discard changes
                </Button>
                <Button
                  type="button" size="sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!canSave}
                  title={
                    errorCount > 0
                      ? "Fix the highlighted errors first"
                      : nameError
                        ? "Give this version a name first"
                        : !isDirty
                          ? "No changes to save"
                          : undefined
                  }
                  className="h-9 gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-500 disabled:opacity-40"
                >
                  {isSaving ? <Loader2Icon className="size-3.5 animate-spin" /> : <SaveIcon className="size-3.5" />}
                  Save &amp; Recalculate
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── History tab ── */}
          <TabsContent value="history" className="mt-4">
            <HistoryPanel
              history={history}
              isLoading={isLoadingHistory}
              error={historyError}
              restoringId={restoringId}
              isBusy={isBusy}
              onRestore={handleRestore}
              onRetry={fetchHistory}
            />
          </TabsContent>
        </Tabs>
      )}

      <SaveConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isSaving={isSaving}
        configName={draftName.trim()}
        warningCount={warningCount}
        error={saveError}
        onConfirm={handleConfirmSave}
      />
    </div>
  )
}

// ── Sticky-bar status text ────────────────────────────────────────────────────

function StatusLine({
  isDirty,
  errorCount,
  warningCount,
}: {
  isDirty: boolean
  errorCount: number
  warningCount: number
}) {
  if (errorCount > 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertCircleIcon className="size-3.5 shrink-0" />
        {errorCount === 1 ? "1 error to fix" : `${errorCount} errors to fix`}
      </p>
    )
  }
  if (!isDirty) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-white/35">
        <CheckCircle2Icon className="size-3.5 shrink-0 text-emerald-500/60" />
        No unsaved changes
      </p>
    )
  }
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5 text-indigo-300">
        <span className="size-1.5 rounded-full bg-indigo-400" />
        Unsaved changes
      </span>
      {warningCount > 0 && (
        <span className="flex items-center gap-1.5 text-amber-400/80">
          <AlertTriangleIcon className="size-3.5 shrink-0" />
          {warningCount === 1 ? "1 warning" : `${warningCount} warnings`}
        </span>
      )}
    </p>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────────

function EditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64 rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-card/40">
          <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
