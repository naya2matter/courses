// ─── Monthly KPI Types ────────────────────────────────────────────────────────
// Shapes for GET /admin/reporting/kpi/monthly and /kpi/monthly-comparison.
// Both endpoints wrap their payload in a { data: ... } envelope.

export interface MonthlyKpiFilters {
  /** Defaults to the current year on the backend. */
  year?: string | number
  /** 1–12. Omit to get all months of the year. */
  month?: string | number
  department_id?: string | number
  course_online_id?: string | number
}

/** One month of the online-course overview. */
export interface MonthlyOverviewRow {
  period: string // "2026-05"
  label: string // "May 2026"
  sessions: number
  active_seconds: number
  active_users: number
  avg_completion_pct: number
  avg_attention_score: number
  suspicious_sessions: number
}

/** One department's monthly aggregate. */
export interface MonthlyDeptRow {
  period: string
  label: string
  department_id: number
  department_name: string
  enrolled_users: number
  active_users: number
  completed_users: number
  avg_progress: number
  total_active_seconds: number
}

export interface MonthlyKpiData {
  overview: MonthlyOverviewRow[]
  by_department: MonthlyDeptRow[]
}

export interface MonthlyKpiResponse {
  data: MonthlyKpiData
}

// ── Month-over-month comparison ────────────────────────────────────────────────

export interface ComparisonMetric {
  current: number
  previous: number
  change: number
  /** null when the previous month was 0 (avoids divide-by-zero). */
  change_pct: number | null
}

/** Metric keys returned by the comparison endpoint. */
export type ComparisonMetricKey =
  | "sessions"
  | "active_seconds"
  | "active_users"
  | "avg_completion_pct"
  | "avg_attention_score"
  | "suspicious_sessions"

export interface MonthlyComparison {
  current_period: string
  previous_period: string
  current_label: string
  previous_label: string
  metrics: Record<ComparisonMetricKey, ComparisonMetric>
}

export interface MonthlyComparisonResponse {
  data: MonthlyComparison
}
