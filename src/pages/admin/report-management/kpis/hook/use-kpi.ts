// ─── useKpi Hook ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"
import { isApiError } from "@/lib/api"
import { getKpiOverview, getKpiTrends } from "../service/kpi.service"
import type { KpiFilters, KpiOverviewData, KpiTrendPoint } from "../types/kpi.types"

export const DEFAULT_KPI_FILTERS: KpiFilters = {
  date_from: "",
  date_to: "",
  department_id: "",
  course_online_id: "",
}

export interface UseKpiResult {
  overview: KpiOverviewData | null
  overviewLoading: boolean
  overviewError: string | null

  trends: KpiTrendPoint[]
  trendsLoading: boolean
  trendsError: string | null

  filters: KpiFilters
  setFilters: (f: KpiFilters) => void
  refetch: () => void
}

export function useKpi(): UseKpiResult {
  const [filters, setFiltersState] = useState<KpiFilters>(DEFAULT_KPI_FILTERS)

  const [overview, setOverview] = useState<KpiOverviewData | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  const [trends, setTrends] = useState<KpiTrendPoint[]>([])
  const [trendsLoading, setTrendsLoading] = useState(true)
  const [trendsError, setTrendsError] = useState<string | null>(null)

  const fetchOverview = useCallback(async (f: KpiFilters) => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const res = await getKpiOverview(f)
      setOverview(res.data ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to load KPI overview."
      if (isApiError(err)) msg = err.message ?? msg
      else if (err instanceof Error) msg = err.message
      setOverviewError(msg)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  const fetchTrends = useCallback(async (f: KpiFilters) => {
    setTrendsLoading(true)
    setTrendsError(null)
    try {
      const res = await getKpiTrends(f)
      setTrends(res.data ?? [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to load KPI trends."
      if (isApiError(err)) msg = err.message ?? msg
      else if (err instanceof Error) msg = err.message
      setTrendsError(msg)
    } finally {
      setTrendsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview(filters)
    fetchTrends(filters)
  }, [filters, fetchOverview, fetchTrends])

  function setFilters(f: KpiFilters) {
    setFiltersState(f)
  }

  function refetch() {
    fetchOverview(filters)
    fetchTrends(filters)
  }

  return {
    overview,
    overviewLoading,
    overviewError,
    trends,
    trendsLoading,
    trendsError,
    filters,
    setFilters,
    refetch,
  }
}
