// ─── useQuizzes Hook ──────────────────────────────────────────────────────────
// Triggers the initial fetch on mount and exposes Zustand store state.

import { useEffect } from "react"
import { useQuizStore } from "../store/quiz.store"

export function useQuizzes() {
  const items = useQuizStore((s) => s.items)
  const meta = useQuizStore((s) => s.meta)
  const isLoading = useQuizStore((s) => s.isLoading)
  const error = useQuizStore((s) => s.error)
  const filters = useQuizStore((s) => s.filters)
  const fetchQuizzes = useQuizStore((s) => s.fetchQuizzes)
  const setFilters = useQuizStore((s) => s.setFilters)
  const clearError = useQuizStore((s) => s.clearError)

  useEffect(() => {
    fetchQuizzes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items,
    meta,
    isLoading,
    error,
    filters,
    fetchQuizzes,
    setFilters,
    clearError,
    refetch: () => fetchQuizzes(),
  }
}
