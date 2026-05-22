// ─── Video Category Zustand Store ─────────────────────────────────────────────
// Single source of truth for the video categories list.
// Supports search, per-page, and pagination.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  getVideoCategories,
  createVideoCategory as apiCreate,
  updateVideoCategory as apiUpdate,
  deleteVideoCategory as apiDelete,
} from "../service/category.service"
import type {
  VideoCategory,
  VideoCategoryPayload,
  VideoCategoryState,
} from "../types/category.types"

const DEFAULT_PER_PAGE = 15

export const useVideoCategoryStore = create<VideoCategoryState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  items: [],
  summaryCards: [],
  paginationMeta: null,
  isLoading: false,
  error: null,
  search: "",
  page: 1,
  perPage: DEFAULT_PER_PAGE,

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch video categories.
   * Merges passed opts with current store state so callers can override
   * just the fields they care about.
   */
  fetchCategories: async (opts = {}) => {
    const { search: storeSearch, page: storePage, perPage: storePerPage } = get()

    const search = opts.search !== undefined ? opts.search : storeSearch
    const page = opts.page !== undefined ? opts.page : storePage
    const perPage = opts.perPage !== undefined ? opts.perPage : storePerPage

    // Persist overrides back to the store before fetching
    set({ isLoading: true, error: null, search, page, perPage })

    try {
      const result = await getVideoCategories({ search, page, per_page: perPage })
      set({
        items: result.items,
        summaryCards: result.cards,
        paginationMeta: result.meta,
        isLoading: false,
      })
    } catch (err) {
      // Silently ignore browser navigation cancellations
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load video categories. Please try again."
      if (isApiError(err)) {
        message = err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  /**
   * Create a new video category, then refresh the list.
   * Throws on error so the form sheet can surface validation messages.
   */
  createCategory: async (payload: VideoCategoryPayload): Promise<VideoCategory> => {
    const created = await apiCreate(payload)
    await get().fetchCategories()
    return created
  },

  /**
   * Update an existing video category by ID, then refresh the list.
   * Throws on error so the edit sheet can surface validation messages.
   */
  updateCategory: async (id: number, payload: VideoCategoryPayload): Promise<VideoCategory> => {
    const updated = await apiUpdate(id, payload)
    await get().fetchCategories()
    return updated
  },

  /**
   * Delete a video category by ID, then refresh the list.
   * Throws ApiError (status 422) if the category has linked videos —
   * the caller (delete dialog) must handle and display that message.
   */
  deleteCategory: async (id: number): Promise<void> => {
    await apiDelete(id)
    await get().fetchCategories()
  },

  /** Dismiss the top-level error banner */
  clearError: () => set({ error: null }),

  /** Update the search term and re-fetch from page 1 */
  setSearch: (search: string) => {
    get().fetchCategories({ search, page: 1 })
  },

  /** Navigate to a specific page */
  setPage: (page: number) => {
    get().fetchCategories({ page })
  },
}))
