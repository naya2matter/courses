// ─── useKpi Hook ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"
import { isApiError } from "@/lib/api"
import { getKpiOverview } from "../service/kpi.service"
import type { KpiFilters, KpiOverviewData } from "../types/kpi.types"

export const DEFAULT_KPI_FILTERS: KpiFilters = {
  date_from: "",
  date_to: "",
  department_id: "",
}

export interface UseKpiResult {
  overview: KpiOverviewData | null
  isLoading: boolean
  error: string | null
  filters: KpiFilters
  setFilters: (f: KpiFilters) => void
  refetch: () => void
}

export function useKpi(): UseKpiResult {
  const [filters, setFiltersState] = useState<KpiFilters>(DEFAULT_KPI_FILTERS)
  const [overview, setOverview] = useState<KpiOverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async (f: KpiFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      // Response is a flat object — NOT wrapped in { data: ... }
      const res = await getKpiOverview(f)
      setOverview(res ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to load KPI overview."
      if (isApiError(err)) msg = err.message ?? msg
      else if (err instanceof Error) msg = err.message
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview(filters)
  }, [filters, fetchOverview])

  function setFilters(f: KpiFilters) {
    setFiltersState(f)
  }

  function refetch() {
    fetchOverview(filters)
  }

  return { overview, isLoading, error, filters, setFilters, refetch }
}
