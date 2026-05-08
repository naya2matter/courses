// ─── Audio Category Zustand Store ─────────────────────────────────────────────
// Single source of truth for the audio categories list.
// Components read state and dispatch actions through this store.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  getAllCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
} from "../service/category.service"
import type {
  AudioCategoryResource,
  CategoryListResult,
  CategoryState,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/category.types"

export const useCategoryStore = create<CategoryState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  items: [],
  summaryCards: [],
  isLoading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch all audio categories from the API.
   * AbortError (navigation away mid-request) is silently ignored.
   */
  fetchCategories: async () => {
    set({ isLoading: true, error: null })

    try {
      const response: CategoryListResult = await getAllCategories()
      set({ items: response.items, summaryCards: response.cards, isLoading: false })
    } catch (err) {
      // Silently ignore browser navigation cancellations — not a real error
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      // Derive a human-readable message from the error
      let message = "Failed to load categories. Please try again."
      if (isApiError(err)) {
        message = err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  /**
   * Create a new audio category, then refresh the full list.
   * Throws on error so the form dialog can surface validation messages.
   */
  createCategory: async (payload: CreateCategoryPayload): Promise<AudioCategoryResource> => {
    const created = await apiCreateCategory(payload)
    // Refresh the list after a successful create
    await get().fetchCategories()
    return created
  },

  /**
   * Update an existing audio category by ID, then refresh the list.
   * Throws on error so the edit dialog can surface validation messages.
   */
  updateCategory: async (id: number, payload: UpdateCategoryPayload): Promise<AudioCategoryResource> => {
    const updated = await apiUpdateCategory(id, payload)
    // Refresh the list to reflect the change
    await get().fetchCategories()
    return updated
  },

  /**
   * Delete an audio category by ID, then refresh the list.
   * Throws on error so the confirmation dialog can show a message.
   */
  deleteCategory: async (id: number): Promise<void> => {
    await apiDeleteCategory(id)
    // Refresh the list after a successful delete
    await get().fetchCategories()
  },

  /** Dismiss the top-level error banner */
  clearError: () => set({ error: null }),
}))
