// ─── Online Course Reporting Types ───────────────────────────────────────────

export interface CommonOnlineFilters {
  date_from?: string
  date_to?: string
  department_id?: string | number
  per_page?: number
  page?: number
}

// ── User-Course Daily ─────────────────────────────────────────────────────────

export interface UserCourseDailyFilters extends CommonOnlineFilters {
  course_online_id?: string | number
  user_id?: string | number
}

export interface UserCourseDailyRow {
  id?: number
  date: string
  user_id: number
  user_name: string
  department_name?: string
  course_online_id: number
  course_name: string
  sessions_count: number
  completions_count: number
  total_watch_time_minutes: number
  avg_attention_score: number
  is_suspicious?: boolean
}

// ── Department-Course Daily ───────────────────────────────────────────────────

export interface DeptCourseDailyFilters extends CommonOnlineFilters {
  course_online_id?: string | number
}

export interface DeptCourseDailyRow {
  id?: number
  date: string
  department_id: number
  department_name: string
  course_online_id: number
  course_name: string
  sessions_count: number
  completions_count: number
  total_watch_time_minutes: number
  avg_attention_score: number
  active_users: number
}

// ── Session Fact ──────────────────────────────────────────────────────────────

export interface SessionFactFilters extends CommonOnlineFilters {
  course_online_id?: string | number
  user_id?: string | number
  is_suspicious?: boolean | ""
}

export interface SessionFactRow {
  id: number
  session_id?: number
  user_id: number
  user_name: string
  department_name?: string
  course_online_id: number
  course_name: string
  started_at: string
  ended_at: string | null
  attention_score: number
  content_completed: boolean
  is_suspicious: boolean
  duration_minutes?: number
}

// ── User Performance ──────────────────────────────────────────────────────────

export interface UserPerfFilters extends CommonOnlineFilters {
  course_online_id?: string | number
}

export type PerformanceRating = "excellent" | "good" | "needs_attention" | "poor"
export type RiskLevel = "high" | "medium" | "low"

export interface UserPerformanceRow {
  user_id: number
  user_name: string
  user_email?: string
  department_name?: string
  assigned_courses: number
  completed_courses: number
  completion_rate: number
  avg_quiz_score: number | null
  avg_progress: number
  avg_attention_score: number
  total_sessions: number
  suspicious_sessions: number
  performance_score: number
  performance_rating: PerformanceRating
  risk_level: RiskLevel
}

// ── User-Course Progress ──────────────────────────────────────────────────────

export interface UserCourseProgressFilters extends CommonOnlineFilters {
  course_online_id?: string | number
  status?: "not_started" | "in_progress" | "completed" | ""
}

export type ComplianceStatus = "compliant" | "on_track" | "at_risk" | "non_compliant"
export type ScoreBand = "excellent" | "good" | "average" | "poor"

export interface UserCourseProgressRow {
  user_id: number
  user_name: string
  user_email?: string
  department_name?: string
  course_online_id: number
  course_name: string
  status: "not_started" | "in_progress" | "completed"
  progress_percentage: number
  deadline?: string | null
  days_overdue: number
  compliance_status: ComplianceStatus
  score_band: ScoreBand
  last_accessed_at?: string | null
}

// ── Dept Evaluation Performance ───────────────────────────────────────────────

export interface DeptEvalFilters {
  course_type?: "regular" | "online" | ""
}

export interface EvalPerformer {
  rank: number
  user_id: number
  user_name: string
  avg_score: number
  eval_count: number
}

export interface DeptEvalDepartment {
  department_id: number
  department_name: string
  users_evaluated: number
  avg_score: number
  top_performers: EvalPerformer[]
  needs_support: EvalPerformer[]
}

export interface DeptEvalSummary {
  departments: number
  users_evaluated: number
  overall_avg_score: number
  highest_dept_avg: number
}

export interface DeptEvalData {
  summary: DeptEvalSummary
  departments: DeptEvalDepartment[]
}

export interface DeptEvalResponse {
  data: DeptEvalData
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
