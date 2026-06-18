// ─── Quiz Assignment Zustand Store ───────────────────────────────────────────
// Single source of truth for the Quiz Assignments page.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  createQuizAssignment as apiCreate,
  deleteQuizAssignment as apiDelete,
  getAllQuizAssignments,
} from "../service/quiz-assignment.service"
import type {
  CreateQuizAssignmentPayload,
  CreateQuizAssignmentResult,
  QuizAssignmentListFilters,
  QuizAssignmentState,
} from "../types/quiz-assignment.types"

const DEFAULT_PER_PAGE = 15

export const useQuizAssignmentStore = create<QuizAssignmentState>((set, get) => ({
  items: [],
  meta: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  fetchAssignments: async (filters?: QuizAssignmentListFilters) => {
    const mergedFilters = filters ? { ...get().filters, ...filters } : get().filters
    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getAllQuizAssignments(mergedFilters)
      set({ items: response.data, meta: response.meta, isLoading: false })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load quiz assignments. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message

      set({ isLoading: false, error: message })
    }
  },

  setFilters: (filters: QuizAssignmentListFilters) => {
    // Only reset to page 1 when an actual filter (not page itself) changes.
    // This allows pagination buttons to call setFilters({ page: N }) without
    // being overridden back to page 1.
    const isPageOnlyChange = Object.keys(filters).length === 1 && "page" in filters
    const next = {
      ...get().filters,
      ...filters,
      ...(isPageOnlyChange ? {} : { page: 1 }),
    }
    set({ filters: next })
    get().fetchAssignments(next)
  },

  createAssignment: async (payload: CreateQuizAssignmentPayload): Promise<CreateQuizAssignmentResult> => {
    const result = await apiCreate(payload)
    await get().fetchAssignments()
    return result
  },

  deleteAssignment: async (id: number): Promise<void> => {
    await apiDelete(id)
    await get().fetchAssignments()
  },

  clearError: () => set({ error: null }),
}))
