// ─── Online Course Zustand Store ─────────────────────────────────────────────
// Single source of truth for the admin online-courses list and detail.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  getOnlineCourses,
  getOnlineCourseById,
  deleteOnlineCourse,
} from "../service/online-course.service"
import type {
  OnlineCourse,
  OnlineCourseDetail,
  OnlineCourseFilters,
  OnlineCourseSummaryCard,
  PaginationLinks,
  PaginationMeta,
} from "../types/online-course.types"

// ── State shape ───────────────────────────────────────────────────────────────

interface OnlineCourseState {
  // List
  items: OnlineCourse[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  summaryCards: OnlineCourseSummaryCard[]
  isLoading: boolean
  error: string | null
  filters: OnlineCourseFilters

  // Detail
  currentCourse: OnlineCourseDetail | null
  isLoadingDetail: boolean
  detailError: string | null

  // Actions
  fetchCourses: (filters?: OnlineCourseFilters) => Promise<void>
  setFilters: (filters: Partial<OnlineCourseFilters>) => void
  fetchCourseById: (id: number) => Promise<void>
  deleteCourse: (id: number) => Promise<void>
  clearError: () => void
  clearDetailError: () => void
}

const DEFAULT_PER_PAGE = 15

// ── Store ─────────────────────────────────────────────────────────────────────

export const useOnlineCourseStore = create<OnlineCourseState>((set, get) => ({
  items: [],
  meta: null,
  links: null,
  summaryCards: [],
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  currentCourse: null,
  isLoadingDetail: false,
  detailError: null,

  // ── Fetch list ──────────────────────────────────────────────────────────────

  fetchCourses: async (filters?: OnlineCourseFilters) => {
    const mergedFilters: OnlineCourseFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters

    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getOnlineCourses(mergedFilters)
      set({
        items: response.data,
        meta: response.meta,
        links: response.links,
        summaryCards: response.cards ?? [],
        isLoading: false,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load online courses. Please try again."
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

  // ── Set filters + re-fetch ──────────────────────────────────────────────────

  setFilters: (filters: Partial<OnlineCourseFilters>) => {
    // Reset to page 1 only when the caller does not provide an explicit page,
    // so pagination controls that pass a page still work.
    const next: OnlineCourseFilters = {
      ...get().filters,
      ...filters,
      page: filters.page ?? 1,
    }
    set({ filters: next })
    get().fetchCourses(next)
  },

  // ── Fetch detail ────────────────────────────────────────────────────────────

  fetchCourseById: async (id: number) => {
    set({ isLoadingDetail: true, detailError: null, currentCourse: null })

    try {
      const course = await getOnlineCourseById(id)
      set({ currentCourse: course, isLoadingDetail: false })
    } catch (err) {
      let message = "Failed to load course details."
      if (isApiError(err)) {
        message =
          err.status === 404
            ? "Course not found."
            : err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }
      set({ isLoadingDetail: false, detailError: message })
    }
  },

  clearError: () => set({ error: null }),
  clearDetailError: () => set({ detailError: null }),

  // ── Delete course ───────────────────────────────────────────────────────────

  deleteCourse: async (id: number) => {
    await deleteOnlineCourse(id)
    // Optimistically remove from list so navigating back shows the updated list
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }))
  },
}))
