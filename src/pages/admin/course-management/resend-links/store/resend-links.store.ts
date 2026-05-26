// ─── Resend Login Links — Zustand Store ───────────────────────────────────────

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getExpiredLinks } from "../service/resend-links.service"
import type {
  ExpiredLinkAssignment,
  ExpiredLinksFilters,
  PaginationLinks,
  PaginationMeta,
} from "../types/resend-links.types"

interface ResendLinksState {
  items: ExpiredLinkAssignment[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  isLoading: boolean
  error: string | null
  filters: ExpiredLinksFilters

  fetchExpiredLinks: (page?: number) => Promise<void>
  setFilters: (partial: Partial<ExpiredLinksFilters>) => void
  clearError: () => void
}

export const useResendLinksStore = create<ResendLinksState>((set, get) => ({
  items: [],
  meta: null,
  links: null,
  isLoading: false,
  error: null,
  filters: { page: 1 },

  fetchExpiredLinks: async (page?: number) => {
    const currentFilters = get().filters
    const targetPage = page ?? currentFilters.page ?? 1
    set({ isLoading: true, error: null, filters: { ...currentFilters, page: targetPage } })

    try {
      const res = await getExpiredLinks(targetPage)
      set({ items: res.data, meta: res.meta, links: res.links, isLoading: false })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }
      let message = "Failed to load expired links. Please try again."
      if (isApiError(err)) {
        message =
          err.status === 401
            ? "You are not authenticated. Please log in again."
            : err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }
      set({ isLoading: false, error: message })
    }
  },

  setFilters: (partial) => {
    set((s) => ({ filters: { ...s.filters, ...partial } }))
  },

  clearError: () => set({ error: null }),
}))
