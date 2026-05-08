// ─── Audio Assignment Types ──────────────────────────────────────────────────
// Central place for all assignment-related TypeScript types used by:
// - API service
// - Zustand store
// - UI components

export interface AssignmentAudioRef {
  id: number
  name: string
}

export interface AssignmentUserRef {
  id: number
  name: string
  email: string
  manager?: {
    id: number
    name: string
    email: string
  } | null
}

export interface AssignmentByRef {
  id: number
  name: string
  email: string
}

export interface AudioAssignmentResource {
  id: number
  audio?: AssignmentAudioRef | null
  user?: AssignmentUserRef | null
  assigned_by?: AssignmentByRef | null
  assigned_at?: string | null
  notification_sent?: boolean
  created_at?: string | null
  updated_at?: string | null
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

export interface LaravelPaginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

// Filters available on GET /admin/audio-assignments/getAll
export interface AssignmentListFilters {
  page?: number
  per_page?: number
  search?: string
  audio_id?: number
  user_id?: number
}

// Payload expected by POST /admin/audio-assignments/create
export interface CreateAssignmentPayload {
  audio_id: number
  user_ids: number[]
  send_notification?: boolean
}

// Normalized create result used by UI after API response parsing
export interface CreateAssignmentResult {
  created: AudioAssignmentResource[]
  skippedUserIds: number[]
}

export interface AssignmentSummaryCard {
  key: string
  title: string
  value: number | string
}

export interface AssignmentListResult {
  data: AudioAssignmentResource[]
  links: PaginationLinks
  meta: PaginationMeta
  cards?: AssignmentSummaryCard[]
}

export interface AssignmentState {
  items: AudioAssignmentResource[]
  meta: PaginationMeta | null
  summaryCards: AssignmentSummaryCard[]
  isLoading: boolean
  error: string | null
  filters: AssignmentListFilters

  fetchAssignments: (filters?: AssignmentListFilters) => Promise<void>
  setFilters: (filters: AssignmentListFilters) => void
  createAssignment: (payload: CreateAssignmentPayload) => Promise<CreateAssignmentResult>
  deleteAssignment: (id: number) => Promise<void>
  clearError: () => void
}
