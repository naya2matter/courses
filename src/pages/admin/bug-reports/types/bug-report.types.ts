// ─── Bug Report Types ─────────────────────────────────────────────────────────
// Defines all TypeScript shapes for the Admin Bug Reports feature.
//   • API response types (list + single resource)
//   • Request payload types (create / update / assign)
//   • Filter params used when fetching the list
//   • Standard Laravel pagination envelope
//   • API validation error shape

// ── Enum-like literals ────────────────────────────────────────────────────────

export type BugReportStatus = "open" | "in_progress" | "resolved" | "closed"
export type BugReportPriority = "low" | "medium" | "high" | "critical"

// ── Embedded user shape ───────────────────────────────────────────────────────

/**
 * Compact user reference embedded in bug report responses.
 * Used for both the reporter and the assigned-to admin.
 */
export interface BugReportUser {
  id: number
  name: string
  email: string
}

// ── Primary resource shape ────────────────────────────────────────────────────

/**
 * A single bug report entry as returned by the API (list and detail).
 * Maps to the backend BugReportResource.
 */
export interface BugReport {
  id: number
  title: string
  description: string
  priority: BugReportPriority
  status: BugReportStatus
  steps_to_reproduce?: string | null
  page_url?: string | null
  reported_by?: BugReportUser | null
  assigned_to?: BugReportUser | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

// ── Laravel paginated envelope ────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

/** Paginated list response for GET /admin/bug-reports/getAll */
export interface BugReportListResponse {
  data: BugReport[]
  meta: PaginationMeta
  links: PaginationLinks
}

/** Single resource response for GET /admin/bug-reports/getById/{id} */
export interface BugReportDetailResponse {
  data: BugReport
}

// ── Request payload types ─────────────────────────────────────────────────────

/** Body for POST /admin/bug-reports/create */
export interface CreateBugReportPayload {
  title: string
  description: string
  priority: BugReportPriority
  steps_to_reproduce?: string
  page_url?: string
  assigned_to?: number | null
}

/**
 * Body for PUT /admin/bug-reports/update/{id}.
 * Supports updating priority, status, and assigned_to.
 */
export interface UpdateBugReportPayload {
  priority?: BugReportPriority
  status?: BugReportStatus
  assigned_to?: number | null
}

/** Body for PUT /admin/bug-reports/assign/{id} */
export interface AssignBugReportPayload {
  assigned_to: number
}

// ── Filter params ─────────────────────────────────────────────────────────────

/**
 * Query parameters accepted by GET /admin/bug-reports/getAll.
 * All fields are optional — omitting them returns page 1 with the
 * default server per_page value.
 */
export interface BugReportFilters {
  status?: BugReportStatus
  priority?: BugReportPriority
  assigned_to?: number
  search?: string
  /** Allow-listed sort column: created_at | status | priority */
  sort?: string
  direction?: "asc" | "desc"
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

// ── Error types ───────────────────────────────────────────────────────────────

/**
 * Shape of a Laravel 422 Unprocessable Entity response.
 * The `errors` map has field names as keys and arrays of messages as values.
 */
export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}
