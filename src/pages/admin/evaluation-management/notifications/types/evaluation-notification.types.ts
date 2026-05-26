// ─── Evaluation Notification Types ───────────────────────────────────────────
// All TypeScript shapes for the Evaluation Notifications feature.

// ── Shared primitives ─────────────────────────────────────────────────────────

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

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}

// ── Request payload ───────────────────────────────────────────────────────────

export interface EvaluationNotificationPayload {
  user_ids: number[]
  subject: string
  message: string
  start_date?: string
  end_date?: string
}

// ── Preview response ──────────────────────────────────────────────────────────

export interface EvaluationNotificationManager {
  id: number
  name: string
  email: string
}

export interface EvaluationNotificationPreviewData {
  managers: EvaluationNotificationManager[]
  employee_count: number
  evaluation_count: number
  date_range: {
    start: string | null
    end: string | null
  }
}

export interface EvaluationNotificationPreviewResponse {
  data: EvaluationNotificationPreviewData
}

// ── Send response ─────────────────────────────────────────────────────────────

export interface EvaluationNotificationSentManager {
  id: number
  email: string
  name?: string
}

export interface EvaluationNotificationFailedManager {
  id: number
  email: string
  name?: string
  error?: string
}

export interface EvaluationNotificationSendResponse {
  success_count: number
  failed_count: number
  sent_to: EvaluationNotificationSentManager[]
  failed_to: EvaluationNotificationFailedManager[]
}

// ── History item ──────────────────────────────────────────────────────────────

export interface EvaluationNotificationHistoryItem {
  id: number
  subject: string
  message?: string | null
  success_count?: number
  failed_count?: number
  sent_to?: EvaluationNotificationSentManager[] | null
  failed_to?: EvaluationNotificationFailedManager[] | null
  managers?: EvaluationNotificationManager[] | null
  employees?: EvaluationNotificationManager[] | null
  sent_at?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: string | null
  created_at?: string
  updated_at?: string | null
}

export interface EvaluationNotificationHistoryResponse {
  data: EvaluationNotificationHistoryItem[]
  links: PaginationLinks
  meta: PaginationMeta
}

// ── Client-side filter state ──────────────────────────────────────────────────

export interface EvaluationNotificationFilters {
  search: string
  status: string
  page: number
  per_page: number
}
