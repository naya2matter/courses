// ─── Reporting Refresh Service ────────────────────────────────────────────────

import { apiClient } from "@/lib/api"
import type { RefreshLogEntry, RefreshResult } from "../types/refresh.types"

export async function triggerDailyRefresh(): Promise<RefreshResult> {
  return apiClient.post<RefreshResult>("/admin/reporting/refresh/daily", {})
}

export async function triggerRangeRefresh(
  date_from: string,
  date_to: string,
): Promise<RefreshResult> {
  return apiClient.post<RefreshResult>("/admin/reporting/refresh/range", {
    date_from,
    date_to,
  })
}

export async function triggerFullRefresh(): Promise<RefreshResult> {
  return apiClient.post<RefreshResult>("/admin/reporting/refresh/full", {})
}

// Returns a plain array (not paginated) — backend uses ?limit=N
export async function getRefreshLog(limit = 50): Promise<RefreshLogEntry[]> {
  return apiClient.get<RefreshLogEntry[]>(
    `/admin/reporting/refresh/log?limit=${limit}`,
  )
}
