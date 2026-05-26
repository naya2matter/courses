// ─── useBlogPosts Hook ────────────────────────────────────────────────────────
// Triggers the initial fetch on mount and exposes Zustand store state.

import { useEffect } from "react"
import { useBlogStore } from "../store/blog.store"

export function useBlogPosts() {
  const items = useBlogStore((s) => s.items)
  const meta = useBlogStore((s) => s.meta)
  const links = useBlogStore((s) => s.links)
  const isLoading = useBlogStore((s) => s.isLoading)
  const error = useBlogStore((s) => s.error)
  const filters = useBlogStore((s) => s.filters)
  const fetchBlogPosts = useBlogStore((s) => s.fetchBlogPosts)
  const setFilters = useBlogStore((s) => s.setFilters)
  const clearError = useBlogStore((s) => s.clearError)

  useEffect(() => {
    fetchBlogPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items,
    meta,
    links,
    isLoading,
    error,
    filters,
    fetchBlogPosts,
    setFilters,
    clearError,
    refetch: () => fetchBlogPosts(),
  }
}
