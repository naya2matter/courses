// ─── Course Types ────────────────────────────────────────────────────────────
// Central place for all course-related TypeScript types used by:
// - API service
// - Zustand store
// - UI components

/**
 * Reference to course level
 */
export interface CourseLevelRef {
  id: number
  name: string
}

/**
 * Represents a single course resource from the API
 */
export interface CourseResource {
  id: number
  name: string
  description: string | null
  level?: CourseLevelRef | string | null
  duration: number | null // Duration in minutes
  status: string | null // e.g., "active", "draft", "archived"
  privacy: string | null // e.g., "public", "private"
  image_path?: string | null // URL for the course display image
  availabilities: string | Record<string, unknown> | null // JSON string, object, or comma-separated values
  created_at?: string | null
  updated_at?: string | null
}

/**
 * Pagination metadata returned by Laravel API
 */
export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

/**
 * Pagination links for navigation
 */
export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

/**
 * Laravel paginated response structure
 */
export interface LaravelPaginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

/**
 * Filters available on GET /admin/courses/getAll
 */
export interface CourseListFilters {
  page?: number
  per_page?: number
  search?: string
  level_id?: number
  status?: string
}

/**
 * Summary card for dashboard display
 */
export interface CourseSummaryCard {
  key: string
  title: string
  value: number | string
}

/**
 * Normalized course list result used by UI after API response parsing
 */
export interface CourseListResult {
  data: CourseResource[]
  links: PaginationLinks
  meta: PaginationMeta
  cards?: CourseSummaryCard[]
}

// ─── Availability item used inside create/update payloads ──────────────────
export interface AvailabilityPayload {
  id?: number // present only on update (to patch an existing availability)
  start_date: string // "YYYY-MM-DD" or RFC3339
  end_date: string
  capacity: number
  days_of_week: string[] // ["monday","tuesday",…]
  notes?: string | null
  sessions?: number | null // total number of sessions
  duration_weeks?: number | null // number of weeks this course runs
  session_time_shift_1?: string | null // "HH:mm"
  session_time_shift_2?: string | null // "HH:mm"
  session_time_shift_3?: string | null // "HH:mm"
  session_duration_minutes?: number | null // duration of each session in minutes
}

// ─── Payload for POST /admin/courses/create ────────────────────────────────
export interface CreateCoursePayload {
  name: string
  description?: string | null
  level?: string | null // "beginner" | "intermediate" | "advanced"
  duration?: number | null
  status: string // "draft" | "published" | "archived"
  privacy: string // "public" | "private"
  audio_category_id?: number | null
  image?: File | null
  // Availabilities sent as indexed array: availabilities[0][start_date], etc.
  availabilities: AvailabilityPayload[]
}

// ─── Payload for PUT /admin/courses/update/{id} ────────────────────────────
export interface UpdateCoursePayload {
  name?: string
  description?: string | null
  level?: string | null
  duration?: number | null
  status?: string
  privacy?: string
  image?: File | null
  availabilities?: AvailabilityPayload[]
}

/**
 * Zustand store state for courses
 */
export interface CourseState {
  // List view state
  items: CourseResource[]
  meta: PaginationMeta | null
  summaryCards: CourseSummaryCard[]
  isLoading: boolean
  error: string | null
  filters: CourseListFilters

  // Detail view state
  currentCourse: CourseResource | null
  isLoadingCourse: boolean
  courseError: string | null

  // Actions — read
  fetchCourses: (filters?: CourseListFilters) => Promise<void>
  setFilters: (filters: CourseListFilters) => void
  fetchCourseById: (id: number) => Promise<void>

  // Actions — write
  createCourse: (payload: CreateCoursePayload) => Promise<CourseResource>
  updateCourse: (id: number, payload: UpdateCoursePayload) => Promise<CourseResource>
  deleteCourse: (id: number) => Promise<void>

  clearError: () => void
  clearCourseError: () => void
}
