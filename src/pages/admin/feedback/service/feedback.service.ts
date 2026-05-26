// ─── Feedback Service ─────────────────────────────────────────────────────────
// Handles all HTTP requests for the Admin Feedback feature.
// The shared apiClient automatically attaches the Bearer token from localStorage.
//
// Error handling:
//   • 401 Unauthenticated — the ApiClient throws with err.status === 401
//   • 422 Validation — thrown with err.status === 422 and err.data typed as
//     ApiValidationError; callers can cast err.data to surface field errors.
//   • Aborted requests — silently swallowed when isCanceledError is true.

import { apiClient } from "@/lib/api"
import type {
  Feedback,
  FeedbackDetailResponse,
  FeedbackFilters,
  FeedbackListResponse,
  RespondFeedbackPayload,
  UpdateFeedbackStatusPayload,
} from "../types/feedback.types"

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildQuery(filters: FeedbackFilters): string {
  const params = new URLSearchParams()

  if (filters.status) params.set("status", filters.status)
  if (filters.type) params.set("type", filters.type)
  if (filters.user_id != null) params.set("user_id", String(filters.user_id))
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

// ── Service functions ─────────────────────────────────────────────────────────

const EMPTY_LIST: FeedbackListResponse = {
  data: [],
  meta: {
    current_page: 1,
    from: null,
    last_page: 1,
    per_page: 15,
    to: null,
    total: 0,
    path: "",
  },
  links: { first: null, last: null, prev: null, next: null },
}

/**
 * Fetch a paginated list of feedback entries.
 * Endpoint: GET /admin/feedback/getAll
 */
export async function getFeedbackList(
  filters: FeedbackFilters = {},
): Promise<FeedbackListResponse> {
  try {
    const query = buildQuery(filters)
    return await apiClient.get<FeedbackListResponse>(
      `/admin/feedback/getAll${query}`,
    )
  } catch (err) {
    if (isCanceledError(err)) return EMPTY_LIST
    throw err
  }
}

/**
 * Fetch a single feedback entry by its ID.
 * Endpoint: GET /admin/feedback/getById/{id}
 */
export async function getFeedbackById(id: number): Promise<Feedback> {
  const res = await apiClient.get<FeedbackDetailResponse>(
    `/admin/feedback/getById/${id}`,
  )
  return res.data
}

/**
 * Respond to feedback and update its status.
 * Endpoint: PUT /admin/feedback/respond/{id}
 */
export async function respondToFeedback(
  id: number,
  payload: RespondFeedbackPayload,
): Promise<Feedback> {
  const res = await apiClient.put<FeedbackDetailResponse>(
    `/admin/feedback/respond/${id}`,
    payload,
  )
  return res.data
}

/**
 * Update only the status of a feedback entry.
 * Endpoint: PUT /admin/feedback/status/{id}
 */
export async function updateFeedbackStatus(
  id: number,
  payload: UpdateFeedbackStatusPayload,
): Promise<Feedback> {
  const res = await apiClient.put<FeedbackDetailResponse>(
    `/admin/feedback/status/${id}`,
    payload,
  )
  return res.data
}
