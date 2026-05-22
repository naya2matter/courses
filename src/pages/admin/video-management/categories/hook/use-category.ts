// ─── useVideoCategory Hook ─────────────────────────────────────────────────────
// Convenience hook that triggers the initial data fetch on mount and exposes
// the Zustand store state so components don't need to import the store directly.

import { useEffect } from "react"
import { useVideoCategoryStore } from "../store/category.store"

/**
 * Use inside any component that needs the video categories list.
 *
 * Usage:
 *   const {
 *     items, summaryCards, isLoading, error, paginationMeta,
 *     search, page, perPage,
 *     clearError, fetchCategories, setSearch, setPage,
 *     createCategory, updateCategory, deleteCategory
 *   } = useVideoCategory()
 */
export function useVideoCategory() {
  const items = useVideoCategoryStore((s) => s.items)
  const summaryCards = useVideoCategoryStore((s) => s.summaryCards)
  const paginationMeta = useVideoCategoryStore((s) => s.paginationMeta)
  const isLoading = useVideoCategoryStore((s) => s.isLoading)
  const error = useVideoCategoryStore((s) => s.error)
  const search = useVideoCategoryStore((s) => s.search)
  const page = useVideoCategoryStore((s) => s.page)
  const perPage = useVideoCategoryStore((s) => s.perPage)
  const fetchCategories = useVideoCategoryStore((s) => s.fetchCategories)
  const createCategory = useVideoCategoryStore((s) => s.createCategory)
  const updateCategory = useVideoCategoryStore((s) => s.updateCategory)
  const deleteCategory = useVideoCategoryStore((s) => s.deleteCategory)
  const clearError = useVideoCategoryStore((s) => s.clearError)
  const setSearch = useVideoCategoryStore((s) => s.setSearch)
  const setPage = useVideoCategoryStore((s) => s.setPage)

  // Trigger the initial fetch when the hook is first mounted
  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  return {
    items,
    summaryCards,
    paginationMeta,
    isLoading,
    error,
    search,
    page,
    perPage,
    clearError,
    fetchCategories,
    setSearch,
    setPage,
    createCategory,
    updateCategory,
    deleteCategory,
    /** Alias for a no-arg refetch using current store params */
    refetch: () => fetchCategories(),
  }
}
