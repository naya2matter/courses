// ─── Quiz Reporting Types ─────────────────────────────────────────────────────

export interface QuizAttemptFilters {
  quiz_id?: string | number
  status?: "passed" | "failed" | "pending" | ""
  department_id?: string | number
  user_id?: string | number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface QuizDetailedExportFilters {
  quiz_id?: string | number
  user_id?: string | number
  department_id?: string | number
  status?: "passed" | "failed" | ""
  date_from?: string
  date_to?: string
}

export type QuizAttemptStatus = "passed" | "failed" | "pending"

export interface QuizAttemptRow {
  id: number
  user_id: number
  user_name: string
  user_email?: string
  department_name?: string
  quiz_id: number
  quiz_name?: string
  score: number
  total_points: number
  percentage: number
  passed: boolean
  status: QuizAttemptStatus
  started_at?: string
  completed_at: string | null
}

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
