// User evaluation feature types for user-side read-only pages.

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number | null
  to?: number | null
  path?: string
}

export interface PaginationLinks {
  first?: string | null
  last?: string | null
  prev?: string | null
  next?: string | null
}

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}

export interface UserEvaluationCourse {
  id: number
  name: string
  type: "regular" | "online" | string
}

export interface UserEvaluationUser {
  id: number
  name: string
}

export interface UserEvaluationDepartment {
  id: number
  name: string
}

export interface UserEvaluationPerformanceLevel {
  level: number
  label: string
  color?: string | null
  range?: {
    min: number
    max: number
  } | null
}

export interface UserEvaluationHistoryRow {
  id: number
  evaluation_id: number
  config_name: string
  type_name: string
  score_given: number
  max_score: number
}

export interface UserEvaluation {
  id: number
  course_type: "regular" | "online" | string
  total_score: number
  course?: UserEvaluationCourse | null
  performance_level?: UserEvaluationPerformanceLevel | null
  history: UserEvaluationHistoryRow[]
  created_at: string
  updated_at?: string | null
}

export interface UserEvaluationDetail extends UserEvaluation {
  user?: UserEvaluationUser | null
  department?: UserEvaluationDepartment | null
}

export interface UserEvaluationListResponse {
  data: UserEvaluation[]
  links?: Partial<PaginationLinks>
  meta?: Partial<PaginationMeta>
}

export interface UserEvaluationDetailResponse {
  data: UserEvaluationDetail
}

export interface UserEvaluationFilters {
  search: string
  course_type: "all" | "regular" | "online"
  performance_level: "all" | string
  start_date: string
  end_date: string
  page: number
  per_page: number
}
