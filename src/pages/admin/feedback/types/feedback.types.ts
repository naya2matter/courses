// ─── Feedback Types ───────────────────────────────────────────────────────────
// Defines all TypeScript shapes for the Admin Feedback feature.
//   • API response types (list + single resource)
//   • Request payload types (respond / status update)
//   • Filter params used when fetching the list
//   • Standard Laravel pagination envelope

// ── Enum-like literals ────────────────────────────────────────────────────────

export type FeedbackStatus = "pending" | "under_review" | "approved" | "rejected"
export type FeedbackType =
  | "suggestion"
  | "improvement"
  | "feature_request"
  | "general"

// ── Embedded shapes ───────────────────────────────────────────────────────────

export interface FeedbackDepartment {
  id: number
  name: string
}

export interface FeedbackUser {
  id: number
  name: string
  department: FeedbackDepartment | null
}

// ── Primary resource shape ────────────────────────────────────────────────────

export interface Feedback {
  id: number
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  admin_response: string | null
  user: FeedbackUser | null
  created_at: string
}

// ── Laravel paginated envelope ────────────────────────────────────────────────

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

/** Paginated list response for GET /admin/feedback/getAll */
export interface FeedbackListResponse {
  data: Feedback[]
  meta: PaginationMeta
  links: PaginationLinks
}

/** Single resource response for GET /admin/feedback/getById/{id} */
export interface FeedbackDetailResponse {
  data: Feedback
}

// ── Request payload types ─────────────────────────────────────────────────────

/** Body for PUT /admin/feedback/respond/{id} */
export interface RespondFeedbackPayload {
  admin_response: string
  status: FeedbackStatus
}

/** Body for PUT /admin/feedback/status/{id} */
export interface UpdateFeedbackStatusPayload {
  status: FeedbackStatus
}

// ── Filter params ─────────────────────────────────────────────────────────────

export interface FeedbackFilters {
  status?: FeedbackStatus
  type?: FeedbackType
  user_id?: number
  search?: string
  page?: number
  per_page?: number
}

// ── Error types ───────────────────────────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}
