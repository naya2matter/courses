// ─── Course Assignment Zustand Store ─────────────────────────────────────────
// Single source of truth for the Course Assignments feature.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  getAllCourseAssignments,
  createCourseAssignment as apiCreateAssignment,
  deleteCourseAssignment as apiDeleteAssignment,
} from "../service/course-assignment.service"
import type {
  CourseAssignmentListFilters,
  CourseAssignmentState,
  CreateCourseAssignmentPayload,
} from "../types/course-assignment.types"

const DEFAULT_PER_PAGE = 15

export const useCourseAssignmentStore = create<CourseAssignmentState>((set, get) => ({
  // ── List state ─────────────────────────────────────────────────────────────
  items: [],
  meta: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  // ── Create state ───────────────────────────────────────────────────────────
  isCreating: false,
  createError: null,
  lastCreated: null,

  // ── Delete state ───────────────────────────────────────────────────────────
  isDeleting: false,
  deleteError: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  fetchAssignments: async (filters?: CourseAssignmentListFilters) => {
    const mergedFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters
    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getAllCourseAssignments(mergedFilters)
      set({ items: response.data, meta: response.meta, isLoading: false })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }
      let message = "Failed to load course assignments. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      set({ isLoading: false, error: message })
    }
  },

  setFilters: (filters: CourseAssignmentListFilters) => {
    const next = { ...get().filters, ...filters, page: 1 }
    set({ filters: next })
    get().fetchAssignments(next)
  },

  createAssignment: async (payload: CreateCourseAssignmentPayload) => {
    set({ isCreating: true, createError: null })

    try {
      const created = await apiCreateAssignment(payload)
      // Prepend the newly created assignment so it appears first in the list
      set((state) => ({
        isCreating: false,
        lastCreated: created,
        items: [created, ...state.items],
        meta: state.meta
          ? { ...state.meta, total: state.meta.total + 1 }
          : null,
      }))
      return created
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isCreating: false })
        throw err
      }
      let message = "Failed to create assignment. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      set({ isCreating: false, createError: message })
      throw new Error(message)
    }
  },

  deleteAssignment: async (id: number) => {
    set({ isDeleting: true, deleteError: null })

    try {
      await apiDeleteAssignment(id)
      set((state) => ({
        isDeleting: false,
        items: state.items.filter((item) => item.id !== id),
        meta: state.meta
          ? { ...state.meta, total: Math.max(0, state.meta.total - 1) }
          : null,
      }))
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isDeleting: false })
        return
      }
      let message = "Failed to delete assignment. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      set({ isDeleting: false, deleteError: message })
      throw new Error(message)
    }
  },

  clearError: () => set({ error: null }),
  clearCreateError: () => set({ createError: null }),
  clearLastCreated: () => set({ lastCreated: null }),
}))
