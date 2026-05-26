// ─── Resend Login Links — Types ───────────────────────────────────────────────

export type LinkStatus = "never_sent" | "expired"

// ── API shapes ────────────────────────────────────────────────────────────────

export interface AssignmentCourse {
  id: number
  name: string
  description?: string
  image_path?: string
  level?: string
  duration?: number
  status?: string
  privacy?: string
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface AssignmentUser {
  id: number
  name: string
  email: string
  /** null = link was never sent; ISO string (past) = link has expired */
  link_expires_at: string | null
}

export interface AssignedByUser {
  id: number
  name: string
}

export interface ExpiredLinkAssignment {
  id: number
  course_id: number
  user_id: number
  assigned_by: number
  course_availability_id: number | null
  assigned_at: string
  course: AssignmentCourse
  user: AssignmentUser
  assigned_by_user: AssignedByUser
  created_at: string
  updated_at: string
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

export interface ExpiredLinksListResponse {
  data: ExpiredLinkAssignment[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface ResendLinkResponse {
  message: string
}

// ── Filters (client-side) ─────────────────────────────────────────────────────

export interface ExpiredLinksFilters {
  /** "never_sent" | "expired" | undefined = all */
  linkStatus?: LinkStatus
  search?: string
  page?: number
}
