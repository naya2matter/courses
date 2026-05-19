// ─── Attendance Service ───────────────────────────────────────────────────────
// Handles all HTTP requests for the Attendance (clocking records) feature.

import { apiClient } from "@/lib/api"
import type {
  AttendanceListFilters,
  AttendanceListResult,
  AttendanceSummaryCard,
  ClockingRecord,
  LaravelPaginated,
  UpdateAttendancePayload,
} from "../types/attendance.types"

// ── Internal types ────────────────────────────────────────────────────────────

type ListApiResponse =
  | AttendanceListResult
  | LaravelPaginated<ClockingRecord>
  | {
      data?: ClockingRecord[]
      meta?: LaravelPaginated<ClockingRecord>["meta"]
      links?: LaravelPaginated<ClockingRecord>["links"]
      cards?: AttendanceSummaryCard[]
    }
  | ClockingRecord[]

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuery(filters: AttendanceListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function normalizeClockingRecord(record: ClockingRecord): ClockingRecord {
  return {
    ...record,
    duration:
      record.duration ??
      record.duration_in_minutes ??
      null,
  }
}

function normalizeListResponse(response: ListApiResponse): AttendanceListResult {
  if (Array.isArray(response)) {
    return {
      data: response.map(normalizeClockingRecord),
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
      cards: [],
    }
  }

  const responseWithCards = response as { cards?: AttendanceSummaryCard[] }
  const cards = responseWithCards.cards ?? []

  return {
    data: Array.isArray(response.data)
      ? response.data.map(normalizeClockingRecord)
      : [],
    meta: response.meta ?? {
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: 15,
      to: null,
      total: 0,
      path: "",
    },
    links: response.links ?? { first: null, last: null, prev: null, next: null },
    cards: Array.isArray(cards) ? cards : [],
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /admin/attendance/getAll
 * Returns paginated list of clocking records.
 */
export async function getAllAttendance(
  filters: AttendanceListFilters = {},
): Promise<AttendanceListResult> {
  const query = buildQuery(filters)
  const response = await apiClient.get<ListApiResponse>(
    `/admin/attendance/getAll${query}`,
  )
  return normalizeListResponse(response)
}

/**
 * PUT /admin/attendance/update/{id}
 * Recalculates duration when clock_in / clock_out change.
 */
export async function updateAttendance(
  id: number,
  payload: UpdateAttendancePayload,
): Promise<ClockingRecord> {
  const response = await apiClient.put<{ data: ClockingRecord } | ClockingRecord>(
    `/admin/attendance/update/${id}`,
    payload,
  )
  // Unwrap Laravel resource envelope if present
  if (response && typeof response === "object" && "data" in response && !Array.isArray(response)) {
    return normalizeClockingRecord((response as { data: ClockingRecord }).data)
  }
  return normalizeClockingRecord(response as ClockingRecord)
}

/**
 * DELETE /admin/attendance/delete/{id}
 */
export async function deleteAttendance(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/attendance/delete/${id}`)
}
