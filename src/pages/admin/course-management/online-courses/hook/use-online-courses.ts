// ─── useOnlineCourses Hook ────────────────────────────────────────────────────
// Triggers the initial fetch on mount and exposes Zustand store state.

import { useEffect } from "react"
import { useOnlineCourseStore } from "../store/online-course.store"

export function useOnlineCourses() {
  const items = useOnlineCourseStore((s) => s.items)
  const meta = useOnlineCourseStore((s) => s.meta)
  const links = useOnlineCourseStore((s) => s.links)
  const summaryCards = useOnlineCourseStore((s) => s.summaryCards)
  const isLoading = useOnlineCourseStore((s) => s.isLoading)
  const error = useOnlineCourseStore((s) => s.error)
  const filters = useOnlineCourseStore((s) => s.filters)
  const fetchCourses = useOnlineCourseStore((s) => s.fetchCourses)
  const setFilters = useOnlineCourseStore((s) => s.setFilters)
  const clearError = useOnlineCourseStore((s) => s.clearError)

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items,
    meta,
    links,
    summaryCards,
    isLoading,
    error,
    filters,
    fetchCourses,
    setFilters,
    clearError,
    refetch: () => fetchCourses(),
  }
}
