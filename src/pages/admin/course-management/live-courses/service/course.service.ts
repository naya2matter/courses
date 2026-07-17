// ─── Course Service ──────────────────────────────────────────────────────────
// Handles all HTTP requests for the Courses page.

import { apiClient } from "@/lib/api"
import type {
  CourseListFilters,
  CourseListResult,
  CourseSummaryCard,
  CourseResource,
  LaravelPaginated,
  CreateCoursePayload,
  UpdateCoursePayload,
  AvailabilityPayload,
} from "../types/course.types"

/**
 * Possible API response shapes for course list endpoint
 */
type ListApiResponse =
  | CourseListResult
  | LaravelPaginated<CourseResource>
  | {
      data?: CourseResource[]
      meta?: LaravelPaginated<CourseResource>["meta"]
      links?: LaravelPaginated<CourseResource>["links"]
      cards?: CourseSummaryCard[]
    }
  | CourseResource[]

/**
 * Build query string from filters object
 */
function buildQuery(filters: CourseListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  if (filters.level_id != null) params.set("level_id", String(filters.level_id))
  if (filters.status?.trim()) params.set("status", filters.status.trim())
  if (filters.privacy?.trim()) params.set("privacy", filters.privacy.trim())
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.date_from) params.set("date_from", filters.date_from)
  if (filters.date_to) params.set("date_to", filters.date_to)

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Normalize API response to consistent CourseListResult shape
 */
function normalizeListResponse(response: ListApiResponse): CourseListResult {
  // Case 1: endpoint returned array directly (no pagination)
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
      cards: [],
    }
  }

  // Case 2: paginated object from Laravel resource collection
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
    cards: Array.isArray((response as { cards?: CourseSummaryCard[] }).cards)
      ? (response as { cards?: CourseSummaryCard[] }).cards
      : [],
  }
}

/**
 * Fetch all courses with optional filters
 * GET /admin/courses/getAll
 */
export async function getAllCourses(filters: CourseListFilters = {}): Promise<CourseListResult> {
  const query = buildQuery(filters)
  const response = await apiClient.get<ListApiResponse>(`/admin/courses/getAll${query}`)
  return normalizeListResponse(response)
}

/**
 * Fetch single course by ID
 * GET /admin/courses/getById/{id}
 */
export async function getCourseById(id: number): Promise<CourseResource> {
  const response = await apiClient.get<{ data?: CourseResource } | CourseResource>(
    `/admin/courses/getById/${id}`,
  )

  // Handle both wrapped and unwrapped responses
  if (response && typeof response === "object" && "data" in response) {
    return response.data as CourseResource
  }

  return response as CourseResource
}

// ─────────────────────────────────────────────────────────────────────────────
// Write operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unwrap a CourseResource from various API response shapes
 */
function unwrapCourse(raw: { data?: CourseResource } | CourseResource): CourseResource {
  if (raw && typeof raw === "object" && "data" in raw) {
    return raw.data as CourseResource
  }
  return raw as CourseResource
}

