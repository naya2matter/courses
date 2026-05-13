// ─── Attendance Types ─────────────────────────────────────────────────────────
// Central place for all attendance / clocking-record TypeScript types.

// ── Resource ─────────────────────────────────────────────────────────────────

export interface AttendanceUserRef {
  id: number
  name: string
  email: string
}

export interface AttendanceCourseRef {
  id: number
  name: string
}

/**
 * A single clocking record returned by the API.
 */
export interface ClockingRecord {
  id: number
  clock_in: string | null       // ISO 8601 datetime
  clock_out: string | null      // ISO 8601 datetime
  duration: number | null       // in minutes
  comment: string | null
  rating: number | null         // 1–5
  user?: AttendanceUserRef | null
  course?: AttendanceCourseRef | null
  created_at?: string | null
  updated_at?: string | null
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface LaravelPaginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface AttendanceListFilters {
  page?: number
  per_page?: number
  search?: string
}

// ── List result ───────────────────────────────────────────────────────────────

export interface AttendanceSummaryCard {
  key: string
  title: string
  value: number | string
}

export interface AttendanceListResult {
  data: ClockingRecord[]
  meta: PaginationMeta
  links: PaginationLinks
  cards: AttendanceSummaryCard[]
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface UpdateAttendancePayload {
  clock_in?: string | null     // RFC 3339, e.g. "2017-07-21T17:32:28Z"
  clock_out?: string | null    // RFC 3339
  comment?: string | null      // max 1000 chars
  rating?: number | null       // 1–5
}
