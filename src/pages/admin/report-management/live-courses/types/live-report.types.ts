// ─── Live Course Reporting Types ─────────────────────────────────────────────

export interface CommonFilters {
  date_from?: string
  date_to?: string
  department_id?: string | number
  per_page?: number
  page?: number
}

// ── Registrations ─────────────────────────────────────────────────────────────

export interface RegistrationFilters extends CommonFilters {
  course_id?: string | number
  status?: "pending" | "in_progress" | "completed" | ""
}

export interface CourseRegistration {
  registration_id: number
  user_id: number
  user_name: string
  user_email: string
  department_name: string
  course_id: number
  course_name: string
  status: "pending" | "in_progress" | "completed"
  registered_at: string
  completed_at: string | null
  rating: number | null
  feedback: string | null
}

// ── Attendance ────────────────────────────────────────────────────────────────

export interface AttendanceFilters extends CommonFilters {
  course_id?: string | number | "general"
}

export interface AttendanceRecord {
  id: number
  user_id: number
  user_name: string
  user_email?: string
  department_name?: string
  course_id: number | null
  course_name: string | null
  clock_in: string
  clock_out: string | null
  duration_minutes?: number
  date?: string
}

// ── Course Completion ─────────────────────────────────────────────────────────

export interface CompletionFilters extends CommonFilters {
  course_id?: string | number
}

export interface CourseCompletion {
  id?: number
  user_id: number
  user_name: string
  user_email?: string
  department_name?: string
  course_id: number
  course_name: string
  registered_at: string
  completed_at: string
  days_to_complete: number
  rating?: number | null
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
