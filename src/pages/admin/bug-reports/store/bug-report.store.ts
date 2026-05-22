// ─── Bug Report Zustand Store ─────────────────────────────────────────────────
// Single source of truth for the admin bug-report list.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getBugReports } from "../service/bug-report.service"
import type {
  BugReport,
  BugReportFilters,
  PaginationMeta,
  PaginationLinks,
} from "../types/bug-report.types"

interface BugReportState {
  items: BugReport[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  isLoading: boolean
  error: string | null
  filters: BugReportFilters

  fetchBugReports: (filters?: BugReportFilters) => Promise<void>
  setFilters: (filters: BugReportFilters) => void
  clearError: () => void
}

const DEFAULT_PER_PAGE = 15

export const useBugReportStore = create<BugReportState>((set, get) => ({
  items: [],
  meta: null,
  links: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  fetchBugReports: async (filters?: BugReportFilters) => {
    const mergedFilters: BugReportFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters

    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getBugReports(mergedFilters)
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

      let message = "Failed to load bug reports. Please try again."
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

  setFilters: (filters: BugReportFilters) => {
    const next = { ...get().filters, ...filters, page: 1 }
    set({ filters: next })
    get().fetchBugReports(next)
  },

  clearError: () => set({ error: null }),
}))
