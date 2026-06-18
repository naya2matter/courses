// ─── KPI Reporting Service ────────────────────────────────────────────────────

import { apiClient } from "@/lib/api"
import { downloadCsv, buildExportQuery } from "../../shared/download-csv"
import type { KpiFilters, KpiOverviewResponse } from "../types/kpi.types"

function buildQuery(filters: Partial<KpiFilters>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export async function getKpiOverview(
  filters: Partial<KpiFilters> = {},
): Promise<KpiOverviewResponse> {
  return apiClient.get<KpiOverviewResponse>(
    `/admin/reporting/kpi/overview${buildQuery(filters)}`,
  )
}

export async function exportKpiOverviewCsv(
  filters: Partial<KpiFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/reporting/export/kpi-overview${buildExportQuery(filters as Record<string, unknown>)}`,
    "kpi-overview.csv",
  )
}
