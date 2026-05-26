// ─── User Feedback Types ──────────────────────────────────────────────────────
// TypeScript shapes for the User Feedback feature (user-scoped endpoints).
//
// Note: the list/create responses do NOT include the nested `user` object;
// only getById returns it. The `user` field is therefore optional.

// ── Enum-like literals ────────────────────────────────────────────────────────

export type FeedbackStatus = "pending" | "under_review" | "approved" | "rejected"
export type FeedbackType =
  | "suggestion"
  | "improvement"
  | "feature_request"
  | "general"

// ── Embedded shapes (getById only) ────────────────────────────────────────────

export interface FeedbackDepartment {
  id: number
  name: string
}

export interface FeedbackUserInfo {
  id: number
  name: string
  department: FeedbackDepartment | null
}

// ── Primary resource shape ────────────────────────────────────────────────────

export interface UserFeedback {
  id: number
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  admin_response: string | null
  /** Present only in getById response */
  user?: FeedbackUserInfo
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

export interface UserFeedbackListResponse {
  data: UserFeedback[]
  meta: PaginationMeta
  links: PaginationLinks
}

export interface UserFeedbackDetailResponse {
  data: UserFeedback
}

// ── Request payload types ─────────────────────────────────────────────────────

/** Body for POST /user/feedback/create */
export interface CreateUserFeedbackPayload {
  type: FeedbackType
  title: string
  description: string
}

// ── Filter params ─────────────────────────────────────────────────────────────

export interface UserFeedbackFilters {
  status?: FeedbackStatus
  type?: FeedbackType
  page?: number
  per_page?: number
}
