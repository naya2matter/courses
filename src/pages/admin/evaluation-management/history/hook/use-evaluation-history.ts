// ─── useEvaluationHistory Hook ────────────────────────────────────────────────
// Manages server-side filtered + paginated history list and analytics.
// Analytics refetch whenever analytically-relevant filters change.

import { useState, useEffect, useCallback, useRef } from "react"
import { isApiError } from "@/lib/api"
import {
  getEvaluationHistory,
  getEvaluationHistoryAnalytics,
} from "../service/evaluation-history.service"
import type {
  EvaluationHistoryEntry,
  EvaluationHistoryAnalytics,
  EvaluationHistoryFilters,
  PaginationMeta,
  PaginationLinks,
} from "../types/evaluation-history.types"

// ── Default filters ───────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: EvaluationHistoryFilters = {
  department_id: "",
  user_id: "",
  course_type: "",
  performance_level: "",
  start_date: "",
  end_date: "",
  page: 1,
  per_page: 15,
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseEvaluationHistoryResult {
  entries: EvaluationHistoryEntry[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  isLoading: boolean
  error: string | null

  analytics: EvaluationHistoryAnalytics | null
  analyticsLoading: boolean
  analyticsError: string | null

  filters: EvaluationHistoryFilters
  setFilters: (filters: EvaluationHistoryFilters) => void
  setPage: (page: number) => void
  refetch: () => void
  refetchAnalytics: () => void
  clearError: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEvaluationHistory(): UseEvaluationHistoryResult {
  const [filters, setFiltersState] = useState<EvaluationHistoryFilters>(DEFAULT_FILTERS)

  const [entries, setEntries] = useState<EvaluationHistoryEntry[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [links, setLinks] = useState<PaginationLinks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [analytics, setAnalytics] = useState<EvaluationHistoryAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // ── Fetch history list ─────────────────────────────────────────────────────

  const fetchList = useCallback(async (f: EvaluationHistoryFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getEvaluationHistory(f)
      setEntries(res.data ?? [])
      setMeta(res.meta ?? null)
      setLinks(res.links ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsLoading(false)
        return
      }
      let message = "Failed to load evaluation history. Please try again."
      if (isApiError(err)) {
        if (err.status === 401) message = "You are not authenticated."
        else if (err.status === 422) message = err.data?.message ?? message
        else message = err.message ?? message
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Fetch analytics ───────────────────────────────────────────────────────

  const fetchAnalytics = useCallback(
    async (
      f: Pick<
        EvaluationHistoryFilters,
        "department_id" | "course_type" | "start_date" | "end_date"
      >,
    ) => {
      setAnalyticsLoading(true)
      setAnalyticsError(null)
      try {
        const res = await getEvaluationHistoryAnalytics(f)
        setAnalytics(res.data ?? null)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setAnalyticsLoading(false)
          return
        }
        let message = "Failed to load analytics."
        if (isApiError(err)) message = err.message ?? message
        else if (err instanceof Error) message = err.message
        setAnalyticsError(message)
      } finally {
        setAnalyticsLoading(false)
      }
    },
    [],
  )

  // ── Initial load + re-fetch when filters change ───────────────────────────

  const isFirstRender = useRef(true)

  useEffect(() => {
    fetchList(filters)
    // Only refetch analytics when analytically-relevant filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    fetchAnalytics({
      department_id: filters.department_id,
      course_type: filters.course_type,
      start_date: filters.start_date,
      end_date: filters.end_date,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.department_id,
    filters.course_type,
    filters.start_date,
    filters.end_date,
  ])

  useEffect(() => {
    isFirstRender.current = false
  }, [])

  // ── Setters ───────────────────────────────────────────────────────────────

  function setFilters(newFilters: EvaluationHistoryFilters) {
    setFiltersState(newFilters)
  }

  function setPage(page: number) {
    setFiltersState((prev) => ({ ...prev, page }))
  }

  function refetch() {
    fetchList(filters)
  }

  function refetchAnalytics() {
    fetchAnalytics({
      department_id: filters.department_id,
      course_type: filters.course_type,
      start_date: filters.start_date,
      end_date: filters.end_date,
    })
  }

  return {
    entries,
    meta,
    links,
    isLoading,
    error,
    analytics,
    analyticsLoading,
    analyticsError,
    filters,
    setFilters,
    setPage,
    refetch,
    refetchAnalytics,
    clearError: () => setError(null),
  }
}
