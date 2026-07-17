// ─── User Courses Service ─────────────────────────────────────────────────────
// All HTTP calls for the user-facing courses feature.

import { apiClient } from "@/lib/api"
import type {
  Course,
  CoursesListResult,
  CoursePaginationMeta,
  CoursePaginationLinks,
  CourseRegistration,
  CourseRegistrationResource,
  MyEnrollmentsResource,
} from "../types/courses.types"

// ── Internal helpers ──────────────────────────────────────────────────────────

type GetAllApiResponse =
  | CoursesListResult
  | { data?: Course[]; meta?: CoursePaginationMeta; links?: CoursePaginationLinks }
  | Course[]

function normalizeList(response: GetAllApiResponse): CoursesListResult {
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
    meta: (response as CoursesListResult).meta ?? {
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: 15,
      to: null,
      total: 0,
      path: "",
    },
    links: (response as CoursesListResult).links ?? {
      first: null,
      last: null,
      prev: null,
      next: null,
    },
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /user/courses/getAll
 * Returns all accessible courses for the authenticated user.
 */
export async function getAllCourses(
  page = 1,
  perPage = 15,
): Promise<CoursesListResult> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })
  const res = await apiClient.get<GetAllApiResponse>(
    `/user/courses/getAll?${params.toString()}`,
  )
  return normalizeList(res)
}

/**
 * GET /user/courses/getById/{id}
 * Returns a single course by ID (access-controlled).
 */
export async function getCourseById(id: number): Promise<Course> {
  const res = await apiClient.get<{ data: Course } | Course>(
    `/user/courses/getById/${id}`,
  )
  if (res && typeof res === "object" && "data" in res && res.data) {
    return (res as { data: Course }).data
  }
  return res as Course
}

// ── Enrollment ────────────────────────────────────────────────────────────────

/**
 * POST /user/courses/enroll/{courseId}
 * Enroll the authenticated user in a course availability.
 */
export async function enrollInCourse(
  courseId: number,
  courseAvailabilityId: number,
): Promise<CourseRegistration> {
  const res = await apiClient.post<CourseRegistrationResource | CourseRegistration>(
    `/user/courses/enroll/${courseId}`,
    { course_availability_id: courseAvailabilityId },
  )
  if (res && typeof res === "object" && "data" in res && res.data) {
    return (res as CourseRegistrationResource).data
  }
  return res as CourseRegistration
}

/**
 * POST /user/courses/submitRating/{courseId}
 * Submit a rating for a completed course.
 */
export async function submitCourseRating(
  courseId: number,
  rating: number,
  feedback?: string | null,
): Promise<CourseRegistration> {
  const body: Record<string, unknown> = { rating, feedback: (feedback ?? "").trim() }
  const res = await apiClient.post<CourseRegistrationResource | CourseRegistration>(
    `/user/courses/submitRating/${courseId}`,
    body,
  )
  if (res && typeof res === "object" && "data" in res && res.data) {
    return (res as CourseRegistrationResource).data
  }
  return res as CourseRegistration
}

/**
 * POST /user/courses/complete/{courseId}
 * Mark the authenticated user's course as completed.
 */
export async function completeCourse(courseId: number): Promise<CourseRegistration> {
  const res = await apiClient.post<CourseRegistrationResource | CourseRegistration>(
    `/user/courses/complete/${courseId}`,
    {},
  )
  if (res && typeof res === "object" && "data" in res && res.data) {
    return (res as CourseRegistrationResource).data
  }
  return res as CourseRegistration
}

/**
 * GET /user/courses/my-enrollments
 * Get the authenticated user's course enrollments.
 */
export async function getMyEnrollments(): Promise<CourseRegistration[]> {
  const res = await apiClient.get<MyEnrollmentsResource | CourseRegistration[]>(
    `/user/courses/my-enrollments`,
  )
  if (Array.isArray(res)) return res
  if (res && typeof res === "object" && "data" in res) {
    return (res as MyEnrollmentsResource).data
  }
  return []
}
