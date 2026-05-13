// ─── User Courses Types ───────────────────────────────────────────────────────

export interface CourseAvailability {
  id: number
  course_id: number
  start_date: string
  end_date: string
  capacity: number
  sessions: number
  available_spots: number
  is_full: boolean
  duration_weeks: number
  status: string
  notes: string | null
  days_of_week: string[]
  session_time_shift_1: string | null
  session_time_shift_2: string | null
  session_time_shift_3: string | null
  session_duration_minutes: number
  created_at: string
  updated_at: string
}

export interface Course {
  id: number
  name: string
  description: string | null
  image_path: string | null
  level: string | null
  duration: number | null
  status: string
  privacy: string
  created_by: number
  availabilities: CourseAvailability[]
  created_at: string
  updated_at: string
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface CoursePaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

export interface CoursePaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface CoursesListResult {
  data: Course[]
  meta: CoursePaginationMeta
  links: CoursePaginationLinks
}

// ── Enrollment ────────────────────────────────────────────────────────────────

export interface CourseRegistration {
  id: number
  user_id: number
  course_id: number
  course_availability_id: number
  status: string            // e.g. "enrolled" | "completed" | "cancelled"
  enrolled_at: string | null
  completed_at: string | null
  rating: number | null
  feedback: string | null
  created_at: string
  updated_at: string
  course?: Course
  availability?: CourseAvailability
}

export interface CourseRegistrationResource {
  data: CourseRegistration
}

export interface MyEnrollmentsResource {
  data: CourseRegistration[]
}
