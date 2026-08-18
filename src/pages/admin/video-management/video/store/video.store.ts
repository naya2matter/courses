// ─── Video Zustand Store ──────────────────────────────────────────────────────
// Single source of truth for the video list page.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  getVideos,
  createVideo as apiCreate,
  updateVideo as apiUpdate,
  deleteVideo as apiDelete,
  retryTranscode as apiRetryTranscode,
} from "../service/video.service"
import type {
  VideoState,
  VideoFilters,
  CreateVideoPayload,
  UpdateVideoPayload,
  VideoDetail,
} from "../types/video.types"

const DEFAULT_PER_PAGE = 15

export const useVideoStore = create<VideoState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  items: [],
  summaryCards: [],
  paginationMeta: null,
  isLoading: false,
  error: null,
  filters: { per_page: DEFAULT_PER_PAGE, page: 1 },

  // ── Actions ────────────────────────────────────────────────────────────────

  fetchVideos: async (overrides: VideoFilters = {}) => {
    const merged: VideoFilters = { ...get().filters, ...overrides }
    set({ isLoading: true, error: null, filters: merged })

    try {
      const result = await getVideos(merged)
      set({
        items: result.items,
        summaryCards: result.cards,
        paginationMeta: result.meta,
        isLoading: false,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load videos. Please try again."
      if (isApiError(err)) {
        message = err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }
      set({ isLoading: false, error: message })
    }
  },

  setFilters: (filters: VideoFilters) => {
    get().fetchVideos(filters)
  },

  createVideo: async (payload: CreateVideoPayload): Promise<VideoDetail> => {
    const created = await apiCreate(payload)
    await get().fetchVideos()
    return created
  },

  updateVideo: async (id: number, payload: UpdateVideoPayload): Promise<VideoDetail> => {
    const updated = await apiUpdate(id, payload)
    await get().fetchVideos()
    return updated
  },

  deleteVideo: async (id: number): Promise<void> => {
    await apiDelete(id)
    await get().fetchVideos()
  },

  retryTranscode: async (id: number): Promise<void> => {
    await apiRetryTranscode(id)
    await get().fetchVideos()
  },

  clearError: () => set({ error: null }),
}))
