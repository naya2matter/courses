// ─── KPI Reporting Types ──────────────────────────────────────────────────────

export interface KpiFilters {
  date_from?: string
  date_to?: string
  department_id?: string | number
}

export interface KpiPeriod {
  from: string
  to: string
}

export interface KpiOverviewData {
  period: KpiPeriod
  total_sessions: number
  total_active_seconds: number
  avg_completion_pct: number
  avg_attention_score: number
  suspicious_sessions: number
  enrolled_users: number
  completed_users: number
  completion_rate: number
}

// The endpoint returns a flat object — no { data: ... } envelope
export type KpiOverviewResponse = KpiOverviewData
