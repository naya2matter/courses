// ─── useOnlineCourseAssignments Hook ────────────────────────────────────────

import { useEffect } from "react"
import { useOnlineCourseAssignmentStore } from "../store/online-course-assignment.store"

export function useOnlineCourseAssignments() {
  const items = useOnlineCourseAssignmentStore((s) => s.items)
  const meta = useOnlineCourseAssignmentStore((s) => s.meta)
  const summaryCards = useOnlineCourseAssignmentStore((s) => s.summaryCards)
  const isLoading = useOnlineCourseAssignmentStore((s) => s.isLoading)
  const error = useOnlineCourseAssignmentStore((s) => s.error)
  const filters = useOnlineCourseAssignmentStore((s) => s.filters)

  const isCreating = useOnlineCourseAssignmentStore((s) => s.isCreating)
  const createError = useOnlineCourseAssignmentStore((s) => s.createError)
  const lastCreateMeta = useOnlineCourseAssignmentStore((s) => s.lastCreateMeta)

  const isDeleting = useOnlineCourseAssignmentStore((s) => s.isDeleting)

  const fetchAssignments = useOnlineCourseAssignmentStore((s) => s.fetchAssignments)
  const setFilters = useOnlineCourseAssignmentStore((s) => s.setFilters)
  const createAssignments = useOnlineCourseAssignmentStore((s) => s.createAssignments)
  const deleteAssignment = useOnlineCourseAssignmentStore((s) => s.deleteAssignment)
  const clearError = useOnlineCourseAssignmentStore((s) => s.clearError)
  const clearCreateError = useOnlineCourseAssignmentStore((s) => s.clearCreateError)

  useEffect(() => {
    fetchAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items,
    meta,
    summaryCards,
    isLoading,
    error,
    filters,

    isCreating,
    createError,
    lastCreateMeta,
    isDeleting,

    fetchAssignments,
    setFilters,
    createAssignments,
    deleteAssignment,
    clearError,
    clearCreateError,
  }
}
