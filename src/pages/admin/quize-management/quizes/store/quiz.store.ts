// ─── Quiz Zustand Store ───────────────────────────────────────────────────────
// Single source of truth for the quiz list data.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getAllQuizzes } from "../service/quiz.service"
import type { QuizListFilters, QuizState } from "../types/quiz.types"

const DEFAULT_PER_PAGE = 15

export const useQuizStore = create<QuizState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  items: [],
  meta: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  // ── Actions ────────────────────────────────────────────────────────────────

  fetchQuizzes: async (filters?: QuizListFilters) => {
    const mergedFilters: QuizListFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters

    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getAllQuizzes(mergedFilters)
      set({
        items: response.data ?? [],
        meta: response.meta ?? null,
        isLoading: false,
      })
    } catch (err) {
      // Silently ignore request cancellation
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load quizzes. Please try again."
      if (isApiError(err)) {
        message = err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  setFilters: (filters: QuizListFilters) => {
    const next = { ...get().filters, ...filters, page: 1 }
    set({ filters: next })
    get().fetchQuizzes(next)
  },

  clearError: () => set({ error: null }),
}))
