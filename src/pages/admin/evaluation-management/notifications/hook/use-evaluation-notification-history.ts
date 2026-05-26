// ─── useEvaluationNotificationHistory Hook ────────────────────────────────────
// Fetches and manages the paginated notification history list.
// Client-side filtering (search, status) is applied on the fetched page.

import { useState, useEffect, useCallback, useMemo } from "react"
import { isApiError } from "@/lib/api"
import { getEvaluationNotificationHistory } from "../service/evaluation-notification.service"
import type {
  EvaluationNotificationHistoryItem,
  EvaluationNotificationFilters,
  PaginationMeta,
  PaginationLinks,
} from "../types/evaluation-notification.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: EvaluationNotificationFilters = {
  search: "",
  status: "",
  page: 1,
  per_page: 15,
}

/** Derives a status string from success/failed counts. */
export function deriveStatus(item: EvaluationNotificationHistoryItem): string {
  if (item.status) return item.status
  const success = item.success_count ?? 0
  const failed = item.failed_count ?? 0
  if (success === 0 && failed > 0) return "failed"
  if (success > 0 && failed > 0) return "partial"
  if (success > 0 && failed === 0) return "sent"
  return "unknown"
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseEvaluationNotificationHistoryResult {
  allItems: EvaluationNotificationHistoryItem[]
  filteredItems: EvaluationNotificationHistoryItem[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  isLoading: boolean
  error: string | null
  filters: EvaluationNotificationFilters
  setFilters: (f: EvaluationNotificationFilters) => void
  setPage: (page: number) => void
  refetch: () => void
  clearError: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEvaluationNotificationHistory(): UseEvaluationNotificationHistoryResult {
  const [filters, setFiltersState] = useState<EvaluationNotificationFilters>(DEFAULT_FILTERS)

  const [allItems, setAllItems] = useState<EvaluationNotificationHistoryItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [links, setLinks] = useState<PaginationLinks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async (page: number, per_page: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getEvaluationNotificationHistory({ page, per_page })
      setAllItems(res.data ?? [])
      setMeta(res.meta ?? null)
      setLinks(res.links ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsLoading(false)
        return
      }
      let message = "Failed to load notification history."
      if (isApiError(err)) {
        if (err.status === 401) message = "You are not authenticated."
        else message = err.message ?? message
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(filters.page, filters.per_page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.per_page])

  // ── Client-side filter: search + status ───────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = allItems
    const term = filters.search.trim().toLowerCase()
    if (term) {
      result = result.filter(
        (item) =>
          item.subject.toLowerCase().includes(term) ||
          (item.message ?? "").toLowerCase().includes(term) ||
          (item.sent_to ?? []).some(
            (m) =>
              m.email.toLowerCase().includes(term) ||
              (m.name ?? "").toLowerCase().includes(term),
          ) ||
          (item.managers ?? []).some(
            (m) =>
              m.email.toLowerCase().includes(term) ||
              m.name.toLowerCase().includes(term),
          ) ||
          (item.employees ?? []).some(
            (e) =>
              e.email.toLowerCase().includes(term) ||
              e.name.toLowerCase().includes(term),
          ),
      )
    }
    if (filters.status) {
      result = result.filter((item) => deriveStatus(item) === filters.status)
    }
    return result
  }, [allItems, filters.search, filters.status])

  function setFilters(f: EvaluationNotificationFilters) {
    setFiltersState(f)
  }

  function setPage(page: number) {
    setFiltersState((prev) => ({ ...prev, page }))
  }

  return {
    allItems,
    filteredItems,
    meta,
    links,
    isLoading,
    error,
    filters,
    setFilters,
    setPage,
    refetch: () => fetchHistory(filters.page, filters.per_page),
    clearError: () => setError(null),
  }
}
