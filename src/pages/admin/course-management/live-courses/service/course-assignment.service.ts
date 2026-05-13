// ─── Course Assignment Service ───────────────────────────────────────────────
// Handles all HTTP requests for the Course Assignments feature.

import { apiClient } from "@/lib/api"
import type {
  CourseAssignmentListFilters,
  CourseAssignmentListResult,
  CourseAssignmentResource,
  CreateCourseAssignmentPayload,
  LaravelPaginated,
} from "../types/course-assignment.types"

type ListApiResponse =
  | CourseAssignmentListResult
  | LaravelPaginated<CourseAssignmentResource>
  | { data?: CourseAssignmentResource[]; meta?: LaravelPaginated<CourseAssignmentResource>["meta"]; links?: LaravelPaginated<CourseAssignmentResource>["links"] }
  | CourseAssignmentResource[]

function buildQuery(filters: CourseAssignmentListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  if (filters.course_id != null) params.set("course_id", String(filters.course_id))
  if (filters.user_id != null) params.set("user_id", String(filters.user_id))

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function normalizeListResponse(response: ListApiResponse): CourseAssignmentListResult {
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

/**
 * GET /admin/course-assignments/getAll
 */
export async function getAllCourseAssignments(
  filters: CourseAssignmentListFilters = {},
): Promise<CourseAssignmentListResult> {
  const query = buildQuery(filters)
  const response = await apiClient.get<ListApiResponse>(
    `/admin/course-assignments/getAll${query}`,
  )
  return normalizeListResponse(response)
}

/**
 * POST /admin/course-assignments/create
 */
export async function createCourseAssignment(
  payload: CreateCourseAssignmentPayload,
): Promise<CourseAssignmentResource> {
  const response = await apiClient.post<
    { data?: CourseAssignmentResource } | CourseAssignmentResource
  >("/admin/course-assignments/create", payload)

  if (response && typeof response === "object" && "data" in response && response.data) {
    return response.data as CourseAssignmentResource
  }
  return response as CourseAssignmentResource
}

/**
 * DELETE /admin/course-assignments/delete/{id}
 */
export async function deleteCourseAssignment(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/course-assignments/delete/${id}`)
}
