// ─── Course Zustand Store ───────────────────────────────────────────────────
// Single source of truth for the Courses page.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  getAllCourses,
  getCourseById,
  createCourse as apiCreateCourse,
  updateCourse as apiUpdateCourse,
  deleteCourse as apiDeleteCourse,
} from "../service/course.service"
import type {
  CourseListFilters,
  CourseState,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "../types/course.types"

const DEFAULT_PER_PAGE = 15

/**
 * Zustand store for managing course state
 * - Handles course list with pagination
 * - Manages individual course detail fetching
 * - Tracks loading and error states
 */
export const useCourseStore = create<CourseState>((set, get) => ({
  // ─── List State ────────────────────────────────────────────────────────────
  items: [],
  meta: null,
  summaryCards: [],
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  // ─── Detail State ──────────────────────────────────────────────────────────
  currentCourse: null,
  isLoadingCourse: false,
  courseError: null,

  // ─── List Actions ──────────────────────────────────────────────────────────

  /**
   * Load courses from API with optional filters
   * Merges new filters with existing ones
   */
  fetchCourses: async (filters?: CourseListFilters) => {
    const mergedFilters = filters ? { ...get().filters, ...filters } : get().filters
    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getAllCourses(mergedFilters)
      set({
        items: response.data,
        meta: response.meta,
        summaryCards: response.cards ?? [],
        isLoading: false,
      })
    } catch (err) {
      // Ignore cancellation errors (user navigated away)
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      // Parse error message from API or fallback to generic message
      let message = "Failed to load courses. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message

      set({ isLoading: false, error: message })
    }
  },

  /**
   * Apply new filters and re-fetch.
   * Resets to page 1 only when the caller does not provide an explicit page.
   */
  setFilters: (filters: CourseListFilters) => {
    const next = { ...get().filters, ...filters, page: filters.page ?? 1 }
    set({ filters: next })
    get().fetchCourses(next)
  },

  // ─── Detail Actions ────────────────────────────────────────────────────────

  /**
   * Fetch single course by ID for detail view
   */
  fetchCourseById: async (id: number) => {
    set({ isLoadingCourse: true, courseError: null, currentCourse: null })

    try {
      const course = await getCourseById(id)
      set({ currentCourse: course, isLoadingCourse: false })
    } catch (err) {
      // Ignore cancellation errors
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoadingCourse: false })
        return
      }

      // Parse error message
      let message = "Failed to load course details. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message

      set({ isLoadingCourse: false, courseError: message })
    }
  },

  // ─── Error Clearing ────────────────────────────────────────────────────────

  /**
   * Clear list error message
   */
  clearError: () => set({ error: null }),

  /**
   * Clear detail error message
   */
  clearCourseError: () => set({ courseError: null }),

  // ─── Write Actions ─────────────────────────────────────────────────────────

  /**
   * Create a new course, then refresh the list
   */
  createCourse: async (payload: CreateCoursePayload) => {
    const course = await apiCreateCourse(payload)
    await get().fetchCourses()
    return course
  },

  /**
   * Update an existing course, then refresh both list and detail (if loaded)
   */
  updateCourse: async (id: number, payload: UpdateCoursePayload) => {
    const course = await apiUpdateCourse(id, payload)
    // Refresh list to show updated data
    await get().fetchCourses()
    // If detail view has this course open, update it in-place
    if (get().currentCourse?.id === id) {
      set({ currentCourse: course })
    }
    return course
  },

  /**
   * Soft-delete a course, then refresh the list
   */
  deleteCourse: async (id: number) => {
    await apiDeleteCourse(id)
    await get().fetchCourses()
  },
}))
