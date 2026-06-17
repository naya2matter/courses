// ─── Course Assignment Types ─────────────────────────────────────────────────

export interface AssignmentCourseRef {
  id: number
  name: string
  description?: string | null
  level?: string | null
  status?: string | null
  privacy?: string | null
  duration?: number | null
  image_path?: string | null
}

export interface AssignmentUserRef {
  id: number
  name: string
  email: string
  link_expires_at?: string | null
}

export interface AssignmentAvailabilityRef {
  id: number
  start_date?: string | null
  end_date?: string | null
}

export interface CourseAssignmentResource {
  id: number
  course_id?: number | null
  user_id?: number | null
  course_availability_id?: number | null
  course?: AssignmentCourseRef | null
  user?: AssignmentUserRef | null
  course_availability?: AssignmentAvailabilityRef | null
  assigned_by?: number | null
  assigned_by_user?: { id: number; name: string } | null
  assigned_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface CourseAssignmentSummaryCard {
  key: string
  title: string
  value: number | string
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
  cards?: CourseAssignmentSummaryCard[]
}

// ── Zustand store shape ───────────────────────────────────────────────────────

export interface CourseAssignmentState {
  items: CourseAssignmentResource[]
  meta: PaginationMeta | null
  summaryCards: CourseAssignmentSummaryCard[]
  isLoading: boolean
  error: string | null
  filters: CourseAssignmentListFilters

  isCreating: boolean
  createError: string | null
  lastCreated: CourseAssignmentResource | null

  isDeleting: boolean
  deleteError: string | null

  fetchAssignments: (filters?: CourseAssignmentListFilters) => Promise<void>
  setFilters: (filters: CourseAssignmentListFilters) => void
  createAssignment: (payload: CreateCourseAssignmentPayload) => Promise<CourseAssignmentResource>
  deleteAssignment: (id: number) => Promise<void>
  clearError: () => void
  clearCreateError: () => void
  clearLastCreated: () => void
}
