// ─── useUsers Hook ────────────────────────────────────────────────────────────
// Convenience hook: triggers the initial data fetch on mount and exposes
// the store state so components don't need to know about Zustand directly.

import { useEffect } from "react"
import { useUsersStore } from "../store/user.store"

/**
 * Use inside any component that needs the users list.
 *
 * Usage:
 *   const { users, meta, isLoading, error, clearError, fetchUsers, setFilters } = useUsers()
 */
export function useUsers() {
  const users = useUsersStore((s) => s.users)
  const meta = useUsersStore((s) => s.meta)
  const isLoading = useUsersStore((s) => s.isLoading)
  const error = useUsersStore((s) => s.error)
  const filters = useUsersStore((s) => s.filters)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const setFilters = useUsersStore((s) => s.setFilters)
  const clearError = useUsersStore((s) => s.clearError)

  // Trigger the initial fetch when the hook is first mounted
  useEffect(() => {
    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  return {
    users,
    meta,
    isLoading,
    error,
    filters,
    fetchUsers,
    setFilters,
    clearError,
    /** Alias for a no-arg refetch with the current filters */
    refetch: () => fetchUsers(),
  }
}
