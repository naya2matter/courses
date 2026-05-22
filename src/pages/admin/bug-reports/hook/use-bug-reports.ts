// ─── useBugReports Hook ───────────────────────────────────────────────────────
// Triggers the initial fetch on mount and exposes Zustand store state.

import { useEffect } from "react"
import { useBugReportStore } from "../store/bug-report.store"

export function useBugReports() {
  const items = useBugReportStore((s) => s.items)
  const meta = useBugReportStore((s) => s.meta)
  const links = useBugReportStore((s) => s.links)
  const isLoading = useBugReportStore((s) => s.isLoading)
  const error = useBugReportStore((s) => s.error)
  const filters = useBugReportStore((s) => s.filters)
  const fetchBugReports = useBugReportStore((s) => s.fetchBugReports)
  const setFilters = useBugReportStore((s) => s.setFilters)
  const clearError = useBugReportStore((s) => s.clearError)

  useEffect(() => {
    fetchBugReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items,
    meta,
    links,
    isLoading,
    error,
    filters,
    fetchBugReports,
    setFilters,
    clearError,
    refetch: () => fetchBugReports(),
  }
}
