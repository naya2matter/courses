// ─── useCourse Hook ──────────────────────────────────────────────────────────
// React hook for accessing course state and actions

import { useEffect } from "react"
import { useCourseStore } from "../store/course.store"

/**
 * Hook to access course store with automatic initial fetch
 * Fetches courses on mount if the list is empty
 * @returns All course store state and actions
 */
export function useCourse() {
  const store = useCourseStore()

  // Auto-fetch courses on mount if list is empty
  useEffect(() => {
    if (store.items.length === 0 && !store.isLoading) {
      store.fetchCourses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return store
}
