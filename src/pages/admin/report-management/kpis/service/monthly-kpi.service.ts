// ─── Monthly KPI Service ──────────────────────────────────────────────────────

import { apiClient } from "@/lib/api"
import type {
  MonthlyKpiFilters,
  MonthlyKpiData,
  MonthlyKpiResponse,
  MonthlyComparison,
  MonthlyComparisonResponse,
} from "../types/monthly-kpi.types"

function buildQuery(filters: Partial<MonthlyKpiFilters>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/** GET /admin/reporting/kpi/monthly — overview + department breakdown. */
export async function getMonthlyKpi(
  filters: Partial<MonthlyKpiFilters> = {},
): Promise<MonthlyKpiData> {
  const res = await apiClient.get<MonthlyKpiResponse>(
    `/admin/reporting/kpi/monthly${buildQuery(filters)}`,
  )
  return res.data
}

/** GET /admin/reporting/kpi/monthly-comparison — this month vs last month. */
export async function getMonthlyComparison(
  filters: Partial<MonthlyKpiFilters> = {},
): Promise<MonthlyComparison> {
  const res = await apiClient.get<MonthlyComparisonResponse>(
    `/admin/reporting/kpi/monthly-comparison${buildQuery(filters)}`,
  )
  return res.data
}
