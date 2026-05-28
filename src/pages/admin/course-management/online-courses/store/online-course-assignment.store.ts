// ─── Online Course Assignment Store ─────────────────────────────────────────
// Zustand store for online-course assignment management.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  createOnlineCourseAssignments,
  deleteOnlineCourseAssignment,
  getOnlineCourseAssignments,
} from "../service/online-course-assignment.service"
import type {
  CreateOnlineCourseAssignmentPayload,
  OnlineCourseAssignmentFilters,
  OnlineCourseAssignmentState,
} from "../types/online-course-assignment.types"

const DEFAULT_PER_PAGE = 15

export const useOnlineCourseAssignmentStore = create<OnlineCourseAssignmentState>((set, get) => ({
  items: [],
  meta: null,
  links: null,
  summaryCards: [],
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  isCreating: false,
  createError: null,
  lastCreateMeta: null,

  isDeleting: false,
  deleteError: null,

  fetchAssignments: async (filters?: OnlineCourseAssignmentFilters) => {
    const merged = filters ? { ...get().filters, ...filters } : get().filters
    set({ isLoading: true, error: null, filters: merged })

    try {
      const res = await getOnlineCourseAssignments(merged)
      set({
        items: res.data,
        links: res.links,
        meta: res.meta,
        summaryCards: res.cards,
        isLoading: false,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }
      let msg = "Failed to load online course assignments."
      if (isApiError(err)) msg = err.message || msg
      else if (err instanceof Error) msg = err.message
      set({ isLoading: false, error: msg })
    }
  },

  setFilters: (filters: Partial<OnlineCourseAssignmentFilters>) => {
    const next = { ...get().filters, ...filters, page: 1 }
    set({ filters: next })
    get().fetchAssignments(next)
  },

  createAssignments: async (payload: CreateOnlineCourseAssignmentPayload) => {
    set({ isCreating: true, createError: null, lastCreateMeta: null })
    try {
      const res = await createOnlineCourseAssignments(payload)
      set((state) => ({
        isCreating: false,
        lastCreateMeta: res.meta,
        items: [...res.data, ...state.items],
        meta: state.meta
          ? {
              ...state.meta,
              total: state.meta.total + (res.meta.created ?? 0),
            }
          : state.meta,
      }))
      return res
    } catch (err) {
      let msg = "Failed to create assignments."
      if (isApiError(err)) msg = err.message || msg
      else if (err instanceof Error) msg = err.message
      set({ isCreating: false, createError: msg })
      throw new Error(msg)
    }
  },

  deleteAssignment: async (id: number) => {
    set({ isDeleting: true, deleteError: null })
    try {
      await deleteOnlineCourseAssignment(id)
      set((state) => ({
        isDeleting: false,
        items: state.items.filter((it) => it.id !== id),
        meta: state.meta
          ? { ...state.meta, total: Math.max(0, state.meta.total - 1) }
          : null,
      }))
    } catch (err) {
      let msg = "Failed to unassign user."
      if (isApiError(err)) msg = err.message || msg
      else if (err instanceof Error) msg = err.message
      set({ isDeleting: false, deleteError: msg })
      throw new Error(msg)
    }
  },

  clearError: () => set({ error: null }),
  clearCreateError: () => set({ createError: null }),
  clearDeleteError: () => set({ deleteError: null }),
}))
