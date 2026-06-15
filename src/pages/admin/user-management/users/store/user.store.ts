// ─── Users Zustand Store ──────────────────────────────────────────────────────
// Single source of truth for users list data.
// Components read state and dispatch actions through this store.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getAllUsers } from "../service/user.service"
import type { UsersState, UserListFilters } from "../types/user.types"

/** Default per-page used on the initial fetch */
const DEFAULT_PER_PAGE = 15

export const useUsersStore = create<UsersState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  users: [],
  meta: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch users from the API using the provided filters.
   * If no filters are passed, the currently stored filters are reused
   * (useful for "Refresh" buttons).
   *
   * AbortError (navigation away mid-request) is silently ignored.
   */
  fetchUsers: async (filters?: UserListFilters) => {
    // Merge incoming filters with the current ones so callers only need to
    // pass the fields that changed (e.g. just { page: 2 }).
    const mergedFilters: UserListFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters

    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getAllUsers(mergedFilters)
      set({
        users: response.data,
        meta: response.meta,
        isLoading: false,
      })
    } catch (err) {
      // Ignore request cancellation — not a real error
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      // Derive a human-readable message from the error
      let message = "Failed to load users. Please try again."
      if (isApiError(err)) {
        message = err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  /**
   * Update the active filters and immediately re-fetch the list.
   * Resets to page 1 only when the caller does not provide an explicit page.
   */
  setFilters: (filters: UserListFilters) => {
    const next = {
      ...get().filters,
      ...filters,
      page: filters.page ?? 1,
    }
    set({ filters: next })
    get().fetchUsers(next)
  },

  /** Clear the error banner (e.g. when the user dismisses it) */
  clearError: () => set({ error: null }),
}))
