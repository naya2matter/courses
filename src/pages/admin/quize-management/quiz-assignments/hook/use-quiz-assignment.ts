// ─── useQuizAssignment Hook ───────────────────────────────────────────────────
// Thin wrapper around the quiz assignment store.

import { useEffect } from "react"
import { useQuizAssignmentStore } from "../store/quiz-assignment.store"

export function useQuizAssignment() {
  const items = useQuizAssignmentStore((s) => s.items)
  const meta = useQuizAssignmentStore((s) => s.meta)
  const isLoading = useQuizAssignmentStore((s) => s.isLoading)
  const error = useQuizAssignmentStore((s) => s.error)
  const filters = useQuizAssignmentStore((s) => s.filters)

  const fetchAssignments = useQuizAssignmentStore((s) => s.fetchAssignments)
  const setFilters = useQuizAssignmentStore((s) => s.setFilters)
  const createAssignment = useQuizAssignmentStore((s) => s.createAssignment)
  const deleteAssignment = useQuizAssignmentStore((s) => s.deleteAssignment)
  const clearError = useQuizAssignmentStore((s) => s.clearError)

  useEffect(() => {
    fetchAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items,
    meta,
    isLoading,
    error,
    filters,
    fetchAssignments,
    setFilters,
    createAssignment,
    deleteAssignment,
    clearError,
  }
}
