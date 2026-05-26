// ─── Feedback Zustand Store ───────────────────────────────────────────────────
// Single source of truth for the admin feedback list.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getFeedbackList } from "../service/feedback.service"
import type {
  Feedback,
  FeedbackFilters,
  PaginationMeta,
  PaginationLinks,
} from "../types/feedback.types"

interface FeedbackState {
  items: Feedback[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  isLoading: boolean
  error: string | null
  filters: FeedbackFilters

  fetchFeedback: (filters?: FeedbackFilters) => Promise<void>
  setFilters: (filters: FeedbackFilters) => void
  clearError: () => void
}

const DEFAULT_PER_PAGE = 15

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  items: [],
  meta: null,
  links: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  fetchFeedback: async (filters?: FeedbackFilters) => {
    const mergedFilters: FeedbackFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters

    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getFeedbackList(mergedFilters)
      set({
        items: response.data,
        meta: response.meta,
        links: response.links,
        isLoading: false,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load feedback. Please try again."
      if (isApiError(err)) {
        if (err.status === 401) {
          message = "You are not authenticated. Please log in again."
        } else {
          message = err.message || message
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  setFilters: (filters: FeedbackFilters) => {
    const next = { ...get().filters, ...filters, page: 1 }
    set({ filters: next })
    get().fetchFeedback(next)
  },

  clearError: () => set({ error: null }),
}))
