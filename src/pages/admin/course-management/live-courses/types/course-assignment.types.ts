// ─── Course Assignment Types ─────────────────────────────────────────────────
// Central place for all course assignment-related TypeScript types.

export interface AssignmentCourseRef {
  id: number
  name: string
}

export interface AssignmentUserRef {
  id: number
  name: string
  email: string
}

export interface AssignmentAvailabilityRef {
  id: number
  start_date?: string | null
  end_date?: string | null
}

/**
 * A single CourseAssignment returned by the API.
 */
export interface CourseAssignmentResource {
  id: number
  course?: AssignmentCourseRef | null
  user?: AssignmentUserRef | null
  course_availability?: AssignmentAvailabilityRef | null
  assigned_by?: { id: number; name: string; email: string } | null
  assigned_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface LaravelPaginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface CourseAssignmentListFilters {
  page?: number
  per_page?: number
  search?: string
  course_id?: number
  user_id?: number
}

// ── Payloads ──────────────────────────────────────────────────────────────────

/**
 * Body for POST /admin/course-assignments/create
 */
export interface CreateCourseAssignmentPayload {
  course_id: number
  user_id: number
  course_availability_id?: number | null
}

// ── Normalized list result ────────────────────────────────────────────────────

export interface CourseAssignmentListResult {
  data: CourseAssignmentResource[]
  links: PaginationLinks
  meta: PaginationMeta
}

// ── Zustand store shape ───────────────────────────────────────────────────────

export interface CourseAssignmentState {
  // List state
  items: CourseAssignmentResource[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  filters: CourseAssignmentListFilters

  // Create state
  isCreating: boolean
  createError: string | null
  lastCreated: CourseAssignmentResource | null

  // Delete state
  isDeleting: boolean
  deleteError: string | null

  // Actions
  fetchAssignments: (filters?: CourseAssignmentListFilters) => Promise<void>
  setFilters: (filters: CourseAssignmentListFilters) => void
  createAssignment: (payload: CreateCourseAssignmentPayload) => Promise<CourseAssignmentResource>
  deleteAssignment: (id: number) => Promise<void>
  clearError: () => void
  clearCreateError: () => void
  clearLastCreated: () => void
}
