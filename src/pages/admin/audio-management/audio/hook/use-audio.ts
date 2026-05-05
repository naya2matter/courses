// ─── useAudio Hook ────────────────────────────────────────────────────────────
// Convenience hook that triggers the initial data fetch on mount and exposes
// the Zustand store state so components don't need to import the store directly.

import { useEffect } from "react"
import { useAudioStore } from "../store/audio.store"

/**
 * Use inside any component that needs the audio list.
 *
 * Usage:
 *   const { items, meta, isLoading, error, clearError, fetchAudio, setFilters } = useAudio()
 */
export function useAudio() {
  const items = useAudioStore((s) => s.items)
  const meta = useAudioStore((s) => s.meta)
  const isLoading = useAudioStore((s) => s.isLoading)
  const error = useAudioStore((s) => s.error)
  const filters = useAudioStore((s) => s.filters)
  const fetchAudio = useAudioStore((s) => s.fetchAudio)
  const setFilters = useAudioStore((s) => s.setFilters)
  const clearError = useAudioStore((s) => s.clearError)

  // Trigger the initial fetch when the hook is first mounted
  useEffect(() => {
    fetchAudio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  return {
    items,
    meta,
    isLoading,
    error,
    filters,
    fetchAudio,
    setFilters,
    clearError,
    /** Alias for a no-arg refetch with the current filters */
    refetch: () => fetchAudio(),
  }
}
