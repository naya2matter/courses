// ─── User Clocking Service ────────────────────────────────────────────────────
// All HTTP calls for the user-facing clocking / attendance feature.

import { apiClient } from "@/lib/api"
import type {
  ClockInPayload,
  ClockOutPayload,
  ClockingHistoryResult,
  ClockingRecord,
  PaginationLinks,
  PaginationMeta,
  CourseSimple,
} from "../types/clocking.types"

// ── Internal helpers ──────────────────────────────────────────────────────────

type HistoryApiResponse =
  | ClockingHistoryResult
  | { data?: ClockingRecord[]; meta?: PaginationMeta; links?: PaginationLinks }
  | ClockingRecord[]

function unwrapRecord(res: { data?: ClockingRecord } | ClockingRecord): ClockingRecord {
  if (res && typeof res === "object" && "data" in res && res.data && typeof res.data === "object") {
    return (res as { data: ClockingRecord }).data
  }
  return res as ClockingRecord
}

function normalizeHistory(response: HistoryApiResponse): ClockingHistoryResult {
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        current_page: 1,
        from: response.length > 0 ? 1 : null,
        last_page: 1,
        per_page: response.length,
        to: response.length > 0 ? response.length : null,
        total: response.length,
        path: "",
      },
      links: { first: null, last: null, prev: null, next: null },
    }
  }
  return {
    data: Array.isArray(response.data) ? response.data : [],
    meta: response.meta ?? {
      current_page: 1, from: null, last_page: 1, per_page: 15,
      to: null, total: 0, path: "",
    },
    links: response.links ?? { first: null, last: null, prev: null, next: null },
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * POST /user/clocking/clockIn
 * Starts a new clocking session for the authenticated user.
 * course_id is optional.
 */
export async function clockIn(payload: ClockInPayload = {}): Promise<ClockingRecord> {
  const res = await apiClient.post<{ data?: ClockingRecord } | ClockingRecord>(
    "/user/clocking/clockIn",
    payload,
  )
  return unwrapRecord(res)
}

/**
 * POST /user/clocking/clockOut
 * Closes the authenticated user's open clocking session.
 */
export async function clockOut(payload: ClockOutPayload = {}): Promise<ClockingRecord> {
  const res = await apiClient.post<{ data?: ClockingRecord } | ClockingRecord>(
    "/user/clocking/clockOut",
    payload,
  )
  return unwrapRecord(res)
}

/**
 * GET /user/clocking/history
 * Returns the authenticated user's paginated clocking history.
 */
export async function getClockingHistory(
  page = 1,
  perPage = 15,
): Promise<ClockingHistoryResult> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  const res = await apiClient.get<HistoryApiResponse>(
    `/user/clocking/history?${params.toString()}`,
  )
  return normalizeHistory(res)
}

/**
 * GET /user/clocking/active
 * Returns the currently open clocking session, or null if none.
 */
export async function getActiveSession(): Promise<ClockingRecord | null> {
  try {
    const res = await apiClient.get<
      { data?: ClockingRecord | null } | ClockingRecord | null
    >("/user/clocking/active")

    if (res == null) return null
    if (typeof res === "object" && "data" in res) {
      return (res as { data: ClockingRecord | null }).data ?? null
    }
    return res as ClockingRecord
  } catch (err) {
    // 404 means no active session
    const apiErr = err as { status?: number }
    if (apiErr?.status === 404) return null
    throw err
  }
}

export async function getUserCourses(): Promise<CourseSimple[]> {
  const res = await apiClient.get<any>("/user/courses/my-enrollments")
  return res?.data ?? []
}
