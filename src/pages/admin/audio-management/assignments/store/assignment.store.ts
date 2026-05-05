// ─── Audio Assignment Zustand Store ─────────────────────────────────────────
// Single source of truth for the Audio Assignments page.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  createAssignment as apiCreateAssignment,
  deleteAssignment as apiDeleteAssignment,
  getAllAssignments,
} from "../service/assignment.service"
import type {
  AssignmentListFilters,
  AssignmentState,
  CreateAssignmentPayload,
  CreateAssignmentResult,
} from "../types/assignment.types"

const DEFAULT_PER_PAGE = 15

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  items: [],
  meta: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  // Load list from API and keep filters in sync.
  fetchAssignments: async (filters?: AssignmentListFilters) => {
    const mergedFilters = filters ? { ...get().filters, ...filters } : get().filters
    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getAllAssignments(mergedFilters)
      set({ items: response.data, meta: response.meta, isLoading: false })
    } catch (err) {
      // Ignore cancellation only.
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load assignments. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message

      set({ isLoading: false, error: message })
    }
  },

  // Apply filters and re-fetch from page 1.
  setFilters: (filters: AssignmentListFilters) => {
    const next = { ...get().filters, ...filters, page: 1 }
    set({ filters: next })
    get().fetchAssignments(next)
  },

  // Create assignment and refresh list.
  createAssignment: async (payload: CreateAssignmentPayload): Promise<CreateAssignmentResult> => {
    const result = await apiCreateAssignment(payload)
    await get().fetchAssignments()
    return result
  },

  // Delete assignment and refresh list.
  deleteAssignment: async (id: number): Promise<void> => {
    await apiDeleteAssignment(id)
    await get().fetchAssignments()
  },

  clearError: () => set({ error: null }),
}))
