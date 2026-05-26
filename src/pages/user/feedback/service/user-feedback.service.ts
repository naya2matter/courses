// ─── User Feedback Service ────────────────────────────────────────────────────
// Handles all HTTP requests for the user-scoped feedback endpoints.

import { apiClient } from "@/lib/api"
import type {
  CreateUserFeedbackPayload,
  UserFeedback,
  UserFeedbackDetailResponse,
  UserFeedbackFilters,
  UserFeedbackListResponse,
} from "../types/user-feedback.types"

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildQuery(filters: UserFeedbackFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.type) params.set("type", filters.type)
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

const EMPTY_LIST: UserFeedbackListResponse = {
  data: [],
  meta: { current_page: 1, from: null, last_page: 1, per_page: 15, to: null, total: 0, path: "" },
  links: { first: null, last: null, prev: null, next: null },
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's feedback list.
 * Endpoint: GET /user/feedback/getAll
 */
export async function getMyFeedback(
  filters: UserFeedbackFilters = {},
): Promise<UserFeedbackListResponse> {
  try {
    const query = buildQuery(filters)
    return await apiClient.get<UserFeedbackListResponse>(`/user/feedback/getAll${query}`)
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return EMPTY_LIST
    throw err
  }
}

/**
 * Fetch a single feedback entry by ID (ownership-protected).
 * Endpoint: GET /user/feedback/getById/{id}
 */
export async function getMyFeedbackById(id: number): Promise<UserFeedback> {
  const res = await apiClient.get<UserFeedbackDetailResponse>(
    `/user/feedback/getById/${id}`,
  )
  return res.data
}

/**
 * Submit new feedback.
 * Endpoint: POST /user/feedback/create
 */
export async function createMyFeedback(
  payload: CreateUserFeedbackPayload,
): Promise<UserFeedback> {
  const res = await apiClient.post<UserFeedbackDetailResponse>(
    "/user/feedback/create",
    payload,
  )
  return res.data
}
