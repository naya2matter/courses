// ─── useMonthlyKpi Hook ───────────────────────────────────────────────────────
// Holds the shared filter state (year/month/department) and fetches both the
// monthly overview and the month-over-month comparison. The two live on separate
// tabs but share one filter bar.

import { useState, useEffect, useCallback } from "react"
import { isApiError } from "@/lib/api"
import { getMonthlyKpi, getMonthlyComparison } from "../service/monthly-kpi.service"
import type {
  MonthlyKpiFilters,
  MonthlyKpiData,
  MonthlyComparison,
} from "../types/monthly-kpi.types"

export const DEFAULT_MONTHLY_FILTERS: MonthlyKpiFilters = {
  year: "",
  month: "",
  department_id: "",
}

export interface UseMonthlyKpiResult {
  monthly: MonthlyKpiData | null
  comparison: MonthlyComparison | null
  isLoading: boolean
  error: string | null
  filters: MonthlyKpiFilters
  setFilters: (f: MonthlyKpiFilters) => void
  refetch: () => void
}

function toMessage(err: unknown, fallback: string): string {
  if (isApiError(err)) return err.message ?? fallback
  if (err instanceof Error) return err.message
  return fallback
}

export function useMonthlyKpi(): UseMonthlyKpiResult {
  const [filters, setFiltersState] = useState<MonthlyKpiFilters>(DEFAULT_MONTHLY_FILTERS)
  const [monthly, setMonthly] = useState<MonthlyKpiData | null>(null)
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async (f: MonthlyKpiFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const [monthlyRes, comparisonRes] = await Promise.all([
        getMonthlyKpi(f),
        getMonthlyComparison(f),
      ])
      setMonthly(monthlyRes ?? null)
      setComparison(comparisonRes ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(toMessage(err, "Failed to load monthly KPI data."))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll(filters)
  }, [filters, fetchAll])

  return {
    monthly,
    comparison,
    isLoading,
    error,
    filters,
    setFilters: setFiltersState,
    refetch: () => fetchAll(filters),
  }
}
