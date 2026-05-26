// ─── Resend Login Links — Hook ────────────────────────────────────────────────

import { useEffect } from "react"
import { useResendLinksStore } from "../store/resend-links.store"

export function useResendLinks() {
  const store = useResendLinksStore()

  useEffect(() => {
    store.fetchExpiredLinks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items: store.items,
    meta: store.meta,
    links: store.links,
    isLoading: store.isLoading,
    error: store.error,
    filters: store.filters,
    fetchExpiredLinks: store.fetchExpiredLinks,
    setFilters: store.setFilters,
    clearError: store.clearError,
    refetch: () => store.fetchExpiredLinks(store.filters.page),
  }
}
