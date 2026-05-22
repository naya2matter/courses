// ─── Departments Zustand Store ────────────────────────────────────────────────
// Single source of truth for department data in the UI.
// Components read state and dispatch actions through this store.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getAllDepartments } from "../service/department.service"
import type { DepartmentsState } from "../types/department.types"

export const useDepartmentStore = create<DepartmentsState>((set) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  departments: [],
  cards: [],
  isLoading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch all departments from the API and update the store.
   * Ignores AbortError (request cancelled) to avoid showing
   * spurious error messages during navigation.
   */
  fetchDepartments: async () => {
    // Set loading, clear any previous error
    set({ isLoading: true, error: null })

    try {
      const { departments, cards } = await getAllDepartments()
      set({ departments, cards, isLoading: false })
    } catch (err) {
      // Ignore cancellation — not a real error
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      // Derive a human-readable message from the error
      let message = "Failed to load departments. Please try again."
      if (isApiError(err)) {
        message = err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  /** Clear the error banner (e.g. when the user dismisses it) */
  clearError: () => set({ error: null }),
}))
