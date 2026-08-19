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
  report_date: string
  user_id: number
  user_name: string
  course_online_id: number
  course_name: string
  department_id?: number
  department_name?: string
  sessions_count: number
  active_playback_time: number      // seconds
  content_items_completed: number
  course_progress_pct: number       // 0-100
  updated_at?: string
}

// ── Department-Course Daily ───────────────────────────────────────────────────

export interface DeptCourseDailyFilters extends CommonOnlineFilters {
  course_online_id?: string | number
}

export interface DeptCourseDailyRow {
  id?: number
  department_id: number
  department_name: string
  course_online_id: number
  course_name: string
  report_date: string
  enrolled_users: number
  active_users: number
  completed_users: number
  avg_progress_percentage: number   // 0-100
  total_active_seconds: number      // seconds
  updated_at?: string
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
  course_online_id: number
  course_name: string
  department_id?: number
  department_name?: string
  content_id?: number
  session_date: string
  active_playback_time: number      // seconds
  wall_clock_seconds: number        // seconds
  completion_percentage: number     // 0-100
  attention_score: number
  is_suspicious: boolean
  content_completed: boolean
  created_at?: string
}

// ── User Performance ──────────────────────────────────────────────────────────

export interface UserPerfFilters extends CommonOnlineFilters {
  course_online_id?: string | number
  user_id?: string | number
}

export type PerformanceRating = "excellent" | "good" | "average" | "needs_improvement"
export type RiskLevel = "high" | "medium" | "low"

export interface UserPerformanceRow {
  user_id: number
  user_name: string
  user_email?: string
  department_id?: number
  department_name?: string
  total_assignments: number
  completed_courses: number
  in_progress_courses: number
  completion_rate: number           // 0-100, computed by Resource
  avg_progress: number              // 0-100
  progress: number                  // 0-100, average course progress
  learning_time: string             // human string, e.g. "3h 20m"
  learning_time_seconds: number     // raw seconds
  sessions_count: number
  total_active_seconds: number      // seconds
  avg_attention: number             // 0-100
  suspicious_sessions: number
  quiz_attempts_count: number
  quiz_passed_count: number
  avg_quiz_pct: number              // 0-100
  performance_score: number
  performance_rating: PerformanceRating
  risk_level: RiskLevel
}

// ── User-Course Progress ──────────────────────────────────────────────────────

export interface UserCourseProgressFilters extends CommonOnlineFilters {
  course_online_id?: string | number
  user_id?: string | number
  status?: "not_started" | "in_progress" | "completed" | ""
}

export type ComplianceStatus = "compliant" | "on_track" | "at_risk" | "non_compliant"
export type ScoreBand = "excellent" | "good" | "average" | "poor"

export interface UserCourseProgressRow {
  id?: number
  user_id: number
  user_name: string
  user_email?: string
  department_id?: number
  department_name?: string
  course_online_id: number
  course_name: string
  course_deadline?: string | null
  progress_percentage: number
  status: "not_started" | "in_progress" | "completed"
  total_content_items: number
  completed_content_items: number
  started_at?: string | null
  completed_at?: string | null
  last_accessed_at?: string | null
  days_overdue: number
  compliance_status: ComplianceStatus
  score_band: ScoreBand
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
