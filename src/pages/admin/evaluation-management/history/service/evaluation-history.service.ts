// ─── Evaluation History Service ───────────────────────────────────────────────
// All HTTP calls for the read-only Evaluation History feature.
// The shared apiClient attaches the Bearer token automatically.

import { apiClient } from "@/lib/api"
import type {
  EvaluationHistoryFilters,
  EvaluationHistoryListResponse,
  EvaluationHistoryDetailResponse,
  EvaluationHistoryAnalyticsResponse,
} from "../types/evaluation-history.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a URLSearchParams string from active filters, omitting empty values. */
function buildQuery(
  filters: Partial<EvaluationHistoryFilters>,
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated evaluation history with optional filters.
 * GET /admin/evaluation-history/getAll
 */
export async function getEvaluationHistory(
  filters: Partial<EvaluationHistoryFilters> = {},
): Promise<EvaluationHistoryListResponse> {
  return apiClient.get<EvaluationHistoryListResponse>(
    `/admin/evaluation-history/getAll${buildQuery(filters)}`,
  )
}

// ── Detail ────────────────────────────────────────────────────────────────────

/**
 * Fetch a single evaluation history entry with its full snapshot array.
 * GET /admin/evaluation-history/getById/{id}
 */
export async function getEvaluationHistoryById(
  id: number,
): Promise<EvaluationHistoryDetailResponse> {
  return apiClient.get<EvaluationHistoryDetailResponse>(
    `/admin/evaluation-history/getById/${id}`,
  )
}

// ── Analytics ─────────────────────────────────────────────────────────────────

/**
 * Fetch analytics aggregates (distribution, trends, top categories).
 * GET /admin/evaluation-history/analytics
 */
export async function getEvaluationHistoryAnalytics(
  filters: Partial<
    Pick<
      EvaluationHistoryFilters,
      "department_id" | "course_type" | "start_date" | "end_date"
    >
  > = {},
): Promise<EvaluationHistoryAnalyticsResponse> {
  return apiClient.get<EvaluationHistoryAnalyticsResponse>(
    `/admin/evaluation-history/analytics${buildQuery(filters)}`,
  )
}

// ── CSV Exports ───────────────────────────────────────────────────────────────

/**
 * Shared blob-download helper.
 * Makes a fetch with Accept: text/csv, reads the blob, creates an object URL,
 * and triggers a browser download.
 */
async function downloadCsv(
  path: string,
  filename: string,
): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
  const token = apiClient.getToken()
  const headers: Record<string, string> = {
    Accept: "text/csv",
    "Content-Type": "application/json",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${baseUrl}${path}`, { method: "GET", headers })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }))
    const err = new Error(
      (payload as { message?: string })?.message ??
        `Export failed with status ${res.status}`,
    ) as Error & { status: number }
    err.status = res.status
    throw err
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Download full evaluation history as CSV.
 * GET /admin/evaluation-history/export
 */
export async function exportEvaluationHistoryCsv(
  filters: Partial<EvaluationHistoryFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/evaluation-history/export${buildQuery(filters)}`,
    "evaluation-history.csv",
  )
}

/**
 * Download summary evaluation history as CSV.
 * GET /admin/evaluation-history/export-summary
 */
export async function exportEvaluationHistorySummaryCsv(
  filters: Partial<EvaluationHistoryFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/evaluation-history/export-summary${buildQuery(filters)}`,
    "evaluation-history-summary.csv",
  )
}
