// ─── useAttentionScoreConfig Hook ──────────────────────────────────────────────
// Triggers the initial fetch (active config + history) on mount, stops any
// in-flight job polling on unmount, and re-exposes the store plus the two things
// derived from it: whether the draft differs from the active config, and whether
// the draft passes client-side validation.

import { useEffect, useMemo } from "react"
import { useAttentionScoreConfigStore } from "../store/attention-score.store"
import { validateConfig } from "../lib/validate-config"

export function useAttentionScoreConfig() {
  const activeConfig = useAttentionScoreConfigStore((s) => s.activeConfig)
  const draftConfig = useAttentionScoreConfigStore((s) => s.draftConfig)
  const draftName = useAttentionScoreConfigStore((s) => s.draftName)
  const history = useAttentionScoreConfigStore((s) => s.history)
  const previewResults = useAttentionScoreConfigStore((s) => s.previewResults)
  const recalculationJob = useAttentionScoreConfigStore((s) => s.recalculationJob)

  const isLoading = useAttentionScoreConfigStore((s) => s.isLoading)
  const isLoadingHistory = useAttentionScoreConfigStore((s) => s.isLoadingHistory)
  const isPreviewing = useAttentionScoreConfigStore((s) => s.isPreviewing)
  const isSaving = useAttentionScoreConfigStore((s) => s.isSaving)
  const restoringId = useAttentionScoreConfigStore((s) => s.restoringId)

  const loadError = useAttentionScoreConfigStore((s) => s.loadError)
  const historyError = useAttentionScoreConfigStore((s) => s.historyError)
  const previewError = useAttentionScoreConfigStore((s) => s.previewError)
  const saveError = useAttentionScoreConfigStore((s) => s.saveError)
  const fieldErrors = useAttentionScoreConfigStore((s) => s.fieldErrors)

  const fetchActiveConfig = useAttentionScoreConfigStore((s) => s.fetchActiveConfig)
  const fetchHistory = useAttentionScoreConfigStore((s) => s.fetchHistory)
  const setDraftConfig = useAttentionScoreConfigStore((s) => s.setDraftConfig)
  const setDraftName = useAttentionScoreConfigStore((s) => s.setDraftName)
  const resetDraftToActive = useAttentionScoreConfigStore((s) => s.resetDraftToActive)
  const preview = useAttentionScoreConfigStore((s) => s.preview)
  const save = useAttentionScoreConfigStore((s) => s.save)
  const restore = useAttentionScoreConfigStore((s) => s.restore)
  const stopPolling = useAttentionScoreConfigStore((s) => s.stopPolling)
  const dismissJob = useAttentionScoreConfigStore((s) => s.dismissJob)
  const clearErrors = useAttentionScoreConfigStore((s) => s.clearErrors)

  useEffect(() => {
    fetchActiveConfig()
    fetchHistory()
    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Client-side validation of the draft — recomputed only when the draft changes.
  const validation = useMemo(
    () => (draftConfig ? validateConfig(draftConfig) : null),
    [draftConfig],
  )

  // The config is small (a few dozen numbers), so a structural compare is cheap
  // and far more reliable than tracking dirtiness through every setter.
  const isDirty = useMemo(() => {
    if (!draftConfig || !activeConfig) return false
    return JSON.stringify(draftConfig) !== JSON.stringify(activeConfig.config)
  }, [draftConfig, activeConfig])

  const isBusy = isSaving || restoringId !== null

  return {
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
    clearErrors,
  }
}
