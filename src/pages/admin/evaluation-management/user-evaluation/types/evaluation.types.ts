// ─── Evaluation Types ─────────────────────────────────────────────────────────
// All TypeScript shapes for the Admin User Evaluations feature.

// ── Core domain ───────────────────────────────────────────────────────────────

export type CourseType = "regular" | "online"

export interface EvaluationUser {
  id: number
  name: string
  email?: string
  avatar?: string | null
}

export interface EvaluationDepartment {
  id: number
  name: string
}

export interface EvaluationCourse {
  id: number
  name: string
  type?: string | null
}

/** Performance level as returned by the API */
export interface EvaluationPerformanceLevel {
  level: number
  label: string
  color: string
}

/** A single score line attached to an evaluation */
export interface EvaluationScore {
  evaluation_type_id: number
  config_name?: string
  type_name?: string
  score_given: number
  max_score?: number
}

/** History snapshot row */
export interface EvaluationHistory {
  id: number
  evaluation_id?: number
  config_name: string
  type_name: string
  score_given: number
  max_score?: number
  created_at?: string
}

// ── List item (returned by getAll) ────────────────────────────────────────────

export interface Evaluation {
  id: number
  user_id: number
  department_id: number
  course_type: CourseType
  course_id?: number | null
  course_online_id?: number | null
  total_score: number
  user?: EvaluationUser | null
  department?: EvaluationDepartment | null
  course?: EvaluationCourse | null
  performance_level?: EvaluationPerformanceLevel | null
  created_at?: string
  updated_at?: string
}

/** Full detail — returned by getById, includes scores + history */
export interface EvaluationDetail extends Evaluation {
  scores?: EvaluationScore[]
  history?: EvaluationHistory[]
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

// ── API response envelopes ────────────────────────────────────────────────────

export interface EvaluationListResponse {
  data: Evaluation[]
  meta?: PaginationMeta
}

export interface EvaluationDetailResponse {
  data: EvaluationDetail
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface EvaluationScorePayload {
  evaluation_type_id: number
  score_given: number
}

export interface EvaluationCreatePayload {
  user_id: number
  department_id: number
  course_type: CourseType
  course_id?: number
  course_online_id?: number
  scores: EvaluationScorePayload[]
}

/** PUT — only scores can be updated */
export interface EvaluationUpdatePayload {
  scores: EvaluationScorePayload[]
}

export interface EvaluationBulkCreatePayload {
  evaluations: EvaluationCreatePayload[]
}

export interface EvaluationBulkCreateResponse {
  created: number
  updated: number
  failed: number
  errors?: Record<string, string> | string[]
}

// ── Client-side filter state ──────────────────────────────────────────────────

export interface EvaluationFilters {
  search: string
  course_type: CourseType | ""
  department_id: string
  user_id: string
  performance_level: string
  start_date: string
  end_date: string
  /** Allow-listed sort column: created_at | total_score | performance_level */
  sort?: string
  direction?: "asc" | "desc"
  per_page?: number
  page?: number
}

// ── Users with courses (for evaluation form) ──────────────────────────────────

export interface AssignedCourse {
  id: number
  name: string
  course_type?: CourseType
}

export interface EvaluationUserWithCourses {
  id: number
  name: string
  email?: string
  department_id?: number | null
  department?: EvaluationDepartment | null
  regular_courses?: AssignedCourse[]
  online_courses?: AssignedCourse[]
}

export interface EvaluationUsersResponse {
  data: EvaluationUserWithCourses[]
}

export interface UserAssignedCoursesResponse {
  data: AssignedCourse[] | {
    regular_courses?: AssignedCourse[]
    online_courses?: AssignedCourse[]
  }
}

// ── Validation error ──────────────────────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}
