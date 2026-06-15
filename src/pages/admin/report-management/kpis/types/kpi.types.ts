// ─── KPI Reporting Types ──────────────────────────────────────────────────────

export interface KpiFilters {
  date_from?: string
  date_to?: string
  department_id?: string | number
  course_online_id?: string | number
}

export interface KpiOverviewData {
  total_sessions: number
  total_completions: number
  avg_attention_score: number
  active_users: number
  suspicious_sessions: number
  completion_rate: number
  avg_session_duration_minutes?: number
  total_content_items_completed?: number
}

export interface KpiOverviewResponse {
  data: KpiOverviewData
}

export interface KpiTrendPoint {
  date: string
  sessions: number
  completions: number
  avg_attention_score: number
  active_users: number
  suspicious_sessions?: number
}

export interface KpiTrendsResponse {
  data: KpiTrendPoint[]
}
