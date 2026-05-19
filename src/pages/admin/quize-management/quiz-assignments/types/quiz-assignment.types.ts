// ─── Quiz Assignment Types ────────────────────────────────────────────────────
// Central place for all quiz-assignment-related TypeScript types.

export interface QuizAssignmentQuizRef {
  id: number
  title: string
}

export interface QuizAssignmentUserRef {
  id: number
  name: string
  email: string
}

export interface QuizAssignmentByRef {
  id: number
  name: string
  email: string
}

export interface QuizAssignmentResource {
  id: number
  quiz_id?: number
  quiz_title?: string
  quiz?: QuizAssignmentQuizRef | null
  user?: QuizAssignmentUserRef | null
  assigned_by?: QuizAssignmentByRef | null
  assigned_at?: string | null
  notification_sent?: boolean
  created_at?: string | null
  updated_at?: string | null
}

// ── Pagination ────────────────────────────────────────────────────────────────

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

export interface LaravelPaginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface QuizAssignmentListFilters {
  page?: number
  per_page?: number
  quiz_id?: number
  user_id?: number
  notification_sent?: boolean | null
}

// ── Normalized list result ────────────────────────────────────────────────────

export interface QuizAssignmentListResult {
  data: QuizAssignmentResource[]
  meta: PaginationMeta
  links: PaginationLinks
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateQuizAssignmentPayload {
  quiz_id: number
  user_ids: number[]
  send_notification?: boolean
}

export interface CreateQuizAssignmentResult {
  created: QuizAssignmentResource[]
  skippedUserIds: number[]
}

// ── Zustand store shape ───────────────────────────────────────────────────────

export interface QuizAssignmentState {
  items: QuizAssignmentResource[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  filters: QuizAssignmentListFilters

  fetchAssignments: (filters?: QuizAssignmentListFilters) => Promise<void>
  setFilters: (filters: QuizAssignmentListFilters) => void
  createAssignment: (payload: CreateQuizAssignmentPayload) => Promise<CreateQuizAssignmentResult>
  deleteAssignment: (id: number) => Promise<void>
  clearError: () => void
}
