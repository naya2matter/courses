// ─── useAssignment Hook ─────────────────────────────────────────────────────
// Thin wrapper around the assignment store for cleaner page components.

import { useEffect } from "react"
import { useAssignmentStore } from "../store/assignment.store"

export function useAssignment() {
  const items = useAssignmentStore((s) => s.items)
  const meta = useAssignmentStore((s) => s.meta)
  const isLoading = useAssignmentStore((s) => s.isLoading)
  const error = useAssignmentStore((s) => s.error)
  const filters = useAssignmentStore((s) => s.filters)

  const fetchAssignments = useAssignmentStore((s) => s.fetchAssignments)
  const setFilters = useAssignmentStore((s) => s.setFilters)
  const createAssignment = useAssignmentStore((s) => s.createAssignment)
  const deleteAssignment = useAssignmentStore((s) => s.deleteAssignment)
  const clearError = useAssignmentStore((s) => s.clearError)

  // Initial fetch once when page mounts.
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
