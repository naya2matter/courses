// ─── Bug Report Service ───────────────────────────────────────────────────────
// Handles all HTTP requests for the Admin Bug Reports feature.
// The shared apiClient automatically attaches the Bearer token from localStorage.
//
// Error handling:
//   • 401 Unauthenticated — the ApiClient throws with err.status === 401;
//     callers / global error boundaries should redirect to login.
//   • 422 Validation — thrown with err.status === 422 and err.data typed as
//     ApiValidationError; callers can cast err.data to surface field errors.
//   • Aborted requests — if the caller cancels the fetch via AbortController,
//     the resulting AbortError is filtered out so stale-state updates are
//     skipped. Pass the signal through if you need cancellation.

import { apiClient, isApiError } from "@/lib/api"
import type {
  AssignBugReportPayload,
  BugReport,
  BugReportDetailResponse,
  BugReportFilters,
  BugReportListResponse,
  CreateBugReportPayload,
  UpdateBugReportPayload,
} from "../types/bug-report.types"

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Build a URLSearchParams-based query string from a BugReportFilters object.
 * Only includes params that have actual values (skips undefined / null / "").
 */
function buildQuery(filters: BugReportFilters): string {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set("status", filters.status)
  }
  if (filters.priority) {
    params.set("priority", filters.priority)
  }
  if (filters.assigned_to != null) {
    params.set("assigned_to", String(filters.assigned_to))
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim())
  }
  if (filters.sort) {
    params.set("sort", filters.sort)
  }
  if (filters.direction) {
    params.set("direction", filters.direction)
  }
  if (filters.date_from) {
    params.set("date_from", filters.date_from)
  }
  if (filters.date_to) {
    params.set("date_to", filters.date_to)
  }
  if (filters.page != null) {
    params.set("page", String(filters.page))
  }
  if (filters.per_page != null) {
    params.set("per_page", String(filters.per_page))
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Returns true when an error represents a fetch cancellation (AbortError).
 * Canceled requests should be silently ignored by callers.
 */
function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of bug reports.
 * Endpoint: GET /admin/bug-reports/getAll
 *
 * Throws on 401 (unauthenticated) and 422 (validation); re-throws everything
 * else except AbortError (silently swallowed).
 */
export async function getBugReports(
  filters: BugReportFilters = {},
): Promise<BugReportListResponse> {
  try {
    const query = buildQuery(filters)
    return await apiClient.get<BugReportListResponse>(
      `/admin/bug-reports/getAll${query}`,
    )
  } catch (err) {
    if (isCanceledError(err)) return { data: [], meta: { current_page: 1, from: null, last_page: 1, per_page: 15, to: null, total: 0, path: "" }, links: { first: null, last: null, prev: null, next: null } }
    throw err
  }
}

/**
 * Fetch a single bug report by its ID.
 * Endpoint: GET /admin/bug-reports/getById/{id}
 *
 * Returns the inner `data` object (unwrapped from the Laravel envelope).
 */
export async function getBugReportById(id: number): Promise<BugReport> {
  const res = await apiClient.get<BugReportDetailResponse>(
    `/admin/bug-reports/getById/${id}`,
  )
  return res.data
}

/**
 * Create a new bug report.
 * Endpoint: POST /admin/bug-reports/create
 *
 * Returns the newly created BugReport (unwrapped from the Laravel envelope).
 * Throws with status 422 when the backend returns validation errors.
 */
export async function createBugReport(
  payload: CreateBugReportPayload,
): Promise<BugReport> {
  const res = await apiClient.post<BugReportDetailResponse>(
    "/admin/bug-reports/create",
    payload,
  )
  return res.data
}

/**
 * Update an existing bug report's fields (title, description, priority, status, etc.).
 * Endpoint: PUT /admin/bug-reports/update/{id}
 *
 * Returns the updated BugReport (unwrapped from the Laravel envelope).
 */
export async function updateBugReport(
  id: number,
  payload: UpdateBugReportPayload,
): Promise<BugReport> {
  const res = await apiClient.put<BugReportDetailResponse>(
    `/admin/bug-reports/update/${id}`,
    payload,
  )
  return res.data
}

/**
 * Assign a bug report to an admin user.
 * Endpoint: PUT /admin/bug-reports/assign/{id}
 *
 * `assigned_to` must be the ID of a user with role `admin`.
 * Returns the updated BugReport (unwrapped from the Laravel envelope).
 */
export async function assignBugReport(
  id: number,
  assigned_to: number,
): Promise<BugReport> {
  const body: AssignBugReportPayload = { assigned_to }
  const res = await apiClient.put<BugReportDetailResponse>(
    `/admin/bug-reports/assign/${id}`,
    body,
  )
  return res.data
}

/**
 * Mark a bug report as resolved.
 * Endpoint: PUT /admin/bug-reports/resolve/{id}  (no request body)
 *
 * Sets status → "resolved" and fills resolved_at on the backend.
 * Returns the updated BugReport (unwrapped from the Laravel envelope).
 */
export async function resolveBugReport(id: number): Promise<BugReport> {
  const res = await apiClient.put<BugReportDetailResponse>(
    `/admin/bug-reports/resolve/${id}`,
  )
  return res.data
}

/**
 * Permanently delete a bug report.
 * Endpoint: DELETE /admin/bug-reports/delete/{id}
 */
export async function deleteBugReport(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/bug-reports/delete/${id}`)
}

// ── Error type guard (re-exported for consumer convenience) ───────────────────
export { isApiError, isCanceledError }
