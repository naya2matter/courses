// ─── Evaluation History Types ─────────────────────────────────────────────────
// All TypeScript shapes for the read-only Evaluation History feature.
// History rows are immutable audit snapshots — config_name and type_name
// are plain strings and are never foreign-key references.

// ── Nested resource shapes ────────────────────────────────────────────────────

export interface EvaluationHistoryUser {
  id: number
  name: string
}

export interface EvaluationHistoryDepartment {
  id: number
  name: string
}

export interface EvaluationHistoryCourse {
  id: number
  name: string
  type: string
}

export interface EvaluationHistoryPerformanceLevel {
  level: number
  label: string
  color: string
  range: { min: number; max: number }
}

// ── Snapshot row ──────────────────────────────────────────────────────────────

/** One scored criterion captured at evaluation time. Read-only snapshot. */
export interface EvaluationHistorySnapshotRow {
  id: number
  evaluation_id: number
  config_name: string
  type_name: string
  score_given: number
  max_score: number
}

// ── Top-level entry ───────────────────────────────────────────────────────────

export interface EvaluationHistoryEntry {
  id: number
  course_type: string
  total_score: number
  user: EvaluationHistoryUser | null
  department: EvaluationHistoryDepartment | null
  course: EvaluationHistoryCourse | null
  performance_level: EvaluationHistoryPerformanceLevel
  history: EvaluationHistorySnapshotRow[]
  created_at: string
  updated_at: string
}

// ── API response envelopes ────────────────────────────────────────────────────

export interface PaginationLinks {
  first?: string | null
  last?: string | null
  prev?: string | null
  next?: string | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number | null
  to?: number | null
  path?: string
}

export interface EvaluationHistoryListResponse {
  data: EvaluationHistoryEntry[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface EvaluationHistoryDetailResponse {
  data: EvaluationHistoryEntry
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface PerformanceDistributionItem {
  level: number
  label: string
  color: string
  range: { min: number; max: number }
  count: number
  percentage: number
}

export interface MonthlyTrendItem {
  month: string
  count: number
  avg_score: string | number
}

export interface TopCategoryItem {
  name: string
  avg_score: string | number
}

export interface EvaluationHistoryAnalytics {
  total_evaluations: number
  average_score: number
  performance_distribution: PerformanceDistributionItem[]
  monthly_trends: MonthlyTrendItem[]
  top_categories: TopCategoryItem[]
}

export interface EvaluationHistoryAnalyticsResponse {
  data: EvaluationHistoryAnalytics
}

// ── Filter state ──────────────────────────────────────────────────────────────

export interface EvaluationHistoryFilters {
  department_id: string
  user_id: string
  course_type: string
  performance_level: string
  start_date: string
  end_date: string
  page: number
  per_page: number
}

// ── Validation error shape ────────────────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}
