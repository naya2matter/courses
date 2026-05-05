// ─── useDepartments Hook ──────────────────────────────────────────────────────
// Convenience hook that triggers the initial fetch and exposes store state.
// Use this in any component that needs department data.

import { useEffect } from "react"
import { useDepartmentStore } from "../store/department.store"

/**
 * Fetches departments on mount and returns the current store state.
 *
 * Usage:
 *   const { departments, isLoading, error, clearError } = useDepartments()
 */
export function useDepartments() {
  const departments = useDepartmentStore((s) => s.departments)
  const isLoading = useDepartmentStore((s) => s.isLoading)
  const error = useDepartmentStore((s) => s.error)
  const fetchDepartments = useDepartmentStore((s) => s.fetchDepartments)
  const clearError = useDepartmentStore((s) => s.clearError)

  // Trigger fetch on first render
  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  return { departments, isLoading, error, clearError, refetch: fetchDepartments }
}
