// ─── Reporting Refresh Types ──────────────────────────────────────────────────

export type RefreshStatus = "pending" | "running" | "completed" | "failed"

// Matches ReportingRefreshLogResource field names from the backend
export interface RefreshLogEntry {
  id: number
  report_table: string          // e.g. "reporting_user_course_daily"
  report_date: string           // date being refreshed "YYYY-MM-DD"
  refreshed_at: string
  duration_seconds: number | null
  rows_written: number | null
  status: RefreshStatus
  error_message: string | null
  created_at: string
}

// GET /admin/reporting/refresh/log returns a plain array (not paginated)
export type RefreshLogResponse = RefreshLogEntry[]

export interface RefreshResult {
  message: string
  rows_affected?: number
  duration_seconds?: number
}
