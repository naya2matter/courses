// ─── User Quiz Service ────────────────────────────────────────────────────────
// All HTTP calls for the user-facing quiz feature.
// Uses the shared apiClient (Bearer token is attached automatically).
//
// Endpoints covered:
//   1. GET  /user/quizzes/getAll              → list assigned quizzes
//   2. GET  /user/quizzes/getById/{id}        → single quiz (no correct answers)
//   3. POST /user/quizzes/{id}/start          → start a new attempt
//   4. POST /user/quizzes/{id}/submit/{attemptId} → submit answers
//   5. GET  /user/quizzes/{id}/result/{attemptId} → get attempt result

import { apiClient } from "@/lib/api"
import type {
  UserQuizListResponse,
  UserQuizDetailResponse,
  UserQuizAttemptResponse,
  UserQuizAttemptResource,
  SubmitQuizPayload,
} from "../types/user-quiz.types"

// ── 1. List all quizzes assigned to authenticated user ────────────────────────

/**
 * GET /user/quizzes/getAll
 * Returns a list of quizzes assigned to the current user.
 */
export async function getUserQuizList(): Promise<UserQuizListResponse> {
  return apiClient.get<UserQuizListResponse>("/user/quizzes/getAll")
}

// ── 2. Get a single quiz by ID (no correct answers) ───────────────────────────

/**
 * GET /user/quizzes/getById/{id}
 * Returns quiz details including questions without correct_answer fields.
 */
export async function getUserQuizById(id: number): Promise<UserQuizDetailResponse> {
  return apiClient.get<UserQuizDetailResponse>(`/user/quizzes/getById/${id}`)
}

// ── 3. Start a quiz attempt ───────────────────────────────────────────────────

/**
 * POST /user/quizzes/{id}/start
 * Creates a new attempt for the quiz. Returns the attempt with its ID.
 */
export async function startQuizAttempt(quizId: number): Promise<UserQuizAttemptResource> {
  const res = await apiClient.post<UserQuizAttemptResponse>(`/user/quizzes/${quizId}/start`)
  return res.data
}

// ── 4. Submit quiz answers ────────────────────────────────────────────────────

/**
 * POST /user/quizzes/{id}/submit/{attemptId}
 * Submits answers for an in-progress attempt.
 * For checkbox questions, answers are comma-separated (e.g., "string,integer,float").
 */
export async function submitQuizAnswers(
  quizId: number,
  attemptId: number,
  payload: SubmitQuizPayload,
): Promise<UserQuizAttemptResource> {
  const res = await apiClient.post<UserQuizAttemptResponse>(
    `/user/quizzes/${quizId}/submit/${attemptId}`,
    payload,
  )
  return res.data
}

// ── 5. Get quiz result for a completed attempt ────────────────────────────────

/**
 * GET /user/quizzes/{id}/result/{attemptId}
 * Returns the full attempt result including answers, score, pass/fail.
 */
export async function getQuizResult(
  quizId: number,
  attemptId: number,
): Promise<UserQuizAttemptResource> {
  const res = await apiClient.get<UserQuizAttemptResponse>(
    `/user/quizzes/${quizId}/result/${attemptId}`,
  )
  return res.data
}
