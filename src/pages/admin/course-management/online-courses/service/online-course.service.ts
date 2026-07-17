// ─── Online Course Service ────────────────────────────────────────────────────
// All HTTP calls for the Admin Online Courses feature.
// The shared apiClient automatically attaches the Bearer token from localStorage.

import { apiClient } from "@/lib/api"
import type {
  OnlineCourseDetail,
  OnlineCourseDetailResponse,
  OnlineCourseFilters,
  OnlineCourseListResponse,
  ReorderModulesPayload,
  EnrollmentFilters,
  EnrollmentListResponse,
} from "../types/online-course.types"

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildQuery(filters: OnlineCourseFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.date_from) params.set("date_from", filters.date_from)
  if (filters.date_to) params.set("date_to", filters.date_to)
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of online courses with summary cards.
 * Endpoint: GET /admin/online-courses/getAll
 */
export async function getOnlineCourses(
  filters: OnlineCourseFilters = {},
): Promise<OnlineCourseListResponse> {
  try {
    const query = buildQuery(filters)
    return await apiClient.get<OnlineCourseListResponse>(
      `/admin/online-courses/getAll${query}`,
    )
  } catch (err) {
    if (isCanceledError(err)) {
      return {
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
        cards: [],
      }
    }
    throw err
  }
}

/**
 * Fetch a single online course with its full module/content tree.
 * Endpoint: GET /admin/online-courses/getById/{id}
 */
export async function getOnlineCourseById(id: number): Promise<OnlineCourseDetail> {
  const res = await apiClient.get<OnlineCourseDetailResponse>(
    `/admin/online-courses/getById/${id}`,
  )
  return res.data
}

// ── Helper to unwrap detail response ─────────────────────────────────────────

function unwrapDetail(raw: unknown): OnlineCourseDetail {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: OnlineCourseDetail }).data
  }
  return raw as OnlineCourseDetail
}

/**
 * Create a new online course (with optional modules and content).
 * Endpoint: POST /admin/online-courses/create  (multipart/form-data)
 */
export async function createOnlineCourse(fd: FormData): Promise<OnlineCourseDetail> {
  const raw = await apiClient.postForm<unknown>("/admin/online-courses/create", fd)
  return unwrapDetail(raw)
}

/**
 * Update an existing online course (full module sync if modules included).
 * Endpoint: PUT /admin/online-courses/update/{id}  (multipart/form-data + _method=PUT)
 */
export async function updateOnlineCourse(id: number, fd: FormData): Promise<OnlineCourseDetail> {
  const raw = await apiClient.putForm<unknown>(`/admin/online-courses/update/${id}`, fd)
  return unwrapDetail(raw)
}

/**
 * Soft-delete an online course.
 * Returns 204 on success.
 * Throws ApiError with status 422 if the course has active user assignments.
 * Endpoint: DELETE /admin/online-courses/delete/{id}
 */
export async function deleteOnlineCourse(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/online-courses/delete/${id}`)
}

/**
 * Reorder modules within a course.
 * All module_ids must belong to the same course.
 * Endpoint: PUT /admin/online-courses/modules/reorder
 */
export async function reorderModules(
  payload: ReorderModulesPayload,
): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(
    "/admin/online-courses/modules/reorder",
    payload,
  )
}

/**
 * Fetch enrolled users for a course with filters.
 * Endpoint: GET /admin/online-courses/{courseId}/enrollments
 */
export async function getCourseEnrollments(
  courseId: number,
  filters: EnrollmentFilters = {},
): Promise<EnrollmentListResponse> {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.status) params.set("status", filters.status)
  if (filters.department_id != null) params.set("department_id", String(filters.department_id))
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  const qs = params.toString()
  return apiClient.get<EnrollmentListResponse>(
    `/admin/online-courses/${courseId}/enrollments${qs ? `?${qs}` : ""}`,
  )
}
