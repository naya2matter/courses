// ─── Audio Zustand Store ──────────────────────────────────────────────────────
// Single source of truth for the audio list data.
// Components read state and dispatch actions through this store.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getAllAudio } from "../service/audio.service"
import type { AudioListFilters, AudioState } from "../types/audio.types"

/** Default number of items per page on the initial fetch */
const DEFAULT_PER_PAGE = 15

export const useAudioStore = create<AudioState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  items: [],
  meta: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch the audio list from the API.
   * If new filters are passed they are merged with the current ones, so callers
   * only need to supply changed fields (e.g. just { page: 2 }).
   *
   * AbortError (caused by navigating away mid-request) is silently ignored
   * because it is not a real error.
   */
  fetchAudio: async (filters?: AudioListFilters) => {
    // Merge incoming filters with stored filters
    const mergedFilters: AudioListFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters

    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getAllAudio(mergedFilters)
      set({
        items: response.data,
        meta: response.meta,
        isLoading: false,
      })
    } catch (err) {
      // Silently ignore request cancellation — not a real error
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      // Derive a human-readable message from the error
      let message = "Failed to load audio items. Please try again."
      if (isApiError(err)) {
        message = err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  /**
   * Apply new filter values and immediately re-fetch from page 1.
   * Always resets to page 1 so the user doesn't land on a non-existent page.
   */
  setFilters: (filters: AudioListFilters) => {
    const next = { ...get().filters, ...filters, page: 1 }
    set({ filters: next })
    get().fetchAudio(next)
  },

  /** Dismiss the error banner (e.g. when the user clicks the X button) */
  clearError: () => set({ error: null }),
}))
