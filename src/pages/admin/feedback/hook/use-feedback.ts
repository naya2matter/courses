// ─── useFeedback Hook ─────────────────────────────────────────────────────────
// Triggers the initial fetch on mount and exposes Zustand store state.

import { useEffect } from "react"
import { useFeedbackStore } from "../store/feedback.store"

export function useFeedback() {
  const items = useFeedbackStore((s) => s.items)
  const meta = useFeedbackStore((s) => s.meta)
  const links = useFeedbackStore((s) => s.links)
  const isLoading = useFeedbackStore((s) => s.isLoading)
  const error = useFeedbackStore((s) => s.error)
  const filters = useFeedbackStore((s) => s.filters)
  const fetchFeedback = useFeedbackStore((s) => s.fetchFeedback)
  const setFilters = useFeedbackStore((s) => s.setFilters)
  const clearError = useFeedbackStore((s) => s.clearError)

  useEffect(() => {
    fetchFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items,
    meta,
    links,
    isLoading,
    error,
    filters,
    fetchFeedback,
    setFilters,
    clearError,
    refetch: () => fetchFeedback(),
  }
}
