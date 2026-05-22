// ─── Evaluation Service ───────────────────────────────────────────────────────
// All HTTP calls for the Admin User Evaluations feature.
// The shared apiClient automatically attaches the Bearer token.

import { apiClient } from "@/lib/api"
import type {
  Evaluation,
  EvaluationDetail,
  EvaluationListResponse,
  EvaluationDetailResponse,
  EvaluationCreatePayload,
  EvaluationUpdatePayload,
  EvaluationBulkCreatePayload,
  EvaluationBulkCreateResponse,
  EvaluationFilters,
  EvaluationUserWithCourses,
  EvaluationUsersResponse,
  AssignedCourse,
  UserAssignedCoursesResponse,
  CourseType,
} from "../types/evaluation.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      qs.set(k, String(v))
    }
  }
  const s = qs.toString()
  return s ? `?${s}` : ""
}

function unwrapList(res: EvaluationListResponse | Evaluation[]): Evaluation[] {
  if (Array.isArray(res)) return res
  if (res && "data" in res && Array.isArray(res.data)) return res.data
  return []
}

function unwrapDetail(res: EvaluationDetailResponse | EvaluationDetail): EvaluationDetail {
  if (res && "data" in res && !Array.isArray((res as EvaluationDetailResponse).data)) {
    return (res as EvaluationDetailResponse).data
  }
  return res as EvaluationDetail
}

function unwrapUsers(
  res: EvaluationUsersResponse | EvaluationUserWithCourses[],
): EvaluationUserWithCourses[] {
  if (Array.isArray(res)) return res
  if (res && "data" in res && Array.isArray(res.data)) return res.data
  return []
}

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * GET /admin/evaluations/getAll
 * Accepts filter params; all are optional.
 */
export async function getEvaluations(
  filters?: Partial<EvaluationFilters>,
): Promise<Evaluation[]> {
  const query = buildQuery({
    course_type: filters?.course_type || undefined,
    department_id: filters?.department_id || undefined,
    user_id: filters?.user_id || undefined,
    performance_level: filters?.performance_level || undefined,
    start_date: filters?.start_date || undefined,
    end_date: filters?.end_date || undefined,
  })
  const res = await apiClient.get<EvaluationListResponse | Evaluation[]>(
    `/admin/evaluations/getAll${query}`,
  )
  return unwrapList(res)
}

// ── Detail ────────────────────────────────────────────────────────────────────

/**
 * GET /admin/evaluations/getById/{id}
 */
export async function getEvaluationById(id: number): Promise<EvaluationDetail> {
  const res = await apiClient.get<EvaluationDetailResponse | EvaluationDetail>(
    `/admin/evaluations/getById/${id}`,
  )
  return unwrapDetail(res)
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * POST /admin/evaluations/create
 * Server calculates total_score and performance_level.
 */
export async function createEvaluation(
  payload: EvaluationCreatePayload,
): Promise<EvaluationDetail> {
  const res = await apiClient.post<EvaluationDetailResponse | EvaluationDetail>(
    "/admin/evaluations/create",
    payload,
  )
  return unwrapDetail(res)
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * PUT /admin/evaluations/update/{id}
 * Only scores[] can be updated; total_score and performance_level are recalculated.
 */
export async function updateEvaluation(
  id: number,
  payload: EvaluationUpdatePayload,
): Promise<EvaluationDetail> {
  const res = await apiClient.put<EvaluationDetailResponse | EvaluationDetail>(
    `/admin/evaluations/update/${id}`,
    payload,
  )
  return unwrapDetail(res)
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * DELETE /admin/evaluations/delete/{id}
 */
export async function deleteEvaluation(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/evaluations/delete/${id}`)
}

// ── Bulk Create ───────────────────────────────────────────────────────────────

/**
 * POST /admin/evaluations/bulk-create
 * Returns created/updated/failed/errors counts.
 */
export async function bulkCreateEvaluations(
  payload: EvaluationBulkCreatePayload,
): Promise<EvaluationBulkCreateResponse> {
  const res = await apiClient.post<EvaluationBulkCreateResponse>(
    "/admin/evaluations/bulk-create",
    payload,
  )
  return res
}

// ── Users with courses ────────────────────────────────────────────────────────

/**
 * GET /admin/evaluations/users
 * Returns users grouped with their assigned courses.
 */
export async function getEvaluationUsers(filters?: {
  department_id?: number | string
  course_type?: CourseType
}): Promise<EvaluationUserWithCourses[]> {
  const query = buildQuery({
    department_id: filters?.department_id || undefined,
    course_type: filters?.course_type || undefined,
  })
  const res = await apiClient.get<EvaluationUsersResponse | EvaluationUserWithCourses[]>(
    `/admin/evaluations/users${query}`,
  )
  return unwrapUsers(res)
}

/**
 * GET /admin/evaluations/user-courses?user_id={userId}
 * Returns both regular and online course assignments for the specified user.
 */
export async function getUserAssignedCourses(
  userId: number,
  courseType?: CourseType,
): Promise<{ regular_courses: AssignedCourse[]; online_courses: AssignedCourse[] }> {
  const query = buildQuery({
    user_id: userId,
    course_type: courseType || undefined,
  })
  const res = await apiClient.get<
    | UserAssignedCoursesResponse
    | AssignedCourse[]
    | { regular_courses?: AssignedCourse[]; online_courses?: AssignedCourse[] }
  >(`/admin/evaluations/user-courses${query}`)

  if (Array.isArray(res)) {
    return {
      regular_courses: courseType === "regular" ? res : [],
      online_courses: courseType === "online" ? res : [],
    }
  }

  if (res && "data" in res) {
    if (Array.isArray(res.data)) {
      return {
        regular_courses: courseType === "regular" ? res.data : [],
        online_courses: courseType === "online" ? res.data : [],
      }
    }

    return {
      regular_courses: res.data?.regular_courses ?? [],
      online_courses: res.data?.online_courses ?? [],
    }
  }

  return {
    regular_courses: res?.regular_courses ?? [],
    online_courses: res?.online_courses ?? [],
  }
}
