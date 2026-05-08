// ─── useCategory Hook ──────────────────────────────────────────────────────────
// Convenience hook that triggers the initial data fetch on mount and exposes
// the Zustand store state so components don't need to import the store directly.

import { useEffect } from "react"
import { useCategoryStore } from "../store/category.store"

/**
 * Use inside any component that needs the audio categories list.
 *
 * Usage:
 *   const {
 *     items, isLoading, error, clearError,
 *     fetchCategories, createCategory, updateCategory, deleteCategory
 *   } = useCategory()
 */
export function useCategory() {
  const items = useCategoryStore((s) => s.items)
  const summaryCards = useCategoryStore((s) => s.summaryCards)
  const isLoading = useCategoryStore((s) => s.isLoading)
  const error = useCategoryStore((s) => s.error)
  const fetchCategories = useCategoryStore((s) => s.fetchCategories)
  const createCategory = useCategoryStore((s) => s.createCategory)
  const updateCategory = useCategoryStore((s) => s.updateCategory)
  const deleteCategory = useCategoryStore((s) => s.deleteCategory)
  const clearError = useCategoryStore((s) => s.clearError)

  // Trigger the initial fetch when the hook is first mounted
  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  return {
    items,
    summaryCards,
    isLoading,
    error,
    clearError,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    /** Alias for a no-arg refetch */
    refetch: () => fetchCategories(),
  }
}
