// ─── Quiz Service ─────────────────────────────────────────────────────────────
// All HTTP requests for the Quiz Management feature.
// The shared apiClient automatically attaches the Bearer token.

import { apiClient } from "@/lib/api"
import type {
  CreateQuizPayload,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  LaravelPaginatedQuizzes,
  QuizListFilters,
  QuizQuestion,
  QuizResource,
  QuizAnswerAdminResource,
  QuizAttemptAdminResource,
} from "../types/quiz.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuery(filters: QuizListFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.course_id != null) params.set("course_id", String(filters.course_id))
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /admin/quizzes/getAll
 */
export async function getAllQuizzes(
  filters: QuizListFilters = {},
): Promise<LaravelPaginatedQuizzes> {
  return apiClient.get<LaravelPaginatedQuizzes>(`/admin/quizzes/getAll${buildQuery(filters)}`)
}

/**
 * GET /admin/quizzes/getById/{id}
 */
export async function getQuizById(id: number): Promise<QuizResource> {
  const res = await apiClient.get<{ data: QuizResource }>(`/admin/quizzes/getById/${id}`)
  return res.data
}

/**
 * POST /admin/quizzes/create
 */
export async function createQuiz(payload: CreateQuizPayload): Promise<QuizResource> {
  const res = await apiClient.post<{ data: QuizResource }>("/admin/quizzes/create", payload)
  return res.data
}

/**
 * PUT /admin/quizzes/update/{id}
 */
export async function updateQuiz(
  id: number,
  payload: Partial<CreateQuizPayload>,
): Promise<QuizResource> {
  const res = await apiClient.put<{ data: QuizResource }>(`/admin/quizzes/update/${id}`, payload)
  return res.data
}

/**
 * DELETE /admin/quizzes/delete/{id}
 */
export async function deleteQuiz(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/quizzes/delete/${id}`)
}

// ── Question endpoints ────────────────────────────────────────────────────────

/**
 * POST /admin/quizzes/{quizId}/questions/create
 */
export async function createQuestion(
  quizId: number,
  payload: CreateQuestionPayload,
): Promise<QuizQuestion> {
  const res = await apiClient.post<{ data: QuizQuestion }>(
    `/admin/quizzes/${quizId}/questions/create`,
    payload,
  )
  return res.data
}

/**
 * PUT /admin/quizzes/{quizId}/questions/update/{questionId}
 */
export async function updateQuestion(
  quizId: number,
  questionId: number,
  payload: UpdateQuestionPayload,
): Promise<QuizQuestion> {
  const res = await apiClient.put<{ data: QuizQuestion }>(
    `/admin/quizzes/${quizId}/questions/update/${questionId}`,
    payload,
  )
  return res.data
}

/**
 * DELETE /admin/quizzes/{quizId}/questions/delete/{questionId}
 */
export async function deleteQuestion(quizId: number, questionId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/quizzes/${quizId}/questions/delete/${questionId}`)
}

// ── Attempt endpoints ─────────────────────────────────────────────────────────

/**
 * GET /admin/quizzes/{quizId}/attempts/getAll
 */
export async function getQuizAttempts(quizId: number): Promise<QuizAttemptAdminResource[]> {
  const res = await apiClient.get<{ data: QuizAttemptAdminResource[] }>(
    `/admin/quizzes/${quizId}/attempts/getAll`,
  )
  return Array.isArray(res) ? res : (res.data ?? [])
}

/**
 * GET /admin/quizzes/{quizId}/attempts/getById/{attemptId}
 */
export async function getQuizAttemptById(
  quizId: number,
  attemptId: number,
): Promise<QuizAttemptAdminResource> {
  const res = await apiClient.get<{ data: QuizAttemptAdminResource }>(
    `/admin/quizzes/${quizId}/attempts/getById/${attemptId}`,
  )
  return (res as { data: QuizAttemptAdminResource }).data ?? res
}

/**
 * DELETE /admin/quizzes/{quizId}/attempts/grant-retry
 * Deletes the user's last attempt so they can retry the quiz.
 */
export async function grantRetry(quizId: number, userId: number): Promise<void> {
  await apiClient.deleteBody<void>(`/admin/quizzes/${quizId}/attempts/grant-retry`, { user_id: userId })
}

// ── Manual grading ────────────────────────────────────────────────────────────

/**
 * POST /admin/quiz-answers/grade/{answerId}
 */
export async function gradeAnswer(
  answerId: number,
  points_earned: number,
): Promise<QuizAnswerAdminResource> {
  const res = await apiClient.post<{ data: QuizAnswerAdminResource }>(
    `/admin/quiz-answers/grade/${answerId}`,
    { points_earned },
  )
  return (res as { data: QuizAnswerAdminResource }).data ?? res
}