function sanitizeShiftTime(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

/**
 * Build a FormData for POST /admin/courses/create
 * Sends availabilities as indexed array: availabilities[0][start_date], etc.
 */
function buildCreateFormData(payload: CreateCoursePayload): FormData {
  const fd = new FormData()

  // ── Core course fields ────────────────────────────────────────────────────
  fd.append("name", payload.name)
  fd.append("status", payload.status)
  fd.append("privacy", payload.privacy)

  if (payload.description != null) fd.append("description", payload.description)
  if (payload.level != null) fd.append("level", payload.level)
  if (payload.duration != null) fd.append("duration", String(payload.duration))
  if (payload.audio_category_id != null)
    fd.append("audio_category_id", String(payload.audio_category_id))
  if (payload.image instanceof File) fd.append("image", payload.image)

  // ── Availabilities array ──────────────────────────────────────────────────
  payload.availabilities.forEach((avail: AvailabilityPayload, index: number) => {
    const prefix = `availabilities[${index}]`

    fd.append(`${prefix}[start_date]`, avail.start_date)
    fd.append(`${prefix}[end_date]`, avail.end_date)
    fd.append(`${prefix}[capacity]`, String(avail.capacity))

    avail.days_of_week.forEach((day) => fd.append(`${prefix}[days_of_week][]`, day))

    if (avail.notes != null) fd.append(`${prefix}[notes]`, avail.notes)
    if (avail.sessions != null)
      fd.append(`${prefix}[sessions]`, String(avail.sessions))
    if (avail.duration_weeks != null)
      fd.append(`${prefix}[duration_weeks]`, String(avail.duration_weeks))
    const shift1 = sanitizeShiftTime(avail.session_time_shift_1)
    const shift2 = sanitizeShiftTime(avail.session_time_shift_2)
    const shift3 = sanitizeShiftTime(avail.session_time_shift_3)
    if (shift1) fd.append(`${prefix}[session_time_shift_1]`, shift1)
    if (shift2) fd.append(`${prefix}[session_time_shift_2]`, shift2)
    if (shift3) fd.append(`${prefix}[session_time_shift_3]`, shift3)
    if (avail.session_duration_minutes != null)
      fd.append(`${prefix}[session_duration_minutes]`, String(avail.session_duration_minutes))
  })

  return fd
}

/**
 * Build FormData for PUT /admin/courses/update/{id}
 * Sends availabilities as indexed array: availabilities[0][start_date], etc.
 */
function buildUpdateFormData(payload: UpdateCoursePayload): FormData {
  const fd = new FormData()

  // ── Core course fields (all optional on update) ───────────────────────────
  if (payload.name != null) fd.append("name", payload.name)
  if (payload.status != null) fd.append("status", payload.status)
  if (payload.privacy != null) fd.append("privacy", payload.privacy)
  if (payload.description != null) fd.append("description", payload.description)
  if (payload.level != null) fd.append("level", payload.level)
  if (payload.duration != null) fd.append("duration", String(payload.duration))
  if (payload.image instanceof File) fd.append("image", payload.image)

  // ── Availabilities array ──────────────────────────────────────────────────
  if (Array.isArray(payload.availabilities)) {
    payload.availabilities.forEach((avail: AvailabilityPayload, index: number) => {
      const prefix = `availabilities[${index}]`

      // id only present when updating an existing availability
      if (avail.id != null) fd.append(`${prefix}[id]`, String(avail.id))

      fd.append(`${prefix}[start_date]`, avail.start_date)
      fd.append(`${prefix}[end_date]`, avail.end_date)
      fd.append(`${prefix}[capacity]`, String(avail.capacity))

      avail.days_of_week.forEach((day) => fd.append(`${prefix}[days_of_week][]`, day))

      if (avail.notes != null) fd.append(`${prefix}[notes]`, avail.notes)
      if (avail.sessions != null)
        fd.append(`${prefix}[sessions]`, String(avail.sessions))
      if (avail.duration_weeks != null)
        fd.append(`${prefix}[duration_weeks]`, String(avail.duration_weeks))
      const shift1 = sanitizeShiftTime(avail.session_time_shift_1)
      const shift2 = sanitizeShiftTime(avail.session_time_shift_2)
      const shift3 = sanitizeShiftTime(avail.session_time_shift_3)
      if (shift1) fd.append(`${prefix}[session_time_shift_1]`, shift1)
      if (shift2) fd.append(`${prefix}[session_time_shift_2]`, shift2)
      if (shift3) fd.append(`${prefix}[session_time_shift_3]`, shift3)
      if (avail.session_duration_minutes != null)
        fd.append(`${prefix}[session_duration_minutes]`, String(avail.session_duration_minutes))
    })
  }

  return fd
}

/**
 * Create a new course
 * POST /admin/courses/create  (multipart/form-data)
 */
export async function createCourse(payload: CreateCoursePayload): Promise<CourseResource> {
  const fd = buildCreateFormData(payload)
  const raw = await apiClient.postForm<{ data?: CourseResource } | CourseResource>(
    "/admin/courses/create",
    fd,
  )
  return unwrapCourse(raw)
}

/**
 * Update an existing course (and its availabilities)
 * PUT /admin/courses/update/{id}  — sent as POST with _method=PUT
 */
export async function updateCourse(
  id: number,
  payload: UpdateCoursePayload,
): Promise<CourseResource> {
  const fd = buildUpdateFormData(payload)
  const raw = await apiClient.putForm<{ data?: CourseResource } | CourseResource>(
    `/admin/courses/update/${id}`,
    fd,
  )
  return unwrapCourse(raw)
}

/**
 * Soft-delete a course
 * DELETE /admin/courses/delete/{id}
 */
export async function deleteCourse(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/courses/delete/${id}`)
}
