// ─── User Clocking Types ──────────────────────────────────────────────────────

export interface ClockingCourseRef {
  id: number
  name: string
}

export interface ClockingUserRef {
  id: number
  name: string
  email: string
}

export interface CourseSimple {
  id: number
  title?: string
  name?: string
}

/**
 * A clocking record returned by the API (ClockingResource).
 */
export interface ClockingRecord {
  id: number
  clock_in: string | null   // ISO 8601
  clock_out: string | null  // ISO 8601, null while session is open
  duration: number | null   // minutes
  comment: string | null
  rating: number | null     // 1–5
  user?: ClockingUserRef | null
  course?: ClockingCourseRef | null
  created_at?: string | null
  updated_at?: string | null
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface ClockInPayload {
  course_id?: number | null
}

export interface ClockOutPayload {
  comment?: string | null  // max 1000
  rating?: number          // 1–5
}

// ── History ───────────────────────────────────────────────────────────────────

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

export interface ClockingHistoryResult {
  data: ClockingRecord[]
  meta: PaginationMeta
  links: PaginationLinks
}
