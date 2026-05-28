// ─── Online Course Assignment Types ─────────────────────────────────────────
// Types for admin-side online-course assignment management.

export interface OnlineCourseAssignmentUserRef {
  id: number
  name: string
  email: string
}

export interface OnlineCourseAssignmentCourseRef {
  id: number
  name: string
}

export interface OnlineCourseAssignmentAdminRef {
  id: number
  name: string
}

export interface OnlineCourseAssignmentResource {
  id: number
  assigned_at: string | null
  deadline: string | null
  is_overdue: boolean
  unassigned_at: string | null
  user: OnlineCourseAssignmentUserRef | null
  course: OnlineCourseAssignmentCourseRef | null
  assigned_by: OnlineCourseAssignmentAdminRef | null
  created_at: string | null
  updated_at: string | null
}

export interface OnlineCourseAssignmentSummaryCard {
  key: string
  title: string
  value: number
}

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

export interface OnlineCourseAssignmentListResponse {
  data: OnlineCourseAssignmentResource[]
  links: PaginationLinks
  meta: PaginationMeta
  cards: OnlineCourseAssignmentSummaryCard[]
}

export interface OnlineCourseAssignmentFilters {
  page?: number
  per_page?: number
  course_online_id?: number
  user_id?: number
  is_overdue?: boolean
}

export interface CreateOnlineCourseAssignmentPayload {
  course_online_id: number
  user_ids: number[]
  deadline?: string | null
  send_notification?: boolean | null
}

export interface CreateOnlineCourseAssignmentResult {
  data: OnlineCourseAssignmentResource[]
  meta: {
    created: number
    skipped: number
  }
}

export interface OnlineCourseAssignmentState {
  items: OnlineCourseAssignmentResource[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  summaryCards: OnlineCourseAssignmentSummaryCard[]
  isLoading: boolean
  error: string | null
  filters: OnlineCourseAssignmentFilters

  isCreating: boolean
  createError: string | null
  lastCreateMeta: { created: number; skipped: number } | null

  isDeleting: boolean
  deleteError: string | null

  fetchAssignments: (filters?: OnlineCourseAssignmentFilters) => Promise<void>
  setFilters: (filters: Partial<OnlineCourseAssignmentFilters>) => void
  createAssignments: (
    payload: CreateOnlineCourseAssignmentPayload,
  ) => Promise<CreateOnlineCourseAssignmentResult>
  deleteAssignment: (id: number) => Promise<void>

  clearError: () => void
  clearCreateError: () => void
  clearDeleteError: () => void
}
