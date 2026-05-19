// ─── Quiz Assignment Service ──────────────────────────────────────────────────
// All HTTP requests for Quiz Assignments.

import { apiClient } from "@/lib/api"
import type {
  CreateQuizAssignmentPayload,
  CreateQuizAssignmentResult,
  LaravelPaginated,
  QuizAssignmentListFilters,
  QuizAssignmentListResult,
  QuizAssignmentResource,
} from "../types/quiz-assignment.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuery(filters: QuizAssignmentListFilters): string {
  const params = new URLSearchParams()

  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  if (filters.quiz_id != null) params.set("quiz_id", String(filters.quiz_id))
  if (filters.user_id != null) params.set("user_id", String(filters.user_id))
  if (filters.notification_sent != null)
    params.set("notification_sent", filters.notification_sent ? "true" : "false")

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

type ListApiResponse =
  | QuizAssignmentListResult
  | LaravelPaginated<QuizAssignmentResource>
  | { data?: QuizAssignmentResource[]; meta?: LaravelPaginated<QuizAssignmentResource>["meta"]; links?: LaravelPaginated<QuizAssignmentResource>["links"] }
  | QuizAssignmentResource[]

function normalizeListResponse(response: ListApiResponse): QuizAssignmentListResult {
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
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: 15,
      to: null,
      total: 0,
      path: "",
    },
    links: response.links ?? { first: null, last: null, prev: null, next: null },
  }
}

type CreateApiResponse =
  | { data?: QuizAssignmentResource[]; skipped_user_ids?: number[] }
  | QuizAssignmentResource[]

function normalizeCreateResponse(response: CreateApiResponse): CreateQuizAssignmentResult {
  if (Array.isArray(response)) {
    return { created: response, skippedUserIds: [] }
  }
  return {
    created: Array.isArray(response.data) ? response.data : [],
    skippedUserIds: Array.isArray(response.skipped_user_ids) ? response.skipped_user_ids : [],
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /admin/quiz-assignments/getAll
 */
export async function getAllQuizAssignments(
  filters: QuizAssignmentListFilters = {},
): Promise<QuizAssignmentListResult> {
  const query = buildQuery(filters)
  const response = await apiClient.get<ListApiResponse>(`/admin/quiz-assignments/getAll${query}`)
  return normalizeListResponse(response)
}

/**
 * POST /admin/quiz-assignments/create
 */
export async function createQuizAssignment(
  payload: CreateQuizAssignmentPayload,
): Promise<CreateQuizAssignmentResult> {
  const response = await apiClient.post<CreateApiResponse>(
    "/admin/quiz-assignments/create",
    payload,
  )
  return normalizeCreateResponse(response)
}

/**
 * DELETE /admin/quiz-assignments/delete/{id}
 */
export async function deleteQuizAssignment(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/quiz-assignments/delete/${id}`)
}
