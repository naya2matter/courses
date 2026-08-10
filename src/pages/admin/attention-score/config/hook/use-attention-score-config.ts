// ─── useAttentionScoreConfig Hook ──────────────────────────────────────────────
// Triggers the initial fetch (active config + history) on mount, stops any
// in-flight job polling on unmount, and re-exposes the store.

import { useEffect } from "react"
import { useAttentionScoreConfigStore } from "../store/attention-score.store"

export function useAttentionScoreConfig() {
  const activeConfig = useAttentionScoreConfigStore((s) => s.activeConfig)
  const draftConfig = useAttentionScoreConfigStore((s) => s.draftConfig)
  const draftName = useAttentionScoreConfigStore((s) => s.draftName)
  const history = useAttentionScoreConfigStore((s) => s.history)
  const previewResults = useAttentionScoreConfigStore((s) => s.previewResults)
  const recalculationJob = useAttentionScoreConfigStore((s) => s.recalculationJob)
  const isLoading = useAttentionScoreConfigStore((s) => s.isLoading)
  const isPreviewing = useAttentionScoreConfigStore((s) => s.isPreviewing)
  const isSaving = useAttentionScoreConfigStore((s) => s.isSaving)
  const error = useAttentionScoreConfigStore((s) => s.error)

  const fetchActiveConfig = useAttentionScoreConfigStore((s) => s.fetchActiveConfig)
  const fetchHistory = useAttentionScoreConfigStore((s) => s.fetchHistory)
  const setDraftConfig = useAttentionScoreConfigStore((s) => s.setDraftConfig)
  const setDraftName = useAttentionScoreConfigStore((s) => s.setDraftName)
  const resetDraftToActive = useAttentionScoreConfigStore((s) => s.resetDraftToActive)
  const preview = useAttentionScoreConfigStore((s) => s.preview)
  const save = useAttentionScoreConfigStore((s) => s.save)
  const restore = useAttentionScoreConfigStore((s) => s.restore)
  const stopPolling = useAttentionScoreConfigStore((s) => s.stopPolling)
  const clearError = useAttentionScoreConfigStore((s) => s.clearError)

  useEffect(() => {
    fetchActiveConfig()
    fetchHistory()
    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    activeConfig,
    draftConfig,
    draftName,
    history,
    previewResults,
    recalculationJob,
    isLoading,
    isPreviewing,
    isSaving,
    error,
    fetchActiveConfig,
    fetchHistory,
    setDraftConfig,
    setDraftName,
    resetDraftToActive,
    preview,
    save,
    restore,
    clearError,
  }
}
